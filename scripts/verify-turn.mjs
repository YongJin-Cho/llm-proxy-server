import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TurnGroupingService } from '../dist/domain/turn.js';
import { SqliteTrafficLogStore } from '../dist/persistence/sqlite-traffic-log.js';

const store = {
  turns: new Map(),
  traffic: [],
  createTurn(turn) { this.turns.set(turn.id, { ...turn, trafficCount: 0 }); },
  updateTurn(turn) { Object.assign(this.turns.get(turn.id), turn); },
  attachTraffic(entry) { this.traffic.push(entry); this.turns.get(entry.turnId).trafficCount += 1; },
};
const semantic = {
  hasToolContinuation: (request) => request.kind === 'tool-result',
  requestToolResultIds: (request) => request.ids ?? [],
  responseToolCallIds: (response) => response.toolCallIds ?? [],
};
const service = new TurnGroupingService(store);
const first = service.startTraffic({ trafficId: 'traffic-1', semantic, request: { kind: 'normal' }, now: '2026-03-10T00:00:00.000Z' });
service.finishTraffic({ turnId: first.turnId, semantic, response: { toolCallIds: ['call-1'] }, finishedAt: '2026-03-10T00:00:01.000Z' });
const unique = service.startTraffic({ trafficId: 'traffic-2', semantic, request: { kind: 'tool-result', ids: ['call-1'] }, now: '2026-03-10T00:00:02.000Z' });
assert.equal(unique.turnId, first.turnId);
service.finishTraffic({ turnId: unique.turnId, semantic, response: { toolCallIds: [] }, finishedAt: '2026-03-10T00:00:03.000Z' });

const missing = service.startTraffic({ trafficId: 'traffic-missing', semantic, request: { kind: 'tool-result', ids: [] }, now: '2026-03-10T00:00:04.000Z' });
assert.equal(missing.fallbackReason, 'missing_tool_identity');
const failed = service.startTraffic({ trafficId: 'traffic-failed', semantic, request: { kind: 'normal' }, now: '2026-03-10T00:00:04.500Z' });
service.finishTraffic({ turnId: failed.turnId, semantic, response: { toolCallIds: [] }, succeeded: false, finishedAt: '2026-03-10T00:00:04.700Z' });
assert.equal(store.turns.get(failed.turnId).status, 'in_progress');
const unmatched = service.startTraffic({ trafficId: 'traffic-unmatched', semantic, request: { kind: 'tool-result', ids: ['unknown'] }, now: '2026-03-10T00:00:05.000Z' });
assert.equal(unmatched.fallbackReason, 'unmatched_tool_identity');

const openA = service.startTraffic({ trafficId: 'traffic-open-a', semantic, request: { kind: 'normal' }, now: '2026-03-10T00:00:06.000Z' });
service.finishTraffic({ turnId: openA.turnId, semantic, response: { toolCallIds: ['duplicate'] }, finishedAt: '2026-03-10T00:00:07.000Z' });
const openB = service.startTraffic({ trafficId: 'traffic-open-b', semantic, request: { kind: 'normal' }, now: '2026-03-10T00:00:08.000Z' });
service.finishTraffic({ turnId: openB.turnId, semantic, response: { toolCallIds: ['duplicate'] }, finishedAt: '2026-03-10T00:00:09.000Z' });
const ambiguous = service.startTraffic({ trafficId: 'traffic-ambiguous', semantic, request: { kind: 'tool-result', ids: ['duplicate'] }, now: '2026-03-10T00:00:10.000Z' });
assert.equal(ambiguous.fallbackReason, 'ambiguous_tool_identity');
assert.notEqual(ambiguous.turnId, openA.turnId);
assert.notEqual(ambiguous.turnId, openB.turnId);
assert.deepEqual(store.traffic.map((entry) => entry.sequence), [...store.traffic.keys()].map((_, index) => index + 1));

