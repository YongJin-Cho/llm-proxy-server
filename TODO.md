# TODO: LLM Proxy Server — 안전한 traffic content viewer 구현·검증

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-14 — [안전한 traffic content viewer 구현·검증](./scrum/sprint-14.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 9 | 1 | 0 | 0 |

**Sprint goal:** 승인된 Turn 관리·분석 Spec의 남은 viewer slice로 traffic content를 형식별로 안전하게 표시하고, mode override·fallback·보안 경계를 자동 검증한다.
**Current focus:** T-004
**Recommended next:** T-004 — Sprint Boundary → next implementation sprint

## Tasks

- [x] **T-001** — PB-028 안전한 형식별 traffic content viewer 구현
  - Phase: implementation
  - Artifact: `src/ui/`
  - Depends: —
  - Notes: JSON tree, sanitized Markdown, read-only Monaco, Auto/사용자 mode override, detection fallback, 1 MiB 전문 표시와 viewer state 격리를 구현했다. local Monaco workers are configured; production bundle trade-off is recorded in `verification/llm-proxy-turn-management.md`.

- [x] **T-002** — PB-028 viewer 보안·상태 self-check
  - Phase: verification
  - Artifact: `scripts/verify-turn.mjs`, `src/ui/`
  - Depends: T-001
  - Notes: content 실행 방지, Markdown sanitization, unsupported/detection fallback, mode override, large content와 field-scoped state를 `scripts/verify-viewer.ts`로 검증했다.

- [x] **T-003** — PB-029 Turn 관리·분석 통합 검증과 실행 문서
  - Phase: verification
  - Artifact: `scripts/verify.mjs`, `scripts/verify-turn.mjs`, `AGENTS.md`, `verification/`
  - Depends: T-002
  - Notes: Sprint 13 기능과 viewer 및 기존 turn tree/URL/traffic API 회귀를 `npm run build`/`npm run verify`로 검증하고 `verification/llm-proxy-turn-management.md`와 `AGENTS.md`에 evidence를 기록했다.

- [x] **T-005** — 파일 탐색기형 sidebar UI 요구사항 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `src/ui/components/TurnTree.tsx`, `src/ui/pages/TrafficPage.tsx`, `src/ui/styles.css`
  - Depends: T-003
  - Notes: turn row action order/menu, traffic management menu removal, initial selection and expansion state, build/verify evidence

  - [x] **T-006** — Sidebar filter·pagination·bulk deletion delta 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `src/api/routes.ts`, `src/application/log-query-service.ts`, `src/persistence/sqlite-traffic-log.ts`, `src/ui/`
  - Depends: T-005
  - Notes: compact row spacing, All/Stored active tabs, arrow pagination, current-page unflagged-only transactional deletion. `npm run build`와 `npm run verify` 통과.

  - [x] **T-007** — sidebar icon·간격 세부 조정 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `src/ui/components/TurnTree.tsx`, `src/ui/styles.css`, `verification/llm-proxy-turn-management.md`
  - Depends: T-006
  - Notes: triangle pagination icons, backgroundless trash icon, tighter expand/flag spacing, smaller flag icon. `npm run build`와 `npm run verify` 통과.

  - [x] **T-008** — Pagination·메뉴 label delta 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `src/ui/components/TurnTree.tsx`, `src/ui/styles.css`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-management.md`
  - Depends: T-007
  - Notes: prev/next 배경·테두리 제거, 메뉴 label을 `rename`/`delete`로 변경, build/verify evidence 반영

  - [x] **T-009** — Turn 내부 traffic 표시 번호 정렬 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `src/ui/components/TurnTree.tsx`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-management.md`
  - Depends: T-008
  - Notes: 전역 turn_sequence 대신 각 turn child 배열 순서로 1부터 표시하고 custom traffic title 우선, build/verify 통과

  - [x] **T-010** — 개발용 watch와 조건부 native binding 준비 경로 추가
  - Phase: implementation + verification
  - Artifact: `package.json`, `scripts/dev-watch.mjs`, `AGENTS.md`
  - Depends: T-009
  - Notes: `src/` 서버는 `tsx watch`, UI는 `vite build --watch`로 감시한다. `better-sqlite3`는 로드 실패 시에만 승인/rebuild한다. `npm run build`와 `npm run verify` 통과.

  - [ ] **T-004** — Sprint Boundary → next implementation sprint
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-14.md`
  - Depends: T-001, T-002, T-003, T-005, T-006, T-007, T-008, T-009, T-010
  - Notes: archive board, update backlog, close PB-028~PB-029, plan next implementation slice

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

## Notes

- 2026-03-10: Sprint 14 계획 승인 후 live implementation board를 seed했다. PB-028 Execute를 시작한다.
