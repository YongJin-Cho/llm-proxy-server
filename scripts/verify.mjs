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
const streamResponse = (req, res, payload) => {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  if (req.url === '/messages') res.end('event: message_stop\ndata: {}\n\n');
  else if (req.url === '/chat/completions') res.end('data: {"choices":[]}\n\ndata: [DONE]\n\n');
  else res.end('data: {"type":"response.completed","usage":{"input_tokens":2,"output_tokens":1}}\n\ndata: [DONE]\n\n');
};
const providerA = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(body);
    providerRequests.push({ provider: 'a', path: req.url, headers: req.headers, body: payload });
    if (payload.stream === true) return streamResponse(req, res, payload);
    res.writeHead(200, { 'content-type': 'application/json' });
    const usage = req.url === '/chat/completions' ? { prompt_tokens: 3, completion_tokens: 2 } : { input_tokens: 3, output_tokens: 2 };
    res.end(JSON.stringify({ id: 'response-a', model: payload.model, output: [], choices: [], content: [], usage, cost_usd: 0.01 }));
  });
});
const providerB = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(body);
    providerRequests.push({ provider: 'b', path: req.url, headers: req.headers, body: payload });
    if (payload.stream === true) return streamResponse(req, res, payload);
    res.writeHead(200, { 'content-type': 'application/json' });
    const usage = req.url === '/messages' ? { input_tokens: 4, output_tokens: 1 } : { prompt_tokens: 4, completion_tokens: 1 };
    res.end(JSON.stringify({ id: 'response-b', model: payload.model, output: [], choices: [], content: [], usage }));
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
    beta: { baseUrl: `http://127.0.0.1:${providerBPort}`, apiKeyEnv: 'BETA_KEY', authMode: 'anthropic', anthropicVersion: '2023-06-01' },
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
  const ui = await request(`${base}/`);
  assert.equal(ui.status, 200);
  assert.match(ui.body, /<div id="root"><\/div>/);

  const alpha = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer client-secret' }, body: JSON.stringify({ model: 'client-alpha', input: 'hello' }) });
  assert.equal(alpha.status, 200);
  assert.equal(JSON.parse(alpha.body).id, 'response-a');
  const beta = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'client-beta', input: 'hello' }) });
  assert.equal(beta.status, 200);
  assert.equal(JSON.parse(beta.body).id, 'response-b');
  const chat = await request(`${base}/api/v1/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'client-alpha', messages: [{ role: 'user', content: 'hello' }] }) });
  assert.equal(chat.status, 200);
  const messages = await request(`${base}/api/v1/messages`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'client-beta', max_tokens: 10, messages: [{ role: 'user', content: 'hello' }] }) });
  assert.equal(messages.status, 200);
  assert.deepEqual(providerRequests.map((entry) => [entry.provider, entry.path, entry.body.model]), [['a', '/responses', 'provider/alpha-model'], ['b', '/responses', 'provider/beta-model'], ['a', '/chat/completions', 'provider/alpha-model'], ['b', '/messages', 'provider/beta-model']]);
  assert.equal(providerRequests[0].headers.authorization, 'Bearer alpha-secret');
  assert.equal(providerRequests[1].headers['x-api-key'], 'beta-secret');
  assert.equal(providerRequests[1].headers['anthropic-version'], '2023-06-01');

  for (const [path, model] of [['/responses', 'client-alpha'], ['/chat/completions', 'client-alpha'], ['/messages', 'client-beta']]) {
    const streamed = await request(`${base}/api/v1${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, stream: true, messages: [] }) });
    assert.equal(streamed.status, 200);
    assert.match(streamed.body, path === '/messages' ? /message_stop/ : /\[DONE\]/);
  }
  assert.equal(providerRequests.filter((entry) => entry.body.stream === true).length, 3);

  const unknown = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'unknown-model', input: 'hello' }) });
  assert.equal(unknown.status, 400);
  assert.equal(providerRequests.length, 7);
  assert.doesNotMatch(unknown.body, /alpha-secret|beta-secret/);

  const list = await request(`${base}/api/v1/logs?status=completed&limit=10&offset=0`);
  assert.equal(list.status, 200);
  const listed = JSON.parse(list.body).data;
  assert.equal(listed.length, 7);
  assert.equal(listed.filter((entry) => entry.status === 'completed').length, 7);
  const streamedLog = listed.find((entry) => entry.streaming === 1);
  assert.ok(streamedLog);
  assert.doesNotMatch(streamedLog.response_json, /data:\s/);
  assert.equal(listed.filter((entry) => entry.api_kind === 'responses').length, 3);
  const chatLog = listed.find((entry) => entry.api_kind === 'chat_completions' && entry.streaming === 0);
  const messagesLog = listed.find((entry) => entry.api_kind === 'messages' && entry.streaming === 0);
  assert.equal(chatLog.input_tokens, 3);
  assert.equal(chatLog.cost_usd, 0.01);
  assert.equal(messagesLog.total_tokens, 5);
  const alphaLog = listed.find((entry) => entry.model === 'client-alpha' && entry.request_json.includes('REDACTED'));
  assert.ok(alphaLog);
  assert.doesNotMatch(alphaLog.request_json, /client-secret/);
  console.log('Verification passed: UI entrypoint, three API routes, provider path mapping, usage/cost normalization, api_kind persistence, model rejection, secret handling, and read/write boundaries.');
} finally {
  proxy.kill('SIGTERM');
  providerA.close();
  providerB.close();
  await rename(defaultConfig, configPath).catch(() => {});
  await rename(backupConfig, defaultConfig).catch(() => {});
  await rm(directory, { recursive: true, force: true });
}
