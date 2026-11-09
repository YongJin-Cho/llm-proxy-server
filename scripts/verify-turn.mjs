import { strict as assert } from 'node:assert';
import { TurnGroupingService } from '../dist/domain/turn.js';

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
console.log('Turn verification passed: unique match, missing/unmatched/ambiguous fallback isolation, sequence ordering, and lifecycle persistence.');
