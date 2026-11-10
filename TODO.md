# TODO: LLM Proxy Server — Turn 관리·메타데이터·탐색·요약 구현

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-13 — [Turn 관리·메타데이터·탐색·요약 구현](./scrum/sprint-13.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 7 | 1 | 0 | 0 |

**Sprint goal:** 승인된 Turn 관리·분석 UI Spec의 첫 구현 slice로 관리 메타데이터·삭제, filter/pagination, summary/usage projection을 구현·검증한다.
**Current focus:** T-008
**Recommended next:** T-008 — Sprint Boundary → next implementation sprint

## Tasks

- [x] **T-001** — PB-025 관리 메타데이터·turn cascade 삭제 구현
  - Phase: implementation
  - Artifact: `src/domain/`, `src/persistence/`, `src/api/`, `src/ui/`
  - Depends: —
  - Notes: Spec R-001~R-002, C-003. 제목·flag 저장, turn 단위 물리 삭제와 child cascade transaction, traffic 단독 삭제 금지를 구현했다. SQLite migration, PATCH/DELETE API와 TurnTree actions를 추가했다.

- [x] **T-002** — PB-025 persistence/API/UI self-check
  - Phase: verification
  - Artifact: `scripts/verify-turn.mjs`, `src/`
  - Depends: T-001
  - Notes: migration/schema, writer/query API, UI mutation과 삭제 cascade를 `scripts/verify-turn.mjs` fixture로 검증했다. `npm run build`와 `npm run verify`가 통과했다.

- [x] **T-003** — PB-026 서버 filter·pagination·mutation refresh 구현
  - Phase: implementation
  - Artifact: `src/application/`, `src/api/`, `src/ui/`
  - Depends: T-002
  - Notes: Spec R-003~R-004. all/flagged 서버 filter, turn 단위 pagination, mutation 후 재조회와 빈 page 보정을 구현했다.

- [x] **T-004** — PB-026 filter/pagination self-check
  - Phase: verification
  - Artifact: `scripts/verify-turn.mjs`, `src/`
  - Depends: T-003
  - Notes: filter/page metadata, child non-pagination, flag/delete mutation refresh를 `npm run build`와 `npm run verify`로 검증했다.

- [x] **T-005** — PB-027 turn summary·usage/cost projection 구현
  - Phase: implementation
  - Artifact: `src/application/`, `src/api/`, `src/ui/`
  - Depends: T-004
  - Notes: Spec R-005~R-006. 서버 summary DTO와 UI summary card를 구현했다. 시작 input/종료 output 추출, usage/cost 합산, null/partial 상태를 포함하고 execution environment는 저장 source가 없어 null로 표시한다.

- [x] **T-006** — PB-027 summary/usage self-check
  - Phase: verification
  - Artifact: `scripts/verify-turn.mjs`, `src/`
  - Depends: T-005
  - Notes: completed summary input/output, usage total, metadata persistence, flagged filter, cascade deletion과 기존 회귀를 `npm run build`/`npm run verify`로 검증했다.

- [x] **T-007** — Sprint 13 regression demo
  - Phase: demo
  - Artifact: `scripts/verify.mjs`, `scripts/verify-turn.mjs`
  - Depends: T-006
  - Notes: 기존 API/UI entrypoint, tree grouping/fallback, metadata/filter/cascade, summary projection과 `npm run build`/`npm run verify`를 통과했다. `AGENTS.md` verification guide와 Notes를 갱신했다.

- [ ] **T-008** — Sprint Boundary → next implementation sprint
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-13.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007
  - Notes: archive board, update backlog, plan next implementation slice

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
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
| 12 | Turn 관리·분석 UI 요구사항 및 구현 백로그 확정 | 2026-03-10 | [`TODO-12.md`](./scrum/TODO-12.md) |

## Notes

- 2026-03-10: Sprint 13 계획 승인 후 live implementation board를 seed했다. 제품 코드 Execute를 시작한다.
