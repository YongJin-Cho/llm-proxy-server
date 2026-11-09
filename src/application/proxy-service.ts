import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { AppConfig, ProviderConfig } from '../configuration.js';
import { bounded, maskedHeaders } from '../domain/policy.js';
import type { TrafficLogWriter } from '../domain/traffic-log.js';
import { TurnGroupingService } from '../domain/turn.js';
import type { TurnStore } from '../domain/turn.js';
import { ChatCompletionsAdapter } from './proxy-adapters/chat-completions-adapter.js';
import { MessagesAdapter } from './proxy-adapters/messages-adapter.js';
import { ProxyAdapter, type ProxyApiPath } from './proxy-adapters/proxy-adapter.js';
import { ResponsesAdapter } from './proxy-adapters/responses-adapter.js';

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage, max: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > max) throw new Error('request body exceeds MAX_BODY_BYTES');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export class ProxyService {
  private readonly adapters: ReadonlyMap<ProxyApiPath, ProxyAdapter>;

  private readonly turns: TurnGroupingService;

  constructor(private readonly config: AppConfig, private readonly writer: TrafficLogWriter & TurnStore) {
    this.turns = new TurnGroupingService(writer);
    const adapters = [new ResponsesAdapter(), new ChatCompletionsAdapter(), new MessagesAdapter()];
    this.adapters = new Map(adapters.map((adapter) => [adapter.apiPath, adapter]));
  }

  async handle(req: IncomingMessage, res: ServerResponse, parsedBody?: unknown, apiPath: ProxyApiPath = '/responses') {
    const adapter = this.adapters.get(apiPath);
    if (!adapter) {
      json(res, 404, { error: { message: 'unsupported proxy API' } });
      return;
    }

    const started = Date.now();
    const id = randomUUID();
    const startedAt = new Date().toISOString();
    let inserted = false;
    let turnId: string | undefined;

    try {
      const raw = parsedBody === undefined ? await readBody(req, this.config.maxBodyBytes) : JSON.stringify(parsedBody);
      const input = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      const clientModel = typeof input.model === 'string' ? input.model : undefined;
      const route = this.resolveRoute(clientModel);
      if (!route) throw new Error('model routing is not configured');
      const upstreamBody = JSON.stringify({ ...input, model: route.providerModel });
      const streaming = input.stream === true;

      this.writer.insert({
        id,
        apiKind: adapter.apiKind,
        startedAt,
        model: clientModel ?? null,
        streaming: streaming ? 1 : 0,
        requestJson: bounded(JSON.stringify({ headers: maskedHeaders(req.headers), body: input }), this.config.maxBodyBytes),
      });
      inserted = true;
      const turn = this.turns.startTraffic({ trafficId: id, semantic: adapter.turnSemantic, request: input, now: startedAt });
      turnId = turn.turnId;

      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (route.provider.authMode === 'anthropic') {
        headers['x-api-key'] = route.provider.apiKey;
        headers['anthropic-version'] = route.provider.anthropicVersion!;
      } else {
        headers.authorization = `Bearer ${route.provider.apiKey}`;
      }
      const upstream = await fetch(adapter.providerEndpoint(route.provider), {
        method: 'POST',
        headers,
        body: upstreamBody,
      });
      if (streaming && upstream.body) return await this.stream(upstream, res, id, started, adapter, turnId);

      const response = await upstream.text();
      this.writer.finish({
        id,
        finishedAt: new Date().toISOString(),
        status: upstream.ok ? 'completed' : 'failed',
        httpStatus: upstream.status,
        latencyMs: Date.now() - started,
        responseJson: bounded(adapter.aggregateResponse(response), this.config.maxBodyBytes),
        error: upstream.ok ? null : bounded(response, this.config.maxBodyBytes),
        ...adapter.usageMetadata(response),
        });
        if (turnId) this.turns.finishTraffic({ turnId, semantic: adapter.turnSemantic, response: safeJson(adapter.aggregateResponse(response)), finishedAt: new Date().toISOString(), succeeded: upstream.ok });
        res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
      res.end(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'proxy request failed';
      const status = message.includes('body exceeds') ? 413 : message.startsWith('model ') ? 400 : message.startsWith('invalid provider') ? 500 : 502;
      if (inserted) {
        this.writer.finish({ id, finishedAt: new Date().toISOString(), status: 'failed', httpStatus: status, latencyMs: Date.now() - started, responseJson: null, error: bounded(message, this.config.maxBodyBytes), inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null });
      }
      if (turnId) {
        this.turns.finishTraffic({ turnId, semantic: adapter.turnSemantic, response: {}, finishedAt: new Date().toISOString(), succeeded: false });
      }
      json(res, status, { error: { message, type: status === 400 ? 'model_error' : status === 500 ? 'configuration_error' : 'proxy_error' } });
    }
  }

  private resolveRoute(clientModel: string | undefined): { provider: ProviderConfig; providerModel: string } | undefined {
    if (Object.keys(this.config.models).length === 0) return undefined;
    if (!clientModel) throw new Error('model is required when CONFIG_PATH routing is enabled');
    const route = this.config.models[clientModel];
    if (!route) throw new Error(`model ${clientModel} is not registered`);
    const provider = this.config.providers[route.provider];
    if (!provider) throw new Error(`invalid provider route for model ${clientModel}`);
    return { provider, providerModel: route.providerModel };
  }

  private async stream(upstream: Response, res: ServerResponse, id: string, started: number, adapter: ProxyAdapter, turnId?: string) {
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'text/event-stream' });
    const reader = upstream.body!.getReader();
    const chunks: Buffer[] = [];
    let disconnected = false;
    res.once('close', () => { disconnected = true; });
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        const buffer = Buffer.from(part.value);
        chunks.push(buffer);
        if (!disconnected) res.write(buffer);
      }
    } finally {
      reader.releaseLock();
    }
    const response = Buffer.concat(chunks).toString('utf8');
    const completed = upstream.ok && adapter.isComplete(response) && !disconnected;
    this.writer.finish({ id, finishedAt: new Date().toISOString(), status: completed ? 'completed' : 'failed', httpStatus: upstream.status, latencyMs: Date.now() - started, responseJson: bounded(adapter.aggregateResponse(response), this.config.maxBodyBytes), error: completed ? null : bounded(disconnected ? 'client disconnected before stream completion' : response || 'stream ended before completion', this.config.maxBodyBytes), ...adapter.usageMetadata(response) });
    if (turnId) this.turns.finishTraffic({ turnId, semantic: adapter.turnSemantic, response: safeJson(adapter.aggregateResponse(response)), finishedAt: new Date().toISOString(), succeeded: upstream.ok });
    if (!disconnected) res.end();
    }
    }

    function safeJson(value: string): unknown {
    try { return JSON.parse(value); } catch { return {};
    }
    }
