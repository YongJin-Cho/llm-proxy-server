# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-05 — [Provider 라우팅과 로그 access 경계 완성](./scrum/sprint-05.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 8 | 0 | 0 | 0 |

**Sprint goal:** 설정 기반 provider/model routing과 writer/read access 경계를 완성하고 기존 proxy·SSE·log·UI 동작을 보존한다.
**Current focus:** —
**Recommended next:** —

## Tasks

- [x] **T-001** — provider/model routing configuration
  - Phase: ⑦ Implementation
  - Artifact: `src/configuration.ts`, `src/application/`
  - Depends: —
  - Notes: `CONFIG_PATH` JSON의 providers/models schema와 환경변수 secret 참조를 도입하고 legacy `PROVIDER_URL`/`PROVIDER_API_KEY` 실행을 유지했다. 시작 시 provider/model 설정을 검증한다.

- [x] **T-002** — routing-aware proxy forwarding and error handling
  - Phase: ⑦ Implementation
  - Artifact: `src/application/proxy-service.ts`, `src/api/routes.ts`
  - Depends: T-001
  - Notes: model별 endpoint와 provider model payload 변환, 미등록 model·잘못된 routing 오류를 provider 호출 전에 처리하고 provider key는 Authorization으로만 전달한다. `npm run build` 통과.

- [x] **T-003** — writer/read access boundary verification
  - Phase: ⑦ Implementation
  - Artifact: `src/domain/`, `src/persistence/`, `src/api/`, `src/application/`
  - Depends: T-002
  - Notes: `ProxyService → TrafficLogWriter`, `TrafficLogQueryService → TrafficLogReader`, `routes → query service` 경계를 반영했다. SQLite adapter는 두 port의 concrete implementation이며 route/application에 SQL import가 없다. `npm run build` 통과.

- [x] **T-004** — migration and runtime documentation
  - Phase: ⑦ Implementation
  - Artifact: `README.md`, `AGENTS.md`, `verification/llm-proxy-server.md`
  - Depends: T-003
  - Notes: README에 `CONFIG_PATH` schema·secret handling·routing 오류를 기록하고 AGENTS/verification에 현재 module map과 access boundary를 반영했다.

- [x] **T-005** — automated routing and regression verification
  - Phase: ⑧ Verification
  - Artifact: `scripts/verify.mjs`, `verification/llm-proxy-server.md`
  - Depends: T-004
  - Notes: `npm run verify` 통과. 두 provider routing, provider model mapping, unknown model rejection, provider secret header, redaction, SQLite read/write boundary를 자동 검증했다.

- [x] **T-006** — Sprint 05 Demo checklist
  - Phase: demo
  - Artifact: `scrum/sprint-05.md`, `verification/llm-proxy-server.md`
  - Depends: T-005
  - Notes: `npm run build`와 `npm run verify` 통과. config.json runtime 설정, 두 provider routing, model mapping, unknown model rejection, secret redaction, SQLite read/write boundary를 확인했다.

- [x] **T-007** — Sprint completion review
  - Phase: gate
  - Artifact: `TODO.md`, `verification/llm-proxy-server.md`
  - Depends: T-006

- [x] **T-008** — Sprint Boundary → sprint-06
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-05.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007
  - Notes: completion 승인 후 archive하고 다음 slice를 계획한다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`scrum/TODO-00.md`](./scrum/TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`scrum/TODO-01.md`](./scrum/TODO-01.md) |
| 02 | 확장 가능한 아키텍처 설계와 백로그 갱신 | 2026-03-10 | [`scrum/TODO-02.md`](./scrum/TODO-02.md) |
| 03 | 승인된 구조 기반 UI 구현과 검증 기반 구축 | 2026-03-10 | [`scrum/TODO-03.md`](./scrum/TODO-03.md) |
| 04 | 모듈 분리·소스 구조 정리와 실행 검증 완성 | 2026-03-10 | [`scrum/TODO-04.md`](./scrum/TODO-04.md) |

## Notes

- 2026-03-10: Sprint 05 Goal, Scope, DoD, Demo Checklist 사용자 승인 완료.
- 2026-03-10: 승인된 Scope로 Execute 시작. T-001 provider/model routing configuration이 현재 작업이다.
- 2026-03-10: Spec 재확인 후 config.json 기반 runtime 설정으로 구현·문서·verify를 정렬했고 T-006 Demo checklist를 완료했다.
- 2026-03-10: Sprint completion 승인 후 T-007과 T-008을 종료하고 Boundary를 완료했다. PB-008, PB-009, PB-011은 DoD 충족으로 종료하며 PB-010은 다음 Sprint로 이월한다.
