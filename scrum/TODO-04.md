# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-04 — [모듈 분리·소스 구조 정리와 실행 검증 완성](./sprint-04.md)
> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 8 | 0 | 0 | 0 |

**Sprint goal:** React source를 `src/ui/`로 정리하고 module extraction, AGENTS.md, 실행 문서와 자동화 검증을 완성한다.
**Current focus:** —
**Recommended next:** Sprint 05 계획 승인

## Tasks

- [x] **T-001** — AGENTS.md 및 UI source 위치 정리
  - Phase: ⑦ Implementation
  - Artifact: `AGENTS.md`, `src/ui/`, `ui/`, `vite.config.ts`
  - Depends: —
  - Notes: `AGENTS.md` 생성, React source를 `src/ui/`로 이동, `ui/` 중복 source 제거, Vite 경로 갱신 및 `npm run build` 통과.

- [x] **T-002** — server module extraction
  - Phase: ⑦ Implementation
  - Artifact: `src/`
  - Depends: T-001
  - Notes: configuration/domain/persistence/application/api/delivery 모듈 생성 및 server bootstrap 교체. `npm run build` 통과.

- [x] **T-003** — writer/reader port와 SQLite adapter 연결
  - Phase: ⑦ Implementation
  - Artifact: `src/domain/`, `src/persistence/`, `src/application/`
  - Depends: T-002
  - Notes: `TrafficLogWriter`/`TrafficLogReader` port와 `SqliteTrafficLogStore` adapter 연결. `npm run verify`에서 persistence, masking, query 검증 통과.

- [x] **T-004** — 실행 문서와 검증 보강
  - Phase: ⑦ Implementation / ⑧ Verification
  - Artifact: `README.md`, `scripts/verify.mjs`, `verification/llm-proxy-server.md`
  - Depends: T-003
  - Notes: 설정·secret·SQLite·host/port·build/start 절차와 verification evidence를 기록했다.

- [x] **T-005** — build·verify 및 PB-005/PB-006/PB-007 검증
  - Phase: ⑧ Verification
  - Artifact: `verification/llm-proxy-server.md`
  - Depends: T-004
  - Notes: `npm run build`, `npm run verify` 통과; C-008/R-016 partial을 해소했다.

- [x] **T-006** — Demo checklist 확인
  - Phase: gate
  - Artifact: `scrum/sprint-04.md`
  - Depends: T-005
  - Notes: source placement, module map, bootstrap, ports/adapter, 회귀 검증, 실행 문서를 확인했다.

- [x] **T-007** — Sprint completion review
  - Phase: gate
  - Artifact: `TODO.md`, `verification/llm-proxy-server.md`
  - Depends: T-006
  - Notes: 목표·Scope·DoD·Demo 결과를 검토했고 사용자 데모 승인을 받았다.

- [x] **T-008** — Sprint Boundary → sprint-05
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-04.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007
  - Notes: Sprint 04 보드를 archive하고 다음 implementation slice를 계획한다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`TODO-01.md`](./TODO-01.md) |
| 02 | 확장 가능한 아키텍처 설계와 백로그 갱신 | 2026-03-10 | [`TODO-02.md`](./TODO-02.md) |
| 03 | 승인된 구조 기반 UI 구현과 검증 기반 구축 | 2026-03-10 | [`TODO-03.md`](./TODO-03.md) |
| 04 | 모듈 분리·소스 구조 정리와 실행 검증 완성 | 2026-03-10 | [`TODO-04.md`](./TODO-04.md) |

## Notes

- 2026-03-10: Sprint 04 completion review 및 데모 테스트 승인 완료.
- 2026-03-10: Sprint Boundary 완료. PB-005~PB-007을 Scope DoD 충족으로 종료했다.
