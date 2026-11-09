# TODO: LLM Proxy Server — 다중 API 프록시 구현

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-08 — [다중 API 프록시 구현](./scrum/sprint-08.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 11 | 0 | 0 | 0 |

**Sprint goal:** 승인된 Spec에 따라 OpenAI Chat Completions와 Claude Messages API를 기존 Responses 프록시에 통합하고, API별 인증·streaming·로그 정규화·provider cost metadata를 구현·검증한다.
**Current focus:** —
**Recommended next:** 최종 sprint 완료 — 모든 제품 backlog story 종료

## Tasks

- [x] **T-001** — 다중 API route와 transparent adapter contract 구현
  - Phase: implementation
  - Artifact: `src/api/routes.ts`, `src/application/proxy-service.ts`
  - Depends: —
  - Notes: PB-013 완료. 세 public route와 provider baseUrl path mapping을 구현·검증했다.

- [x] **T-002** — Claude 인증 mode와 provider header 설정
  - Phase: implementation
  - Artifact: `src/configuration.ts`, `src/application/proxy-service.ts`
  - Depends: T-001
  - Notes: PB-014 완료. Bearer/native Anthropic auth mode와 redaction을 구현·검증했다.

- [x] **T-003** — API별 streaming completion/error 처리
  - Phase: implementation
  - Artifact: `src/application/proxy-service.ts`, `src/application/proxy-adapters/`
  - Depends: T-001
  - Notes: PB-015 완료. 세 API별 completion detector와 partial failure logging을 검증했다.

- [x] **T-004** — `api_kind` traffic log schema migration
  - Phase: implementation
  - Artifact: `src/domain/traffic-log.ts`, `src/persistence/sqlite-traffic-log.ts`
  - Depends: T-001
  - Notes: PB-016 완료. legacy row를 `responses`로 유지하는 migration을 검증했다.

- [x] **T-005** — Token usage normalization과 provider cost metadata
  - Phase: implementation
  - Artifact: `src/domain/traffic-log.ts`, `src/persistence/sqlite-traffic-log.ts`, `src/application/proxy-adapters/`
  - Depends: T-004
  - Notes: PB-017 완료. API별 adapter usage/cost 해석과 normalized columns를 검증했다.

- [x] **T-006** — 다중 API 회귀·통합 검증과 실행 문서
  - Phase: implementation
  - Artifact: `scripts/verify.mjs`, `README.md`, `verification/llm-proxy-server.md`
  - Depends: T-002, T-003, T-004, T-005
  - Notes: PB-018 완료. 세 API와 기존 Responses 회귀, streaming, migration, redaction, usage/cost 검증이 통과했다.

- [x] **T-007** — Sprint 08 Demo Checklist 실행
  - Phase: demo
  - Artifact: `verification/llm-proxy-server.md`
  - Depends: T-006
  - Notes: 모든 Demo Checklist evidence를 verification record에 기록했다.

- [x] **T-008** — Sprint 08 구현 self-check 및 handoff
  - Phase: cross-cutting
  - Artifact: `AGENTS.md`, `verification/llm-proxy-server.md`
  - Depends: T-007
  - Notes: 승인 Spec R-017–R-022 및 C-010–C-012를 spot-check했다.

- [x] **T-010** — API별 ProxyAdapter 클래스로 리팩터링
  - Phase: implementation / refactoring
  - Artifact: `src/application/proxy-adapters/`, `src/application/proxy-service.ts`
  - Depends: T-001, T-003
  - Notes: API별 adapter와 공통 base contract를 구현하고 build/verify를 통과했다.

- [x] **T-011** — API별 usage 해석을 adapter로 이동
  - Phase: implementation / refactoring
  - Artifact: `src/application/proxy-adapters/`, `src/application/proxy-service.ts`
  - Depends: T-010
  - Notes: text/tool call 별도 저장 없이 API별 usage/cost 해석을 adapter로 이동하고 verify를 통과했다.

- [x] **T-009** — Sprint Boundary → complete
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-08.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-010, T-011
  - Notes: Sprint 08을 최종 sprint로 archive하고 모든 제품 backlog story를 종료했다. Sprint 09는 만들지 않는다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|---------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`scrum/TODO-00.md`](./scrum/TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`scrum/TODO-01.md`](./scrum/TODO-01.md) |
| 02 | 확장 가능한 아키텍처 설계와 백로그 갱신 | 2026-03-10 | [`scrum/TODO-02.md`](./scrum/TODO-02.md) |
| 03 | 승인된 구조 기반 UI 구현과 검증 기반 구축 | 2026-03-10 | [`scrum/TODO-03.md`](./scrum/TODO-03.md) |
| 04 | 모듈 분리·소스 구조 정리와 실행 검증 완성 | 2026-03-10 | [`scrum/TODO-04.md`](./scrum/TODO-04.md) |
| 05 | Provider 라우팅과 로그 access 경계 완성 | 2026-03-10 | [`scrum/TODO-05.md`](./scrum/TODO-05.md) |
| 06 | 확장 가능한 모니터링 UI 구조 완성 | 2026-03-10 | [`scrum/TODO-06.md`](./scrum/TODO-06.md) |
| 07 | Chat Completions·Claude Messages 지원 요구사항 확정 | 2026-03-10 | [`scrum/TODO-07.md`](./scrum/TODO-07.md) |
| 08 | 다중 API 프록시 구현 | 2026-03-10 | [`scrum/TODO-08.md`](./scrum/TODO-08.md) |

## Notes

- 2026-03-10: Sprint 08 완료 및 Boundary 실행. T-010 API별 ProxyAdapter 리팩터링과 T-011 adapter별 usage 해석 이동까지 완료했다.
- 2026-03-10: 모든 제품 backlog story의 DoD를 충족해 최종 sprint로 종료했다. Sprint 09는 만들지 않는다.
