import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, rename } from 'node:fs/promises';
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
const request = (url, options = {}) => fetch(url, options).then(async (response) => ({ status: response.status, body: await response.text() }));
const waitForStartup = (process, stderr) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`proxy startup timeout${stderr.value ? `\n${stderr.value}` : ''}`)), 5000);
  process.stdout.on('data', (chunk) => {
    if (chunk.toString().includes('LLM proxy listening')) { clearTimeout(timer); resolve(); }
  });
  process.once('error', reject);
  process.once('exit', (code, signal) => reject(new Error(`proxy exited before startup (code=${code}, signal=${signal})${stderr.value ? `\n${stderr.value}` : ''}`)));
});

const providerRequests = [];
const providerA = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    providerRequests.push({ provider: 'a', headers: req.headers, body: JSON.parse(body) });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'response-a', model: JSON.parse(body).model, output: [] }));
  });
});
const providerB = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    providerRequests.push({ provider: 'b', headers: req.headers, body: JSON.parse(body) });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'response-b', model: JSON.parse(body).model, output: [] }));
  });
});
const providerAPort = await listen(providerA);
const providerBPort = await listen(providerB);
const directory = await mkdtemp(join(tmpdir(), 'llm-proxy-verify-'));
const databasePath = join(directory, 'traffic.db');
const proxyPort = await reservePort();
const configPath = join(directory, 'config.json');
await writeFile(configPath, JSON.stringify({
  host: '127.0.0.1',
  port: proxyPort,
  databasePath,
  maxBodyBytes: 4096,
  providers: {
    alpha: { baseUrl: `http://127.0.0.1:${providerAPort}`, apiKeyEnv: 'ALPHA_KEY' },
    beta: { baseUrl: `http://127.0.0.1:${providerBPort}`, apiKeyEnv: 'BETA_KEY' },
  },
  models: {
    'client-alpha': { provider: 'alpha', providerModel: 'provider/alpha-model' },
    'client-beta': { provider: 'beta', providerModel: 'provider/beta-model' },
  },
}));
const projectRoot = new URL('..', import.meta.url);
const defaultConfig = new URL('config.json', projectRoot);
const backupConfig = new URL(`config.json.verify-backup-${process.pid}`, projectRoot);
await rename(defaultConfig, backupConfig);
await rename(configPath, defaultConfig);
const proxy = spawn(process.execPath, ['dist/server.js'], {
  cwd: projectRoot,
  env: { ...process.env, ALPHA_KEY: 'alpha-secret', BETA_KEY: 'beta-secret' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const stderr = { value: '' };
proxy.stderr.on('data', (chunk) => { stderr.value += chunk.toString(); });

try {
  await waitForStartup(proxy, stderr);
  const base = `http://127.0.0.1:${proxyPort}`;
  const alpha = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer client-secret' }, body: JSON.stringify({ model: 'client-alpha', input: 'hello' }) });
  assert.equal(alpha.status, 200);
  assert.equal(JSON.parse(alpha.body).id, 'response-a');
  const beta = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'client-beta', input: 'hello' }) });
  assert.equal(beta.status, 200);
  assert.equal(JSON.parse(beta.body).id, 'response-b');
  assert.deepEqual(providerRequests.map((entry) => [entry.provider, entry.body.model]), [['a', 'provider/alpha-model'], ['b', 'provider/beta-model']]);
  assert.equal(providerRequests[0].headers.authorization, 'Bearer alpha-secret');
  assert.equal(providerRequests[1].headers.authorization, 'Bearer beta-secret');

  const unknown = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'unknown-model', input: 'hello' }) });
  assert.equal(unknown.status, 400);
  assert.equal(providerRequests.length, 2);
  assert.doesNotMatch(unknown.body, /alpha-secret|beta-secret/);

  const list = await request(`${base}/api/v1/logs?status=completed&limit=10&offset=0`);
  assert.equal(list.status, 200);
  const listed = JSON.parse(list.body).data;
  assert.equal(listed.length, 2);
  const alphaLog = listed.find((entry) => entry.model === 'client-alpha');
  assert.ok(alphaLog);
  assert.match(alphaLog.request_json, /REDACTED/);
  assert.doesNotMatch(alphaLog.request_json, /client-secret/);
  console.log('Routing verification passed: two providers, provider model mapping, unknown model rejection, secret handling, and read/write boundaries.');
} finally {
  proxy.kill('SIGTERM');
  providerA.close();
  providerB.close();
  await rename(defaultConfig, configPath).catch(() => {});
  await rename(backupConfig, defaultConfig).catch(() => {});
  await rm(directory, { recursive: true, force: true });
}
