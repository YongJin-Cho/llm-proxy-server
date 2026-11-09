# TODO: LLM Proxy Server — Turn 기반 traffic 그룹핑·탐색 요구사항 확정

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-09 — [Turn 기반 traffic 그룹핑·탐색 요구사항 확정](./scrum/sprint-09.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 3 | 7 | 0 | 0 |

**Sprint goal:** turn 기반 traffic 저장·탐색 UI의 승인 요구사항과 Spec, 후속 구현 backlog를 확정한다.
**Current focus:** T-004
**Recommended next:** T-004 — AC 목록 승인 gate

## Tasks

- [x] **T-001** — Turn 기반 traffic 그룹핑·탐색 Delta PRD 작성
  - Phase: PRD
  - Artifact: `spec/PRD.md`
  - Depends: —
  - Notes: 기존 PRD를 보존하고 이번 기능 delta를 append한다.

- [x] **T-002** — PRD 승인 gate
  - Notes: 사용자 지시로 PRD를 승인했다. 기존 traffic migration은 범위에서 제외했다.
  - Phase: gate
  - Artifact: `spec/PRD.md`
  - Depends: T-001

- [x] **T-003** — Blocking AC 식별 및 dependency order 작성
  - Notes: AC-019~AC-024를 identified로 추가하고 dependency order를 설정했다. SSE는 client에 투명 전달하되 저장 시 최종 통합 응답 하나로 기록하는 AC-024를 추가했다.
  - Phase: AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-002

- [ ] **T-004** — AC 목록 승인 gate
  - Phase: gate
  - Artifact: `spec/AC.md`
  - Depends: T-003

- [ ] **T-005** — Blocking AC 설계 결정 및 필요한 ADR 작성
  - Phase: AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-004

- [ ] **T-006** — ASR consolidation
  - Phase: ASR
  - Artifact: `spec/ASR.md`
  - Depends: T-005

- [ ] **T-007** — ASR 승인 gate
  - Phase: gate
  - Artifact: `spec/ASR.md`
  - Depends: T-006

- [ ] **T-008** — Turn/traffic 요구사항 Spec 작성
  - Phase: Spec
  - Artifact: `spec/llm-proxy-turn-traffic.md`
  - Depends: T-007

- [ ] **T-009** — Spec review 및 승인 gate
  - Phase: gate
  - Artifact: `spec/llm-proxy-turn-traffic.md`, `spec-review/llm-proxy-turn-traffic.md`
  - Depends: T-008

- [ ] **T-010** — 승인 Spec을 후속 구현 backlog로 encode 및 Sprint Boundary
  - Phase: backlog / boundary
  - Artifact: `scrum/product-backlog.md`, `scrum/TODO-09.md`
  - Depends: T-009
  - Notes: PB-019를 구현 stories로 분해하고 Spec→backlog sprint를 종료한다.

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

## Notes

- 2026-03-10: Sprint 09 계획 승인 후 live execution board를 seed했다.
