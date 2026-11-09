# Sprint 10 — Turn grouping backend과 SSE aggregate 구현

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
승인된 turn traffic Spec의 backend 핵심을 구현한다. API adapter semantic 결과를 기반으로 turn lifecycle과 tool identity matching/fallback isolation을 저장 경계에 연결하고, 기존 SSE final/partial aggregate 계약이 turn traffic 저장과 함께 보존되는지 검증한다.

## Scope

| ID | Story |
|----|-------|
| PB-020 | Turn grouping domain·persistence lifecycle 구현 |
| PB-021 | Tool identity matching과 fallback isolation |

**Out of sprint:** `PB-022` tree query API, `PB-023` sidebar UI, `PB-024` 전체 통합 검증·실행 문서. 단, PB-020/PB-021의 backend DoD에 필요한 SSE final aggregate, failed partial aggregate, completion/failure 회귀 검증은 포함한다.

## Definition of Done
1. PB-020의 stable turn/traffic identifier, turn reference, 관찰 sequence, 진행·완료 상태, 미완료 turn pool이 승인 Spec R-001~R-003 및 C-001~C-006에 맞게 domain·writer·SQLite 경계에 구현된다.
2. PB-021의 유일 매칭, `missing_tool_identity`, `unmatched_tool_identity`, `ambiguous_tool_identity` fallback isolation이 승인 Spec R-001/R-002/C-007에 맞게 구현된다. fallback traffic은 upstream 전달·저장되고 기존 미완료 turn은 변경되지 않는다.
3. 기존 API adapter SSE contract를 보존한다. 정상 종료 시 final aggregate 하나를, upstream failure/client disconnect 시 failed partial aggregate 하나를 저장하며 원본 SSE bytes를 client에 전달한다.
4. 구현은 `TrafficLogWriter`/`TrafficLogReader` access boundary와 기존 legacy traffic compatibility를 깨뜨리지 않는다.
5. 동시 미완료 turn, out-of-order tool message, unique match, 세 fallback reason, completion, SSE final/partial aggregate를 자동 검증하고 `npm run build` 및 `npm run verify`를 통과한다.

## Demo Checklist
- [ ] 두 개 이상의 미완료 turn을 동시에 유지하고 tool identity로 올바른 turn에 연결한다.
- [ ] tool message 순서가 tool call 순서와 달라도 ID 기준으로 매칭한다.
- [ ] missing/unmatched/ambiguous identity가 각각 새 standalone turn과 고정 fallback reason으로 격리된다.
- [ ] fallback request가 거부되지 않고 upstream 전달·저장되며 기존 turn이 보존된다.
- [ ] streaming 정상 종료의 final aggregate와 중단 시 failed partial aggregate를 확인한다.
- [ ] `npm run build`와 `npm run verify`가 통과한다.

## Approval
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 10 계획을 승인하고 Backlog→Implementation 실행을 시작했다.
