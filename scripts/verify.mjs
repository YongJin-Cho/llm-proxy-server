import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const reservePort = async () => {
  const server = createServer();
  const port = await listen(server);
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
};
const request = (url, options = {}) => fetch(url, options).then(async (response) => ({
  status: response.status,
  body: await response.text(),
}));

const provider = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'mock-response', model: JSON.parse(body).model, output: [] }));
  });
});
const providerPort = await listen(provider);
const directory = await mkdtemp(join(tmpdir(), 'llm-proxy-verify-'));
const databasePath = join(directory, 'traffic.db');
const proxyPort = await reservePort();
const proxy = spawn(process.execPath, ['dist/server.js'], {
  cwd: new URL('..', import.meta.url),
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(proxyPort),
    PROVIDER_URL: `http://127.0.0.1:${providerPort}/responses`,
    PROVIDER_API_KEY: 'provider-secret',
    SQLITE_PATH: databasePath,
    MAX_BODY_BYTES: '4096',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
proxy.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(
      `proxy startup timeout${stderr ? `\\n${stderr}` : ''}`,
    )), 5000);
    proxy.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('LLM proxy listening')) { clearTimeout(timer); resolve(); }
    });
    proxy.once('error', reject);
    proxy.once('exit', (code, signal) => reject(new Error(
      `proxy exited before startup (code=${code}, signal=${signal})${stderr ? `\\n${stderr}` : ''}`,
    )));
  });

  const base = `http://127.0.0.1:${proxyPort}`;
  const response = await request(`${base}/api/v1/responses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer client-secret' },
    body: JSON.stringify({ model: 'mock-model', input: 'hello' }),
  });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.body).id, 'mock-response');

  const list = await request(`${base}/api/v1/logs?status=completed&model=mock-model&limit=1&offset=0`);
  assert.equal(list.status, 200);
  const listed = JSON.parse(list.body).data;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].model, 'mock-model');
  assert.match(listed[0].request_json, /REDACTED/);
  assert.doesNotMatch(listed[0].request_json, /client-secret/);

  const from = encodeURIComponent(new Date(Date.now() - 60_000).toISOString());
  const to = encodeURIComponent(new Date(Date.now() + 60_000).toISOString());
  const filtered = await request(`${base}/api/v1/logs?from=${from}&to=${to}`);
  assert.equal(JSON.parse(filtered.body).data.length, 1);

  const detail = await request(`${base}/api/v1/logs/${listed[0].id}`);
  assert.equal(detail.status, 200);
  assert.equal(JSON.parse(detail.body).id, listed[0].id);
  console.log('Integration verification passed: proxy, SQLite persistence, masking, date filters, pagination, and detail lookup.');
} finally {
  proxy.kill('SIGTERM');
  provider.close();
  await rm(directory, { recursive: true, force: true });
}
