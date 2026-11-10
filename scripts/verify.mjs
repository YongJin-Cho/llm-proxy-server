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
  if (req.url === '/chat/completions') res.end([
    'data: {"id":"chat-stream-1","object":"chat.completion.chunk","model":"provider/chat-model","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello "},"finish_reason":null}]}',
    'data: {"choices":[{"index":0,"delta":{"content":"world"},"finish_reason":null}]}',
    'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call-1","type":"function","function":{"name":"lookup","arguments":"{\\"q\\": "}}]},"finish_reason":null}]}',
    'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"test\\"}"}}]},"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":5,"completion_tokens":3}}',
    'data: [DONE]',
    '',
  ].join('\n\n'));
  else if (req.url === '/responses') res.end([
    'data: {"type":"response.created","response":{"id":"resp-stream-1","object":"response","model":"provider/response-model","output":[]}}',
    'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"message","role":"assistant","content":[]}}',
    'data: {"type":"response.output_text.delta","output_index":0,"delta":"Hello "}',
    'data: {"type":"response.output_text.delta","output_index":0,"delta":"Responses"}',
    'data: {"type":"response.output_item.added","output_index":1,"item":{"type":"function_call","id":"fc-1","call_id":"call-resp-1","name":"lookup","arguments":""}}',
    'data: {"type":"response.function_call_arguments.delta","output_index":1,"delta":"{\\"q\\": "}',
    'data: {"type":"response.function_call_arguments.delta","output_index":1,"delta":"\\"test\\"}"}',
    'data: {"type":"response.completed","response":{"id":"resp-stream-1","object":"response","model":"provider/response-model","output":[],"usage":{"input_tokens":2,"input_tokens_details":{"cached_tokens":1},"output_tokens":1,"cost":0.002}}}',
    'data: [DONE]',
    '',
  ].join('\n\n'));
  else res.end([
    'event: message_start\ndata: {"type":"message_start","message":{"id":"msg-stream-1","type":"message","role":"assistant","model":"provider/messages-model","content":[],"usage":{"input_tokens":4}}}',
    'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
    'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello "}}',
    'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Messages"}}',
    'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}',
    'event: content_block_start\ndata: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu-1","name":"lookup","input":{}}}',
    'event: content_block_delta\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"q\\": "}}',
    'event: content_block_delta\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"\\"test\\"}"}}',
    'event: content_block_stop\ndata: {"type":"content_block_stop","index":1}',
    'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"tool_use","stop_sequence":null},"usage":{"output_tokens":2}}',
    'event: message_stop\ndata: {"type":"message_stop"}',
    '',
  ].join('\n\n'));
};
const providerA = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(body);
    providerRequests.push({ provider: 'a', path: req.url, headers: req.headers, body: payload });
    if (payload.stream === true) return streamResponse(req, res, payload);
    res.writeHead(200, { 'content-type': 'application/json' });
    const usage = req.url === '/chat/completions' ? { prompt_tokens: 3, completion_tokens: 2, cost: 0.004 } : { input_tokens: 3, input_tokens_details: { cached_tokens: 2 }, output_tokens: 2, cost: 0.003 };
    res.end(JSON.stringify({ id: 'response-a', model: payload.model, output: [], choices: [], content: [], usage, cost_usd: 0.01, large_payload: 'r'.repeat(5000) }));
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

  const alpha = await request(`${base}/api/v1/responses`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer client-secret' }, body: JSON.stringify({ model: 'client-alpha', input: 'x'.repeat(3500) }) });
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

  const turns = await request(`${base}/api/v1/turns?page=1&limit=2`);
  assert.equal(turns.status, 200);
  const turnPage = JSON.parse(turns.body);
  assert.equal(turnPage.page, 1);
  assert.equal(turnPage.limit, 2);
  assert.equal(typeof turnPage.total, 'number');
  assert.equal(Array.isArray(turnPage.data), true);
  assert.equal(turnPage.data.every((node) => node.traffic.every((traffic) => !('request_json' in traffic) && !('response_json' in traffic))), true);
  assert.equal(turnPage.data.some((node) => node.summary.provider === 'alpha' && node.traffic.some((traffic) => traffic.provider === 'alpha')), true);

  const list = await request(`${base}/api/v1/logs?status=completed&limit=10&offset=0`);
  assert.equal(list.status, 200);
  const listed = JSON.parse(list.body).data;
  assert.equal(listed.length, 7);
  assert.equal(listed.filter((entry) => entry.status === 'completed').length, 7);
  const streamedLog = listed.find((entry) => entry.streaming === 1);
  assert.ok(streamedLog);
  assert.doesNotMatch(streamedLog.response_json, /data:\s/);
  const streamedChatLog = listed.find((entry) => entry.api_kind === 'chat_completions' && entry.streaming === 1);
  assert.ok(streamedChatLog);
  const streamedChatResponse = JSON.parse(streamedChatLog.response_json);
  assert.equal(streamedChatResponse.choices[0].message.role, 'assistant');
  assert.equal(streamedChatResponse.choices[0].message.content, 'Hello world');
  assert.equal(streamedChatResponse.choices[0].message.tool_calls[0].id, 'call-1');
  assert.equal(streamedChatResponse.choices[0].message.tool_calls[0].function.name, 'lookup');
  assert.equal(streamedChatResponse.choices[0].message.tool_calls[0].function.arguments, '{"q": "test"}');
  assert.equal(streamedChatResponse.choices[0].finish_reason, 'tool_calls');
  assert.equal(streamedChatResponse.usage.prompt_tokens, 5);
  const streamedResponsesLog = listed.find((entry) => entry.api_kind === 'responses' && entry.streaming === 1);
  assert.ok(streamedResponsesLog);
  const streamedResponsesResponse = JSON.parse(streamedResponsesLog.response_json);
  assert.equal(streamedResponsesResponse.output[0].content[0].text, 'Hello Responses');
  assert.equal(streamedResponsesResponse.output[1].call_id, 'call-resp-1');
  assert.equal(streamedResponsesResponse.output[1].name, 'lookup');
  assert.equal(streamedResponsesResponse.output[1].arguments, '{"q": "test"}');
  assert.equal(streamedResponsesResponse.usage.input_tokens, 2);
  assert.equal(streamedResponsesResponse.usage.input_tokens_details.cached_tokens, 1);
  const streamedMessagesLog = listed.find((entry) => entry.api_kind === 'messages' && entry.streaming === 1);
  assert.ok(streamedMessagesLog);
  const streamedMessagesResponse = JSON.parse(streamedMessagesLog.response_json);
  assert.equal(streamedMessagesResponse.content[0].type, 'text');
  assert.equal(streamedMessagesResponse.content[0].text, 'Hello Messages');
  assert.equal(streamedMessagesResponse.content[1].type, 'tool_use');
  assert.equal(streamedMessagesResponse.content[1].id, 'toolu-1');
  assert.equal(streamedMessagesResponse.content[1].name, 'lookup');
  assert.deepEqual(streamedMessagesResponse.content[1].input, { q: 'test' });
  assert.equal(streamedMessagesResponse.stop_reason, 'tool_use');
  assert.equal(streamedMessagesResponse.usage.input_tokens, 4);
  assert.equal(streamedMessagesResponse.usage.output_tokens, 2);
  assert.equal(listed.filter((entry) => entry.api_kind === 'responses').length, 3);
  const chatLog = listed.find((entry) => entry.api_kind === 'chat_completions' && entry.streaming === 0);
  const messagesLog = listed.find((entry) => entry.api_kind === 'messages' && entry.streaming === 0);
  assert.equal(chatLog.input_tokens, 3);
  assert.equal(chatLog.cost_usd, 0.004);
  const responsesLog = listed.find((entry) => entry.api_kind === 'responses' && entry.streaming === 0 && entry.model === 'client-alpha');
  assert.equal(responsesLog.input_tokens, 3);
  assert.equal(responsesLog.cached_input_tokens, 2);
  assert.equal(responsesLog.output_tokens, 2);
  assert.equal(responsesLog.total_tokens, 5);
  assert.equal(responsesLog.cost_usd, 0.003);
  assert.equal(messagesLog.total_tokens, 5);
  const alphaLog = listed.find((entry) => entry.model === 'client-alpha' && entry.request_json.includes('REDACTED'));
  assert.ok(alphaLog);
  assert.doesNotMatch(alphaLog.request_json, /client-secret/);
  const storedRequest = JSON.parse(alphaLog.request_json);
  assert.equal(storedRequest.body.input.length, 3500);
  const storedResponse = JSON.parse(alphaLog.response_json);
  assert.equal(storedResponse.large_payload.length, 5000);
  console.log('Verification passed: UI entrypoint, three API routes, provider path mapping, usage/cost normalization, api_kind persistence, model rejection, secret handling, and complete request/response JSON persistence.');
} finally {
  proxy.kill('SIGTERM');
  providerA.close();
  providerB.close();
  await rename(defaultConfig, configPath).catch(() => {});
  await rename(backupConfig, defaultConfig).catch(() => {});
  await rm(directory, { recursive: true, force: true });
}
