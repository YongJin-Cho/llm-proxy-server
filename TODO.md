# TODO: LLM Proxy Server — 다중 API 프록시 구현

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-08 — [다중 API 프록시 구현](./scrum/sprint-08.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 0 | 8 | 1 | 0 |

**Sprint goal:** 승인된 Spec에 따라 OpenAI Chat Completions와 Claude Messages API를 기존 Responses 프록시에 통합하고, API별 인증·streaming·로그 정규화·provider cost metadata를 구현·검증한다.
**Current focus:** T-001 — 다중 API route와 transparent adapter contract 구현 _(blocked: provider endpoint/capability 설정 방식 결정 필요)_
**Recommended next:** T-001 — 다중 API route와 transparent adapter contract 구현 _(blocked: provider endpoint/capability 설정 방식 결정 필요)_

## Tasks

- [ ] **T-001** — 다중 API route와 transparent adapter contract 구현
  - Phase: implementation
  - Artifact: `src/api/routes.ts`, `src/application/proxy-service.ts`
  - Depends: —
  - Notes: PB-013 / R-009, R-017, C-010. Responses, Chat Completions, Messages route와 API별 provider endpoint를 연결하고, self-check로 build 및 route unit/integration evidence를 남긴다. Blocked: 승인 ADR의 provider endpoint/capability 설정 후속 결정이 필요하다.

- [ ] **T-002** — Claude 인증 mode와 provider header 설정
  - Phase: implementation
  - Artifact: `src/configuration.ts`, `src/application/proxy-service.ts`, `config.json`
  - Depends: T-001
  - Notes: PB-014 / R-018, C-007. Bearer/native mode와 Anthropic headers를 구현하고 secret redaction을 확인한다.

- [ ] **T-003** — API별 streaming completion/error 처리
  - Phase: implementation
  - Artifact: `src/application/proxy-service.ts`
  - Depends: T-001
  - Notes: PB-015 / R-004, R-005, R-019, C-002, C-011. API kind별 sentinel을 사용하고 partial result 및 failed 상태를 보존한다.

- [ ] **T-004** — `api_kind` traffic log schema migration
  - Phase: implementation
  - Artifact: `src/domain/traffic-log.ts`, `src/persistence/sqlite-traffic-log.ts`, `src/application/proxy-service.ts`
  - Depends: T-001
  - Notes: PB-016 / R-006, R-020, C-003, C-011. Legacy row를 responses로 보존하는 migration을 검증한다.

- [ ] **T-005** — Token usage normalization과 provider cost metadata
  - Phase: implementation
  - Artifact: `src/domain/traffic-log.ts`, `src/persistence/sqlite-traffic-log.ts`, `src/application/proxy-service.ts`
  - Depends: T-004
  - Notes: PB-017 / R-021, R-022, C-012. normalized usage와 provider-reported USD cost만 저장하고 unavailable/ambiguous 값은 NULL로 둔다.

- [ ] **T-006** — 다중 API 회귀·통합 검증과 실행 문서
  - Phase: implementation
  - Artifact: `scripts/verify.mjs`, `README.md`, `verification/llm-proxy-server.md`
  - Depends: T-002, T-003, T-004, T-005
  - Notes: PB-018 / R-013–R-016, C-009. 세 API와 기존 Responses의 성공·실패·streaming·migration·redaction을 자동 검증한다.

- [ ] **T-007** — Sprint 08 Demo Checklist 실행
  - Phase: demo
  - Artifact: `verification/llm-proxy-server.md`
  - Depends: T-006
  - Notes: 계획의 모든 Demo Checklist 항목에 실행 evidence를 기록한다.

- [ ] **T-008** — Sprint 08 구현 self-check 및 handoff
  - Phase: cross-cutting
  - Artifact: `AGENTS.md`, `verification/llm-proxy-server.md`
  - Depends: T-007
  - Notes: 승인 Spec R-017–R-022 및 C-010–C-012를 spot-check하고 stage ⑧ 검증을 추천한다.

- [ ] **T-009** — Sprint Boundary → sprint-09
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-08.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008
  - Notes: Sprint completion 승인 후에만 archive, backlog update, next plan transition을 수행한다.

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

## Notes

- 2026-03-10: Sprint 08 계획 승인. PB-013~PB-018 범위로 실행 보드를 seed하고 구현을 시작했다.
