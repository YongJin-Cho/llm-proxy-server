import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SqliteTrafficLogStore } from '../dist/persistence/sqlite-traffic-log.js';
import { TurnAnalysisService } from '../dist/application/turn-analysis-service.js';

const tempDir = mkdtempSync(join(tmpdir(), 'llm-proxy-turn-notes-'));
const store = new SqliteTrafficLogStore(join(tempDir, 'notes.sqlite'));
const seed = (turnId, trafficId, apiKind, request, response) => {
  store.createTurn({ id: turnId, startedAt: '2026-03-10T00:00:00.000Z', status: 'completed' });
  store.insert({ id: trafficId, apiKind, provider: 'test', startedAt: '2026-03-10T00:00:01.000Z', model: 'test-model', streaming: 0, requestJson: JSON.stringify({ body: request }) });
  store.attachTraffic({ trafficId, turnId, sequence: 1, fallbackReason: null });
  store.finish({ id: trafficId, finishedAt: '2026-03-10T00:00:02.000Z', status: 'completed', httpStatus: 200, latencyMs: 1000, responseJson: JSON.stringify(response), error: null, inputTokens: 1, outputTokens: 1, totalTokens: 2, costUsd: null });
};
seed('responses-turn', 'responses-traffic', 'responses', { input: [{ role: 'user', content: [{ type: 'input_text', text: 'find it' }] }] }, { output: [{ type: 'function_call', name: 'search', call_id: 'call-1', arguments: '{"q":"it"}' }] });
seed('chat-turn', 'chat-traffic', 'chat_completions', { messages: [{ role: 'user', content: 'find it' }] }, { choices: [{ message: { role: 'assistant', tool_calls: [{ id: 'call-2', function: { name: 'search', arguments: '{"q":"it"}' } }] } }] });
seed('messages-turn', 'messages-traffic', 'messages', { messages: [{ role: 'user', content: [{ type: 'text', text: 'find it' }] }] }, { role: 'assistant', content: [{ type: 'tool_use', id: 'call-3', name: 'search', input: { q: 'it' } }] });
seed('empty-turn', 'empty-traffic', 'responses', { input: 'hello' }, { output_text: 'hello' });
const analysis = new TurnAnalysisService(store);
analysis.enqueue('responses-turn');
analysis.enqueue('chat-turn');
analysis.enqueue('messages-turn');
analysis.enqueue('empty-turn');
await new Promise((resolve) => setImmediate(resolve));
for (const id of ['responses-turn', 'chat-turn', 'messages-turn']) {
  const note = store.getTurnNote(id);
  assert.equal(note.status, 'ready');
  assert.equal(note.notes[0].title, '도구 사용 이력');
  assert.match(note.notes[0].content, /search/);
}
assert.equal(store.getTurnNote('empty-turn').status, 'empty');
assert.equal(store.ensureTurnNotePending('responses-turn', 1), false);
assert.equal(store.listTurns(1, 20).data.find((turn) => turn.id === 'responses-turn').notes.status, 'ready');
store.close();
rmSync(tempDir, { recursive: true, force: true });
console.log('Turn note verification passed: API adapters, Markdown notes, empty state, projection persistence, and idempotency.');
