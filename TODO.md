# TODO: LLM Proxy Server — 안전한 traffic content viewer 구현·검증

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-14 — [안전한 traffic content viewer 구현·검증](./scrum/sprint-14.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 16 | 1 | 0 | 0 |

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

  - [x] **T-011** — traffic request/response JSON object viewer 데이터 정규화 fix
  - Phase: implementation + verification
  - Artifact: `src/ui/data-query/content-viewer.ts`, `src/ui/components/ContentViewer.tsx`, `src/ui/types.ts`, `scripts/verify-viewer.ts`
  - Depends: T-010
  - Notes: JSON 문자열과 이미 파싱된 object/array 입력을 동일하게 정규화해 headers/body와 중첩 JSON을 표시하고 회귀 검증을 추가했다. `npm run build`와 `npm run verify` 통과.

  - [x] **T-012** — request/response JSON 전체 저장 보장
  - Phase: implementation + verification
  - Artifact: `src/application/proxy-service.ts`, `scripts/verify.mjs`, `spec/AC.md`, `spec/ASR.md`, `spec/llm-proxy-turn-management.md`, `verification/`
  - Depends: T-011
  - Notes: request/response 저장 시 truncation을 제거하고 request 수신 한도·오류 문자열 bound는 유지했다. `maxBodyBytes: 4096`보다 큰 JSON field 전체 parse/길이를 검증했으며 `npm run build`와 `npm run verify` 통과.

  - [x] **T-013** — Turn page summary/request-response/traffic table delta 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `spec/llm-proxy-ui.md`, `src/ui/components/TurnView.tsx`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-management.md`
  - Depends: T-012
  - Notes: Traffic page와 동일한 turn summary, API별 request/response 추출 규칙, turn usage 합계, sidebar와 일치하는 Traffic 번호 및 지정 column table을 구현하고 build/verify evidence를 갱신한다.

- [x] **T-014** — Turn/Traffic summary 표시 규칙 delta 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `spec/llm-proxy-ui.md`, `src/ui/components/TurnView.tsx`, `src/ui/components/TrafficView.tsx`, `src/ui/components/ContentViewer.tsx`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-management.md`
  - Depends: T-013
  - Notes: Turn 제목 제거·summary 제목 변경, response 형식별 viewer, cost/token/time 표시 포맷과 필드 순서를 구현하고 build/verify evidence를 갱신했다.

- [x] **T-015** — Turn request/response section viewer 정렬·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `spec/llm-proxy-ui.md`, `src/ui/components/TurnView.tsx`, `src/ui/components/ContentViewer.tsx`, `src/ui/styles.css`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-management.md`
  - Depends: T-014
  - Notes: summary/request-response/table section을 분리하고 request/response header를 제거하며 request 긴 문자열 preview와 popup viewer를 구현했다.

- [x] **T-016** — Turn request/response scalar label·preview 정렬 구현·검증
  - Phase: implementation + verification
  - Artifact: `spec/llm-proxy-turn-management.md`, `spec/llm-proxy-ui.md`, `src/ui/components/TurnView.tsx`, `scripts/verify-turn.mjs`, `verification/llm-proxy-turn-management.md`
  - Depends: T-015
  - Notes: request/response viewer의 `request:`/`response:` label을 유지하고 양쪽 긴 scalar preview/popup을 검증했다. `npm run build`와 `npm run verify` 통과.

- [x] **T-017** — TurnView card separation·JSON scalar rendering defect closure
  - Phase: implementation + verification
  - Artifact: `src/ui/components/TurnView.tsx`, `src/ui/components/ContentViewer.tsx`, `scripts/verify-turn.mjs`, `scripts/verify-viewer.ts`, `spec/`, `verification/`
  - Depends: T-016
  - Notes: summary/request-response/table을 traffic view처럼 독립 card로 렌더링하고 request/response 단순 문자열을 JSON string scalar 및 긴 문자열 popup preview로 표시한다.

- [ ] **T-004** — Sprint Boundary → next implementation sprint
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-14.md`
  - Depends: T-001, T-002, T-003, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-017
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
- 2026-03-10: 사용자 요청으로 Turn/Traffic summary 제목·필드 순서·숫자 표시와 Turn response viewer delta를 T-014로 현재 sprint에 추가했다.
- 2026-03-10: 사용자 defect report로 TurnView 독립 card section과 request/response JSON string scalar 표시를 T-017로 추가했다.
