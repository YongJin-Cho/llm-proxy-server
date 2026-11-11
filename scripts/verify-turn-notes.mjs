import { strict as assert } from 'node:assert';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
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
seed('responses-turn', 'responses-traffic', 'responses', { input: [
  { type: 'function_call', name: 'search', call_id: 'call-1', arguments: '{"q":"it"}' },
  { type: 'function_call_output', call_id: 'call-1', output: '{"ok":true}' },
] }, { output: [] });
seed('chat-turn', 'chat-traffic', 'chat_completions', { messages: [
  { role: 'assistant', tool_calls: [{ id: 'call-2', type: 'function', function: { name: 'search', arguments: '{"q":"it"}' } }] },
  { role: 'tool', tool_call_id: 'call-2', content: '{"error":"Directory not found"}' },
] }, { choices: [] });
seed('messages-turn', 'messages-traffic', 'messages', { messages: [
  { role: 'assistant', content: [{ type: 'tool_use', id: 'call-3', name: 'search', input: { q: 'it' } }] },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'call-3', content: '{"error":"Directory not found"}' }] },
] }, { content: [] });
seed('empty-turn', 'empty-traffic', 'responses', { input: 'hello' }, { output_text: 'hello' });
const analysis = new TurnAnalysisService(store);
for (const id of ['responses-turn', 'chat-turn', 'messages-turn', 'empty-turn']) analysis.enqueue(id);
await new Promise((resolve) => setImmediate(resolve));
const responses = store.getTurnNote('responses-turn');
assert.equal(responses.status, 'ready');
assert.equal(responses.notes.length, 1);
assert.match(responses.notes[0].content, /Sequence.*Function.*Parameters.*Status/);
assert.match(responses.notes[0].content, /\| 1 \| search \|/);
const chat = store.getTurnNote('chat-turn');
assert.equal(chat.notes.length, 2);
assert.match(chat.notes[0].content, /\| Failed \|/);
assert.match(chat.notes[1].content, /Directory not found|search/);
assert.equal(chat.notes[1].call.function.name, 'search');
assert.deepEqual(chat.notes[1].result, { role: 'tool', tool_call_id: 'call-2', content: '{"error":"Directory not found"}' });
assert.equal(chat.notes[1].title, '도구 사용 오류 1: search');
const messages = store.getTurnNote('messages-turn');
assert.equal(messages.notes.length, 2);
assert.match(messages.notes[0].content, /Failed/);
assert.equal(store.getTurnNote('empty-turn').status, 'empty');
assert.equal(store.ensureTurnNotePending('responses-turn', 1), false);
assert.equal(store.listTurns(1, 20).data.find((turn) => turn.id === 'responses-turn').notes.status, 'ready');
const noteCard = readFileSync(new URL('../src/ui/components/NoteCard.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(noteCard, /Turn notes/);
assert.doesNotMatch(noteCard, /projection\.status/);
assert.match(noteCard, /if \(items\.length === 0\) return null/);
assert.match(noteCard, /items\.map/);
assert.match(noteCard, /className="card turn-note-card"/);
assert.match(noteCard, /ContentViewer label="call"/);
assert.match(noteCard, /ContentViewer label="result"/);
const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8');
assert.match(styles, /main \{ width: 100%; box-sizing: border-box;/);
assert.doesNotMatch(styles, /main \{ max-width: 1180px;/);
store.close();
rmSync(tempDir, { recursive: true, force: true });
console.log('Turn note verification passed: API-specific table extraction, error notes, idempotency, empty projection, and independent note cards.');
