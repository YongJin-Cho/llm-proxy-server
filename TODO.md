# TODO: LLM Proxy Server — Turn analysis pipeline implementation and verification

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-16 — [Turn analysis pipeline implementation and verification](./scrum/sprint-16.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 9 | 1 | 0 | 0 |

**Sprint goal:** 승인된 turn note Spec의 전체 구현을 완료한다. 완료 turn을 분석·저장·조회하고 Turn view에 note card를 표시하며 세 API의 lifecycle·persistence·query·UI·통합 검증을 완료한다.
**Current focus:** T-009
**Recommended next:** T-009 — Sprint Boundary → sprint-17

## Tasks

- [x] **T-001** — PB-031 TurnAnalysisService와 API별 TurnAnalysisAdapter 구현
  - Phase: implementation
  - Artifact: `src/application/turn-analysis-service.ts`, `src/application/turn-analysis-adapters/`, `src/domain/turn-notes.ts`
  - Depends: —
  - Notes: Spec R-001–R-005, C-001–C-003. `TurnAnalysisService`, API별 adapter와 deterministic Markdown `TurnNote[]`를 구현했다. `npm run verify`의 turn note fixture 통과.

- [x] **T-002** — PB-032 비동기 lifecycle·idempotent persistence 구현
  - Phase: implementation
  - Artifact: `src/persistence/sqlite-traffic-log.ts`, `src/application/turn-analysis-service.ts`, `src/domain/turn-notes.ts`
  - Depends: T-001
  - Notes: Spec R-006–R-009, C-004–C-005. `turn_notes` schema, pending/ready/empty/failed, versioned upsert, startup pending recovery와 completed turn 독립성을 구현했다. Build/verify 통과.

- [x] **T-003** — PB-033 Turn note query projection API 구현
  - Phase: implementation
  - Artifact: `src/application/log-query-service.ts`, `src/api/routes.ts`, `src/persistence/sqlite-traffic-log.ts`, `src/ui/data-query/log-api.ts`
  - Depends: T-002
  - Notes: Spec R-010. 기존 `GET /api/v1/turns` aggregate에 note projection을 조합하고 기존 tree/detail regression을 유지했다. Build/verify 통과.

- [x] **T-004** — PB-034 Turn view note card UI 구현
  - Phase: implementation
  - Artifact: `src/ui/components/TurnView.tsx`, `src/ui/components/NoteCard.tsx`, `src/ui/types.ts`, `src/ui/styles.css`
  - Depends: T-003
  - Notes: Spec R-011–R-012, C-005–C-006. usage table 다음 `NoteCard`, 네 상태, sanitized read-only Markdown과 non-blocking error를 구현했다. UI build/verify 통과.

- [x] **T-005** — PB-035 통합·회귀 검증과 실행 문서
  - Phase: verification
  - Artifact: `scripts/verify-turn-notes.mjs`, `scripts/verify.mjs`, `verification/llm-proxy-turn-notes.md`
  - Depends: T-001, T-002, T-003, T-004
  - Notes: Spec R-013 전체. `scripts/verify-turn-notes.mjs`를 추가하고 세 API adapter, empty, projection, idempotency와 기존 proxy/turn/viewer 회귀를 `npm run verify`로 검증했다. `verification/llm-proxy-turn-notes.md`에 19 pass, 0 fail, 0 partial, 0 not-verifiable를 기록했다.

- [x] **T-006** — Sprint 16 Demo Checklist 실행
  - Phase: demo
  - Artifact: `scrum/sprint-16.md`
  - Depends: T-005
  - Notes: 각 API note 생성, lifecycle/idempotency, query projection, note card 상태 표시와 `npm run build`·`npm run verify` evidence를 `scrum/sprint-16.md`에 기록했다.

- [x] **T-007** — Tool history table·API별 오류 note·note별 card 구현
  - Phase: implementation
  - Artifact: `src/domain/turn-notes.ts`, `src/application/turn-analysis-adapters/`, `src/ui/components/NoteCard.tsx`, `src/ui/components/TurnView.tsx`
  - Depends: T-001, T-002, T-004
  - Notes: PB-036. `tmp/api-ref.md` 기준 API별 call/result extraction, parameter 축약, 오류 interaction 분리, note별 독립 card를 구현했다. note status/header는 UI에 표시하지 않는다.

- [x] **T-008** — Tool history/card 변경 통합·회귀 검증
  - Phase: verification
  - Artifact: `scripts/verify-turn-notes.mjs`, `verification/llm-proxy-turn-notes.md`
  - Depends: T-007
  - Notes: PB-035, PB-036. 세 API table/error fixture, no-note card, multi-card rendering, full-width layout과 기존 proxy/turn/viewer 회귀를 `npm run build`·`npm run verify`로 검증했다. 오류 interaction별 call/result JSON 보존과 viewer 확대 동작도 검증했다.

- [x] **T-010** — 도구 사용 오류 card를 Traffic request/response 형식으로 표시
  - Phase: implementation
  - Artifact: `src/domain/turn-notes.ts`, `src/ui/components/NoteCard.tsx`, `scripts/verify-turn-notes.mjs`
  - Depends: T-008
  - Notes: 오류 note 제목을 `도구 사용 오류: {순번}. {함수명}`으로 표시하고 원본 tool_use/tool_result를 Traffic과 동일한 `request`/`response` viewer로 렌더링한다. `npm run build` 및 `npm run verify` 통과.

- [ ] **T-009** — Sprint Boundary → sprint-17
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-16.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-010
  - Notes: Sprint completion 승인 후 board archive, PB-031~PB-036 DoD 갱신, 다음 sprint 계획을 처리한다.

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

## Notes

- 2026-03-10: Sprint 16 plan approval을 사용자 go-ahead("ok")로 받고 PB-031~PB-035 전체 Scope로 execution board를 seed했다.
- 2026-03-10: Implementation은 승인 Spec `spec/llm-proxy-turn-notes.md`와 Sprint 16 Scope만 사용한다.
