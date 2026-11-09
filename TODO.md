# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-01 — [LLM Proxy MVP 구현](./scrum/sprint-01.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 2 | 4 | 0 | 0 |

**Sprint goal:** 승인된 Spec을 기준으로 localhost에서 실행 가능한 단일 프로세스 LLM Proxy MVP를 구현한다.
**Current focus:** T-003
**Recommended next:** T-003 — PB-004: SQLite 로그 저장 및 조회 API 구현

## Tasks

- [x] **T-001** — PB-002: Responses API 프록시 기반 구현
  - Phase: implementation
  - Artifact: `src/server.ts`, `package.json`, `tsconfig.json`
  - Depends: —
  - Notes: `/api/v1/responses` 비스트리밍 요청 전달, Provider 응답·오류·네트워크 오류 계약의 초기 구현을 완료하고 TypeScript 빌드를 통과했다. 정상·Provider 오류·네트워크 오류 반환과 추적 가능성은 구현 태스크 안에서 에이전트가 자체 점검한다.

- [x] **T-002** — PB-003: SSE 스트리밍 프록시 구현
  - Phase: implementation
  - Artifact: `src/server.ts`
  - Depends: T-001
  - Notes: Provider SSE 청크를 전달하고, `response.completed`/`[DONE]` 완료 이벤트와 비정상 종료·클라이언트 연결 종료를 구분해 `completed`/`failed` 집계 로그를 저장한다. TypeScript 빌드를 통과했다.

- [ ] **T-003** — PB-004: SQLite 로그 저장 및 조회 API 구현
  - Phase: implementation
  - Artifact: `src/server.ts`
  - Depends: T-001
  - Notes: 마스킹·본문 크기 제한, 최신순·필터·페이지네이션·상세 조회를 구현한다. 닫기 전 에이전트가 저장·조회 API와 보안 제약을 자체 점검한다.

- [ ] **T-004** — Sprint DoD: 단일 프로세스 로컬 실행 및 Provider 설정 확인
  - Phase: demo
  - Artifact: —
  - Depends: T-003
  - Notes: 에이전트가 `127.0.0.1` 실행과 Provider 설정을 시연·기록한다. 사용자 승인은 Sprint completion에서 받는다.

- [ ] **T-005** — Sprint DoD: Responses·SSE·SQLite 통합 데모 확인
  - Phase: demo
  - Artifact: —
  - Depends: T-004
  - Notes: 에이전트가 승인된 sprint-01 Demo Checklist 전체를 실행·기록한다. 사용자 승인은 Sprint completion에서 받는다.

- [ ] **T-006** — Sprint Boundary → sprint-02
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-01.md`
  - Depends: T-001, T-002, T-003, T-004, T-005
  - Notes: Sprint completion 검토·승인 후 아카이브하고 다음 계획을 로드한다. 이 스프린트의 사용자 게이트는 plan 승인 → completion(boundary)이다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./scrum/TODO-00.md) |

## Notes

- sprint-00 Boundary를 완료하고 승인된 sprint-01 실행 보드로 전환했다.
- sprint-01 범위는 PB-002, PB-003, PB-004이다. PB-005, PB-006은 sprint-02로 유지한다.
- 사용자 게이트는 **Sprint plan 승인 → Execute → Sprint completion(boundary)** 만 둔다. 설계·스펙 검토는 Spec→backlog 스프린트에서, 구현/코드·Demo Checklist 실행은 에이전트가 자동으로 처리하고 completion에서 결과만 사용자에게 제시한다.
