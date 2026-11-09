# Sprint 11 — Turn tree API·Sidebar UI·통합 검증 완성

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
Sprint 10에서 구현한 turn grouping backend를 운영 가능한 탐색 기능으로 완성한다. turn tree query API와 legacy projection을 제공하고, sidebar tree와 stable URL selection view를 연결하며, 전체 turn grouping·SSE·기존 API 회귀 검증과 실행 문서를 완료한다.

## Scope

| ID | Story |
|----|-------|
| PB-022 | Turn tree query API와 legacy projection |
| PB-023 | Sidebar tree와 turn/traffic selection view |
| PB-024 | Turn grouping 통합 검증과 실행 문서 |

**Out of sprint:** 승인 Spec에 없는 실시간 streaming transcript UI, 자동 refresh, 인증·권한, 고급 분석·차트, 기존 traffic retroactive grouping, 다중 proxy process 복구.

## Definition of Done
1. `GET /api/v1/turns`가 turn pagination, deterministic ordering, child traffic summary, fallback metadata, legacy synthetic node를 제공하고 traffic 본문은 기존 detail API로 지연 조회한다.
2. UI sidebar가 turn/traffic tree를 표시하고 stable URL state로 선택을 유지하며, turn summary와 기존 traffic detail을 렌더링하고 loading·empty·error·독립 detail fetch failure를 처리한다.
3. 동시 미완료 turn, out-of-order tool message, fallback isolation, completion, legacy projection, tree query, URL selection, SSE final/partial aggregate와 기존 API 회귀를 자동 검증한다.
4. `npm run build`와 `npm run verify`가 통과하고 `verification/llm-proxy-turn-traffic.md`와 실행 문서가 최신 구현 증거를 반영한다.
5. PB-022·PB-023·PB-024의 acceptance criteria가 승인 Spec R-004~R-008 및 C-003~C-005에 추적된다.

## Demo Checklist
- [ ] `/api/v1/turns`의 page/limit, metadata, deterministic ordering, child summary를 확인한다.
- [ ] legacy traffic이 synthetic single-traffic node로 표시되고 기존 logs API가 보존된다.
- [ ] sidebar에서 turn 선택과 traffic 선택이 stable URL state로 구분된다.
- [ ] turn summary와 traffic detail을 각각 표시하고 detail fetch 실패가 tree를 막지 않는다.
- [ ] loading·empty·error 상태와 browser refresh/back/forward를 확인한다.
- [ ] 전체 `npm run build`와 `npm run verify`를 통과한다.

## Approval
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 11 계획을 승인하고 Backlog→Implementation 실행을 시작했다.
