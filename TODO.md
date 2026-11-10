# TODO: LLM Proxy Server — Turn tree API·Sidebar UI·통합 검증 완성

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-11 — [Turn tree API·Sidebar UI·통합 검증 완성](./scrum/sprint-11.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 4 | 1 | 0 | 0 |

**Sprint goal:** turn tree query API와 sidebar UI를 구현하고 전체 turn grouping·SSE·기존 API 회귀 검증을 완료한다.
**Current focus:** T-005
**Recommended next:** T-005 — Sprint Boundary → sprint-12

## Tasks

- [x] **T-001** — PB-022 turn tree query API와 legacy projection 구현
  - Phase: implementation
  - Artifact: `src/domain/turn.ts`, `src/application/log-query-service.ts`, `src/api/routes.ts`, `src/persistence/sqlite-traffic-log.ts`
  - Depends: —
  - Notes: `GET /api/v1/turns`의 page/limit, deterministic ordering, child traffic summary, fallback metadata와 legacy synthetic node를 구현했다. `npm run build`와 `npm run verify` 통과. 승인 Spec R-004~R-005, C-003~C-005를 따른다.

- [x] **T-002** — PB-023 sidebar tree와 turn/traffic selection view 구현
  - Phase: implementation
  - Artifact: `src/ui/data-query/`, `src/ui/pages/`, `src/ui/components/`, `src/ui/types.ts`
  - Depends: T-001
  - Notes: tree query, stable URL selection, turn summary, 기존 LogDetail, loading/empty/error와 독립 detail fetch failure를 구현했다. `npm run build`와 `npm run verify` 통과. 승인 Spec R-006~R-007을 따른다.

- [x] **T-003** — PB-024 turn grouping 통합 검증과 실행 문서 갱신
  - Phase: verification
  - Artifact: `scripts/verify.mjs`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-traffic.md`, `README.md`
  - Depends: T-001, T-002
  - Notes: `npm run build`와 `npm run verify` 통과. turn concurrency, out-of-order tool message, fallback isolation, completion, legacy projection, tree query, body-free child summary, SSE aggregate와 기존 API 회귀를 검증했다. URL selection contract는 `turn`/`traffic` query state와 `popstate` handling으로 기록했다.

- [x] **T-004** — Sprint 11 Demo Checklist 실행 및 handoff
  - Phase: demo
  - Artifact: `verification/llm-proxy-turn-traffic.md`
  - Depends: T-003
  - Notes: `/api/v1/turns` page/limit·metadata·body-free child summary, legacy projection, `turn`/`traffic` URL selection contract, browser `popstate`, loading/error 처리, `npm run build`와 `npm run verify` evidence를 기록했다.

- [ ] **T-005** — Sprint Boundary → sprint-12
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-11.md`
  - Depends: T-001, T-002, T-003, T-004
  - Notes: Sprint 11 completion 승인 후 archive하고 PB-022~PB-024 상태를 갱신한다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|---------|--------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./scrum/TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`TODO-01.md`](./scrum/TODO-01.md) |
| 02 | 확장 가능한 아키텍처 설계와 백로그 갱신 | 2026-03-10 | [`TODO-02.md`](./scrum/TODO-02.md) |
| 03 | 승인된 구조 기반 UI 구현과 검증 기반 구축 | 2026-03-10 | [`TODO-03.md`](./scrum/TODO-03.md) |
| 04 | 모듈 분리·소스 구조 정리와 실행 검증 완성 | 2026-03-10 | [`TODO-04.md`](./scrum/TODO-04.md) |
| 05 | Provider 라우팅과 로그 access 경계 완성 | 2026-03-10 | [`TODO-05.md`](./scrum/TODO-05.md) |
| 06 | 확장 가능한 모니터링 UI 구조 완성 | 2026-03-10 | [`TODO-06.md`](./scrum/TODO-06.md) |
| 07 | Chat Completions·Claude Messages 지원 요구사항 확정 | 2026-03-10 | [`TODO-07.md`](./scrum/TODO-07.md) |
| 08 | 다중 API 프록시 구현 | 2026-03-10 | [`TODO-08.md`](./scrum/TODO-08.md) |
| 09 | Turn 기반 traffic 그룹핑·탐색 요구사항 확정 | 2026-03-10 | [`TODO-09.md`](./scrum/TODO-09.md) |
| 10 | Turn grouping backend과 SSE aggregate 구현 | 2026-03-10 | [`TODO-10.md`](./scrum/TODO-10.md) |
| 11 | Turn tree API·Sidebar UI·통합 검증 완성 | 2026-03-10 | [`TODO-11.md`](./scrum/TODO-11.md) |

## Notes

- 2026-03-10: Sprint 11 계획 승인. PB-022·PB-023·PB-024를 Scope로 커밋하고 T-001부터 실행한다.
- 2026-03-10: Sprint 11 완료 승인 후 Boundary를 실행했다. PB-022·PB-023·PB-024를 종료하고 sprint-11을 보관했다. 다음 sprint-12 계획은 아직 없어 라이브 보드는 다음 계획 승인 후 재시드한다.
