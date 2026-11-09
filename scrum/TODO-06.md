# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-06 — [확장 가능한 모니터링 UI 구조 완성](./scrum/sprint-06.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 7 | 0 | 0 | 0 |

**Sprint goal:** 기존 로그 목록·상세 UI를 확장 가능한 page/component/data-query 구조로 정리하고 향후 분석·report·chart 기능의 독립적 확장 기반을 완성한다.
**Current focus:** —
**Recommended next:** —

## Tasks

- [x] **T-001** — UI 책임 경계와 확장 구조 추출
  - Phase: ⑦ Implementation
  - Artifact: `src/ui/`
  - Depends: —
  - Notes: 기존 `main.tsx`의 API data-query, page, component 책임을 분리했다. `npm run build` 통과.

- [x] **T-002** — 로그 목록·상세·content viewer 기능 보존
  - Phase: ⑦ Implementation
  - Artifact: `src/ui/`
  - Depends: T-001
  - Notes: 목록·필터·pagination·상세 이동·request/response/error 표시를 유지했다. UI entrypoint 검증과 전체 `npm run verify` 통과.

- [x] **T-003** — UI 확장 지점 및 import 경계 문서화
  - Phase: ⑦ Implementation
  - Artifact: `AGENTS.md`, `README.md`, `verification/llm-proxy-server.md`
  - Depends: T-002
  - Notes: `AGENTS.md`, `README.md`, verification report에 page/component/data-query 책임, import 방향, 독립 feature 확장 규칙을 기록했다.

- [x] **T-004** — Sprint 06 자동 회귀 검증
  - Phase: ⑧ Verification
  - Artifact: `scripts/verify.mjs`, `verification/llm-proxy-server.md`
  - Depends: T-003
  - Notes: `npm run build`와 `npm run verify` 통과. UI entrypoint, provider routing, model mapping, unknown model rejection, secret handling, persistence/read-write boundary를 확인했다.

- [x] **T-005** — Sprint 06 Demo checklist
  - Phase: demo
  - Artifact: `scrum/sprint-06.md`, `verification/llm-proxy-server.md`
  - Depends: T-004
  - Notes: 목록·상세·content viewer 동작, component의 API 비의존성, page→data-query 경계, 확장 지점 문서, UI entrypoint와 전체 회귀 검증을 확인했다. `npm run build` 및 `npm run verify` 통과.

- [x] **T-006** — Sprint completion review
  - Phase: gate
  - Artifact: `TODO.md`, `verification/llm-proxy-server.md`
  - Depends: T-005
  - Notes: PB-010 DoD 충족, Scope·DoD·Demo checklist 완료로 Sprint 06 completion을 확정했다. `config.json` runtime 설정 복원과 TODO 보드 들여쓰기 결함도 정리했다.

- [x] **T-007** — Sprint Boundary → complete
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-06.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006
  - Notes: 최종 backlog story의 DoD 충족을 확인하고 sprint board를 archive했다. 후속 Sprint는 남은 제품 Scope가 없어 생성하지 않는다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`scrum/TODO-00.md`](./scrum/TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`scrum/TODO-01.md`](./scrum/TODO-01.md) |
| 02 | 확장 가능한 아키텍처 설계와 백로그 갱신 | 2026-03-10 | [`scrum/TODO-02.md`](./scrum/TODO-02.md) |
| 03 | 승인된 구조 기반 UI 구현과 검증 기반 구축 | 2026-03-10 | [`scrum/TODO-03.md`](./scrum/TODO-03.md) |
| 04 | 모듈 분리·소스 구조 정리와 실행 검증 완성 | 2026-03-10 | [`scrum/TODO-04.md`](./scrum/TODO-04.md) |
| 05 | Provider 라우팅과 로그 access 경계 완성 | 2026-03-10 | [`scrum/TODO-05.md`](./scrum/TODO-05.md) |
| 06 | 확장 가능한 모니터링 UI 구조 완성 | 2026-03-10 | [`scrum/TODO-06.md`](./scrum/TODO-06.md) |

## Notes

- 2026-03-10: Sprint 05 Boundary 완료. PB-008, PB-009, PB-011을 종료하고 PB-010을 Sprint 06 Scope로 계획했다.
- 2026-03-10: Sprint 06 Goal, Scope, DoD, Demo Checklist 사용자 승인 완료. PB-010을 실행 Scope로 확정했다.
- 2026-03-10: Execute 시작. 현재 UI가 `main.tsx`에 집중되어 있어 T-001 UI 책임 경계와 확장 구조 추출을 시작한다.
- 2026-03-10: T-006 completion review 완료. PB-010 DoD, Sprint 06 Scope/DoD/Demo checklist 충족을 기록하고 T-007 Boundary를 다음 게이트로 지정했다.
- 2026-03-10: Sprint 06 Boundary 완료. PB-010을 종료하고 모든 현재 backlog story가 완료되어 deliverable을 complete 상태로 전환했다.
