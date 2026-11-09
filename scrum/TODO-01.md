# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-01 — [LLM Proxy MVP 구현](./sprint-01.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 6 | 0 | 0 | 0 |

**Sprint goal:** 승인된 Spec을 기준으로 localhost에서 실행 가능한 단일 프로세스 LLM Proxy MVP를 구현한다.
**Current focus:** —
**Recommended next:** —

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

- [x] **T-003** — PB-004: SQLite 로그 저장 및 조회 API 구현
  - Phase: implementation
  - Artifact: `src/server.ts`, `scripts/verify.mjs`, `verification/llm-proxy-server.md`
  - Depends: T-001
  - Notes: SQLite 스키마·저장, 최신순 목록, 상태·모델·기간(from/to) 필터, limit/offset 페이지네이션, 상세 조회, 헤더 마스킹과 본문 제한을 구현·검증했다.

- [x] **T-004** — Sprint DoD: 단일 프로세스 로컬 실행 및 Provider 설정 확인
  - Phase: demo
  - Artifact: `README.md`, `scripts/verify.mjs`, `verification/llm-proxy-server.md`
  - Depends: T-003
  - Notes: `127.0.0.1` 단일 프로세스 실행, Provider URL/API 키, 포트, SQLite 경로, 본문 제한 설정을 문서화하고 mock Provider 통합 검증으로 확인했다. 사용자 승인은 Sprint completion에서 받는다.

- [x] **T-005** — Sprint DoD: Responses·SSE·SQLite 통합 데모 확인
  - Phase: demo
  - Artifact: `verification/llm-proxy-server.md`
  - Depends: T-004
  - Notes: 사용자가 curl을 이용한 검증 데모 완료를 확인했다. Responses·SSE·SQLite 통합 동작을 검증 완료했으며, 사용자 승인은 Sprint completion에서 받는다.

- [x] **T-006** — Sprint Boundary → sprint-02
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-01.md`
  - Depends: T-001, T-002, T-003, T-004, T-005
  - Notes: Sprint completion 검토·사용자 요청에 따라 sprint-01을 아카이브하고 PB-002–PB-004를 종료했다. 다음 sprint-02 계획은 아직 작성·승인되지 않았다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`TODO-01.md`](./TODO-01.md) |

## Notes

- T-003/T-004 구현 및 검증 완료: `npm run build`, `npm run verify` 통과, TypeScript diagnostics 이상 없음.
- npm 11 환경에서 `better-sqlite3` install script 차단 문제를 확인하고 `verify`에 명시적 승인·rebuild 단계를 추가했다.
- `verification/llm-proxy-server.md`에 Spec 기준 결과를 기록했다.
- sprint-00 Boundary를 완료하고 승인된 sprint-01 실행 보드로 전환했다.
- sprint-01 범위는 PB-002, PB-003, PB-004이며, 사용자 curl 데모 검증으로 완료되었다.
- sprint-01 completion 및 Boundary를 완료했다. PB-005, PB-006은 다음 계획 대상으로 남겼다.