const tempDir = mkdtempSync(join(tmpdir(), 'llm-proxy-turn-'));
const sqlitePath = join(tempDir, 'turns.sqlite');
const sqlite = new SqliteTrafficLogStore(sqlitePath);
sqlite.createTurn({ id: 'managed-turn', startedAt: '2026-03-10T00:01:00.000Z', status: 'in_progress' });
sqlite.insert({ id: 'managed-traffic', apiKind: 'responses', provider: null, startedAt: '2026-03-10T00:01:01.000Z', model: 'test-model', streaming: 0, requestJson: '{"input":"hello"}' });
sqlite.attachTraffic({ trafficId: 'managed-traffic', turnId: 'managed-turn', sequence: 1, fallbackReason: null });
sqlite.finish({ id: 'managed-traffic', finishedAt: '2026-03-10T00:01:02.000Z', status: 'completed', httpStatus: 200, latencyMs: 1000, responseJson: '{"output_text":"world"}', error: null, inputTokens: 2, outputTokens: 3, totalTokens: 5, costUsd: 0.01 });
sqlite.updateTurnMetadata('managed-turn', { title: 'Important turn', flag: true });
sqlite.updateTrafficMetadata('managed-traffic', { title: 'Request title', flag: true });
const managed = sqlite.listTurns(1, 20, 'flagged').data[0];
assert.equal(managed.title, 'Important turn');
assert.equal(managed.flag, 1);
assert.equal(managed.traffic[0].title, 'Request title');
assert.equal(managed.summary.start_user_input, 'hello');
assert.equal(managed.summary.end_ai_output, 'world');
assert.equal(managed.summary.usage.total_tokens, 5);
sqlite.updateTurnMetadata('managed-turn', { flag: false });
sqlite.createTurn({ id: 'protected-turn', startedAt: '2026-03-10T00:02:00.000Z', status: 'completed' });
sqlite.updateTurnMetadata('protected-turn', { flag: true });
assert.equal(sqlite.deleteUnflaggedTurnsOnPage(1, 20, 'all'), 1);
assert.equal(sqlite.get('managed-traffic'), undefined);
assert.notEqual(sqlite.listTurns(1, 20, 'all').data.find((node) => node.id === 'protected-turn'), undefined);
sqlite.deleteTurn('protected-turn');
sqlite.close();
rmSync(tempDir, { recursive: true, force: true });

const turnTree = readFileSync(new URL('../src/ui/components/TurnTree.tsx', import.meta.url), 'utf8');
const trafficPage = readFileSync(new URL('../src/ui/pages/TrafficPage.tsx', import.meta.url), 'utf8');
assert.match(turnTree, /turn-collapse[\s\S]*turn-flag[\s\S]*turn-title[\s\S]*turn-menu/);
assert.match(turnTree, /pagination-arrow/);
const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8');
assert.match(styles, /\.pagination-arrow, \.pagination-trash[^\n]*border: 0 !important; background: transparent !important;/);
assert.match(turnTree, /pagination-trash/);
assert.match(turnTree, /onDeleteUnflaggedPage/);
assert.match(turnTree, />rename<\//);
assert.match(turnTree, />delete<\//);
assert.equal(turnTree.includes('onRenameTraffic'), false);
assert.equal(turnTree.includes('traffic-rename'), false);
assert.match(turnTree, /nodes\.slice\(1\)/);
assert.match(trafficPage, /if \(!selection\.turn && result\.data\[0\]\)/);
assert.match(trafficPage, />All</);
assert.match(trafficPage, />Stored</);
assert.match(trafficPage, /aria-selected/);
assert.match(trafficPage, /deleteUnflaggedTurnsOnPage/);
assert.equal(trafficPage.includes('updateTrafficMetadata'), false);
assert.equal(trafficPage.includes('renameTraffic'), false);
console.log('Turn verification passed: grouping fallbacks, sequence ordering, metadata persistence, flagged filtering, unflagged page deletion, cascade deletion, and sidebar interaction contract.');
