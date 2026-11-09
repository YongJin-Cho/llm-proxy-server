import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
import { loadConfig } from './configuration.js';
import { ProxyService } from './application/proxy-service.js';
import { TrafficLogQueryService } from './application/log-query-service.js';
import { registerRoutes } from './api/routes.js';
import { SqliteTrafficLogStore } from './persistence/sqlite-traffic-log.js';

const config = loadConfig();
const logs = new SqliteTrafficLogStore(config.databasePath);
const app = Fastify({ logger: false });
const uiRoot = join(process.cwd(), 'dist', 'ui');

app.register(fastifyStatic, { root: uiRoot, wildcard: false });
registerRoutes(app, config, new TrafficLogQueryService(logs), new ProxyService(config, logs));
app.setNotFoundHandler(async (request, reply) => {
  if (request.method === 'GET' && (request.url === '/' || !request.url.startsWith('/api/'))) return reply.sendFile('ui/index.html');
  return reply.code(404).send({ error: { message: 'not found' } });
});

const shutdown = async () => { await app.close(); logs.close(); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

app.listen({ port: config.port, host: config.host }).then(() => {
  console.log(`LLM proxy listening on http://${config.host}:${config.port}`);
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
