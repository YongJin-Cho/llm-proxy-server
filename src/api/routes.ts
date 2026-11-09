import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../configuration.js';
import { TrafficLogQueryService } from '../application/log-query-service.js';
import { ProxyService } from '../application/proxy-service.js';

export function registerRoutes(app: FastifyInstance, config: AppConfig, query: TrafficLogQueryService, proxy: ProxyService) {
  const registerProxyRoute = (path: '/responses' | '/chat/completions' | '/messages') => {
    app.post(`/api/v1${path}`, async (request, reply) => { reply.hijack(); await proxy.handle(request.raw, reply.raw, request.body, path); });
  };
  registerProxyRoute('/responses');
  registerProxyRoute('/chat/completions');
  registerProxyRoute('/messages');
  app.get('/api/v1/logs', async (request, reply) => {
    const url = new URL(request.raw.url ?? '/', `http://${request.headers.host ?? config.host}`); const n = (name: string) => url.searchParams.get(name) || undefined;
    const limit = Math.min(Math.max(Number(n('limit') ?? 20), 1), 100); const offset = Math.max(Number(n('offset') ?? 0), 0);
    return reply.send(query.list({ status: n('status'), model: n('model'), from: n('from'), to: n('to'), limit, offset }));
  });
  app.get('/api/v1/logs/:id', async (request, reply) => { const row = query.get((request.params as { id: string }).id); return row ? reply.send(row) : reply.code(404).send({ error: { message: 'log not found' } }); });
}
