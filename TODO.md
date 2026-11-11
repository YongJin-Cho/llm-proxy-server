# TODO: LLM Proxy Server — API adapter boundary and code quality improvement

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-17 — [API adapter 경계와 코드 품질 개선](./scrum/sprint-17.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 6 | 0 | 0 | 0 |

**Sprint goal:** API schema 의존성을 adapter 경계 안에 가두고 persistence·domain·route의 역할을 정리하면서 기존 동작과 회귀 검증을 보존한다.
**Current focus:** —
**Recommended next:** —

## Tasks

- [x] **T-001** — 공통 ProxyAdapter schema 누수 제거
  - Phase: implementation
  - Artifact: `src/application/proxy-adapters/proxy-adapter.ts`, `src/application/proxy-adapters/*-adapter.ts`
  - Depends: —
  - Notes: PB-037. 공통 base에서 API별 payload shape 추측을 제거하고 concrete adapter가 aggregate 결과를 책임지도록 했다. Build 통과.

- [x] **T-002** — API별 turn summary projector와 persistence 경계 분리
  - Phase: implementation
  - Artifact: `src/application/proxy-adapters/`, `src/application/turn-summary-projectors/`, `src/persistence/sqlite-traffic-log.ts`
  - Depends: T-001
  - Notes: PB-038. `ApiTurnSummaryProjector`를 application에 도입하고 SQLite store에 port로 주입했다. Build/verify 통과.

- [x] **T-003** — Adapter registry 및 transport helper 정리
  - Phase: implementation
  - Artifact: `src/application/api-adapters.ts`, `src/application/proxy-adapters/shared.ts`, `src/api/routes.ts`, `src/application/proxy-service.ts`, `src/application/turn-analysis-service.ts`
  - Depends: T-001
  - Notes: PB-039. `api-adapters.ts` registry를 route/proxy/analysis에 공유하고 SSE parser·utility 중복을 `shared.ts`로 통합했다. Build/verify 통과.

- [x] **T-004** — 분석·주입·HTTP 입력 경계 개선
  - Phase: implementation
  - Artifact: `src/domain/turn-notes.ts`, `src/application/proxy-service.ts`, `src/api/routes.ts`, `src/api/input-adapters.ts`
  - Depends: T-002, T-003
  - Notes: PB-040. Markdown renderer, ProxyService dependencies, route input adapter를 분리했다. Build/verify 통과.

- [x] **T-005** — 구조 개선 회귀 검증 추가
  - Phase: verification
  - Artifact: `scripts/verify.mjs`, `scripts/verify-turn.mjs`, `scripts/verify-turn-notes.mjs`, `verification/code-quality-review.md`
  - Depends: T-001, T-002, T-003, T-004
  - Notes: PB-041. `npm run build`와 `npm run verify` 통과. 세 API, turn, note, viewer 회귀와 summary projector/route boundary를 검증했다.

- [x] **T-006** — Sprint Boundary → sprint-18
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-17.md`
  - Depends: T-001, T-002, T-003, T-004, T-005
  - Notes: Sprint completion 승인 후 board archive, PB-037~PB-041 DoD 갱신, 다음 sprint 계획을 처리한다.

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
| 13 | Turn 관리·메타데이터·탐색·요약 구현 | 2026-03-10 | [`TODO-13.md`](./scrum/TODO-13.md) |
| 14 | 안전한 traffic content viewer 구현·검증 | 2026-03-10 | [`TODO-14.md`](./scrum/TODO-14.md) |
| 15 | Turn 완료 후 API별 분석 note 파이프라인 요구사항·구현 backlog 확정 | 2026-03-10 | [`TODO-15.md`](./scrum/TODO-15.md) |
| 16 | Turn analysis pipeline implementation and verification | 2026-03-10 | [`scrum/TODO-16.md`](./scrum/TODO-16.md) |
| 17 | API adapter 경계와 코드 품질 개선 | 2026-03-10 | [`scrum/TODO-17.md`](./scrum/TODO-17.md) |

## Notes

- 2026-03-10: Sprint 16 completion approval received from user; its archived board is `scrum/TODO-16.md`.
- 2026-03-10: Sprint 17 plan approved by user go-ahead("ok"); live execution board seeded and T-001 selected as Current focus.
- 2026-03-10: Sprint scope is limited to PB-037~PB-041. New API support and large ProviderClient extraction are explicitly out of scope.
- 2026-03-10: Sprint 17 completion approved by user go-ahead("ok"); PB-037~PB-041 met DoD, with no carry-over or skips. This is the final planned sprint; no Sprint 18 was created.
