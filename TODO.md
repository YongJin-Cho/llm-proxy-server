# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-01 — [LLM Proxy MVP 구현](./scrum/sprint-01.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 1 | 8 | 0 | 0 |

**Sprint goal:** 승인된 Spec을 기준으로 localhost에서 실행 가능한 단일 프로세스 LLM Proxy MVP를 구현한다.
**Current focus:** T-002
**Recommended next:** T-002 — PB-002 완료 게이트

## Tasks

- [x] **T-001** — PB-002: Responses API 프록시 기반 구현
  - Phase: implementation
  - Artifact: `src/server.ts`, `package.json`, `tsconfig.json`
  - Depends: —
  - Notes: `/api/v1/responses` 비스트리밍 요청 전달, Provider 응답·오류·네트워크 오류 계약의 초기 구현을 완료하고 TypeScript 빌드를 통과했다.

- [ ] **T-002** — PB-002 완료 게이트
  - Phase: implementation gate
  - Artifact: —
  - Depends: T-001
  - Notes: 정상·Provider 오류·네트워크 오류의 반환과 추적 가능성을 확인한다.

- [ ] **T-003** — PB-003: SSE 스트리밍 프록시 구현
  - Phase: implementation
  - Artifact: —
  - Depends: T-002
  - Notes: Responses SSE 이벤트 전달과 정상·실패 종료 집계를 구현한다.

- [ ] **T-004** — PB-003 완료 게이트
  - Phase: implementation gate
  - Artifact: —
  - Depends: T-003
  - Notes: SSE 클라이언트 전달 및 집계 로그를 확인한다.

- [ ] **T-005** — PB-004: SQLite 로그 저장 및 조회 API 구현
  - Phase: implementation
  - Artifact: —
  - Depends: T-002
  - Notes: 마스킹·본문 크기 제한, 최신순·필터·페이지네이션·상세 조회를 구현한다.

- [ ] **T-006** — PB-004 완료 게이트
  - Phase: implementation gate
  - Artifact: —
  - Depends: T-005
  - Notes: 저장·조회 API와 보안 제약을 확인한다.

- [ ] **T-007** — Sprint DoD: 단일 프로세스 로컬 실행 및 Provider 설정 확인
  - Phase: demo gate
  - Artifact: —
  - Depends: T-002, T-004, T-006
  - Notes: `127.0.0.1` 실행과 Provider 설정을 시연한다.

- [ ] **T-008** — Sprint DoD: Responses·SSE·SQLite 통합 데모 확인
  - Phase: demo gate
  - Artifact: —
  - Depends: T-007
  - Notes: 승인된 sprint-01 Demo Checklist 전체를 확인한다.

- [ ] **T-009** — Sprint Boundary → sprint-02
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-01.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008
  - Notes: sprint-01 완료 검토와 별도 실행 승인을 거쳐 아카이브하고 다음 계획을 로드한다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./scrum/TODO-00.md) |

## Notes

- sprint-00 Boundary를 완료하고 승인된 sprint-01 실행 보드로 전환했다.
- sprint-01 범위는 PB-002, PB-003, PB-004이다. PB-005, PB-006은 sprint-02로 유지한다.
