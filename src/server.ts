import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

const config = {
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3000),
  providerUrl: process.env.PROVIDER_URL ?? 'https://api.openai.com/v1/responses',
  providerApiKey: process.env.PROVIDER_API_KEY ?? '',
  databasePath: process.env.SQLITE_PATH ?? './data/traffic.db',
  maxBodyBytes: Number(process.env.MAX_BODY_BYTES ?? 65536),
};

mkdirSync(dirname(config.databasePath), { recursive: true });
const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS traffic_logs (
  id TEXT PRIMARY KEY, started_at TEXT NOT NULL, finished_at TEXT,
  status TEXT NOT NULL, http_status INTEGER, model TEXT, streaming INTEGER NOT NULL,
  latency_ms INTEGER, request_json TEXT, response_json TEXT, error TEXT
)`);

const insertLog = db.prepare(`INSERT INTO traffic_logs
  (id, started_at, status, http_status, model, streaming, request_json)
  VALUES (@id, @startedAt, 'pending', NULL, @model, @streaming, @requestJson)`);
const finishLog = db.prepare(`UPDATE traffic_logs SET finished_at=@finishedAt, status=@status,
  http_status=@httpStatus, latency_ms=@latencyMs, response_json=@responseJson, error=@error WHERE id=@id`);

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
function maskedHeaders(req: IncomingMessage) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    result[key] = /authorization|api[-_]key|cookie|set-cookie/i.test(key) ? '[REDACTED]' : String(value);
  }
  return result;
}
function bounded(value: string) {
  return value.length <= config.maxBodyBytes ? value : value.slice(0, config.maxBodyBytes);
}
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > config.maxBodyBytes) throw new Error('request body exceeds MAX_BODY_BYTES');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}
function listLogs(url: URL) {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 100);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);
  const clauses: string[] = []; const params: Record<string, unknown> = {};
  for (const field of ['status', 'model'] as const) {
    const value = url.searchParams.get(field); if (value) { clauses.push(`${field} = @${field}`); params[field] = value; }
  }
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (from) { clauses.push('started_at >= @from'); params.from = from; }
  if (to) { clauses.push('started_at <= @to'); params.to = to; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM traffic_logs ${where} ORDER BY started_at DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });
  return { data: rows, limit, offset };
}
async function proxy(req: IncomingMessage, res: ServerResponse) {
  const started = Date.now(); const id = randomUUID(); const startedAt = new Date().toISOString();
  let raw = '';
  try {
    raw = await readBody(req);
    const input = raw ? JSON.parse(raw) : {};
    const streaming = input.stream === true;
    insertLog.run({ id, startedAt, model: typeof input.model === 'string' ? input.model : null, streaming: streaming ? 1 : 0, requestJson: bounded(JSON.stringify({ headers: maskedHeaders(req), body: input })) });
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (config.providerApiKey) headers.authorization = `Bearer ${config.providerApiKey}`;
    const upstream = await fetch(config.providerUrl, { method: 'POST', headers, body: raw });
    if (streaming && upstream.body) {
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'text/event-stream' });
      const reader = upstream.body.getReader();
      const chunks: Buffer[] = [];
      let clientDisconnected = false;
      res.once('close', () => { clientDisconnected = true; });

      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          const buffer = Buffer.from(part.value);
          chunks.push(buffer);
          if (!clientDisconnected) res.write(buffer);
        }
      } finally {
        reader.releaseLock();
      }

      const response = Buffer.concat(chunks).toString('utf8');
      const normalCompletion = response.includes('response.completed') || response.includes('data: [DONE]');
      const completed = upstream.ok && normalCompletion && !clientDisconnected;
      finishLog.run({
        id,
        finishedAt: new Date().toISOString(),
        status: completed ? 'completed' : 'failed',
        httpStatus: upstream.status,
        latencyMs: Date.now() - started,
        responseJson: bounded(response),
        error: completed ? null : bounded(clientDisconnected ? 'client disconnected before stream completion' : response || 'stream ended before completion'),
      });
      if (!clientDisconnected) res.end();
      return;
    }
    const response = await upstream.text();
    finishLog.run({ id, finishedAt: new Date().toISOString(), status: upstream.ok ? 'completed' : 'failed', httpStatus: upstream.status, latencyMs: Date.now() - started, responseJson: bounded(response), error: upstream.ok ? null : bounded(response) });
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' }); res.end(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'proxy request failed';
    try { finishLog.run({ id, finishedAt: new Date().toISOString(), status: 'failed', httpStatus: 502, latencyMs: Date.now() - started, responseJson: null, error: bounded(message) }); } catch { /* log insert may have failed */ }
    json(res, message.includes('body exceeds') ? 413 : 502, { error: { message, type: 'proxy_error' } });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? config.host}`);
  if (req.method === 'POST' && url.pathname === '/api/v1/responses') return proxy(req, res);
  if (req.method === 'GET' && url.pathname === '/api/v1/logs') return json(res, 200, listLogs(url));
  if (req.method === 'GET' && url.pathname.startsWith('/api/v1/logs/')) {
    const row = db.prepare('SELECT * FROM traffic_logs WHERE id = ?').get(url.pathname.split('/').pop());
    return row ? json(res, 200, row) : json(res, 404, { error: { message: 'log not found' } });
  }
  if (url.pathname === '/') return json(res, 200, { name: 'llm-proxy-server', api: '/api/v1/responses' });
  json(res, 404, { error: { message: 'not found' } });
});
server.listen(config.port, config.host, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : config.port;
  console.log(`LLM proxy listening on http://${config.host}:${port}`);
});
