import type { FastifyInstance } from 'fastify';
import { parseLogListQuery, parseMetadataUpdate, parseTurnListQuery } from './input-adapters.js';
import type { AppConfig } from '../configuration.js';
import { TrafficLogQueryService } from '../application/log-query-service.js';
import { proxyApiPaths } from '../application/api-adapters.js';
import { ProxyService } from '../application/proxy-service.js';

export function registerRoutes(app: FastifyInstance, config: AppConfig, query: TrafficLogQueryService, proxy: ProxyService) {
  const registerProxyRoute = (path: (typeof proxyApiPaths)[number]) => {
    app.post(`/api/v1${path}`, async (request, reply) => { reply.hijack(); await proxy.handle(request.raw, reply.raw, request.body, path); });
  };
  for (const path of proxyApiPaths) registerProxyRoute(path);
  app.get('/api/v1/turns', async (request, reply) => {
    const url = new URL(request.raw.url ?? '/', `http://${request.headers.host ?? config.host}`);
    const { page, limit, filter } = parseTurnListQuery(url);
    return reply.send(query.listTurns(page, limit, filter));
    });
    app.delete('/api/v1/turns/page', async (request, reply) => {
    const url = new URL(request.raw.url ?? '/', `http://${request.headers.host ?? config.host}`);
    const { page, limit, filter } = parseTurnListQuery(url);
    return reply.send({ deleted: query.deleteUnflaggedTurnsOnPage(page, limit, filter) });
    });
    app.patch('/api/v1/turns/:id', async (request, reply) => {
    query.updateTurnMetadata((request.params as { id: string }).id, parseMetadataUpdate(request.body));
    return reply.code(204).send();
    });
    app.delete('/api/v1/turns/:id', async (request, reply) => {
    query.deleteTurn((request.params as { id: string }).id);
    return reply.code(204).send();
    });
    app.patch('/api/v1/logs/:id', async (request, reply) => {
    query.updateTrafficMetadata((request.params as { id: string }).id, parseMetadataUpdate(request.body));
    return reply.code(204).send();
  });
  app.get('/api/v1/logs', async (request, reply) => {
    const url = new URL(request.raw.url ?? '/', `http://${request.headers.host ?? config.host}`); const n = (name: string) => url.searchParams.get(name) || undefined;
    return reply.send(query.list(parseLogListQuery(url)));
  });
  app.get('/api/v1/logs/:id', async (request, reply) => { const row = query.get((request.params as { id: string }).id); return row ? reply.send(row) : reply.code(404).send({ error: { message: 'log not found' } }); });
}
