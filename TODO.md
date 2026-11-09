# TODO: LLM Proxy Server — Chat Completions·Claude Messages 지원

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-07 — [Chat Completions·Claude Messages 지원 요구사항 확정](./scrum/sprint-07.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 8 | 0 | 0 | 0 |

**Sprint goal:** OpenAI Chat Completions API와 Claude Messages API를 기존 Responses 프록시에 추가하기 위한 사용자 승인 PRD·AC·설계 결정·ASR·Spec을 확정하고 구현 가능한 product backlog를 만든다.
**Current focus:** —
**Recommended next:** Sprint 08 계획 승인 후 새 실행 보드 seed

## Tasks

- [x] **T-001** — PRD delta 작성 및 검토
  - Phase: ① PRD
  - Artifact: `spec/PRD.md`
  - Depends: —
  - Notes: 기존 승인 PRD를 보존하고 두 API 지원 범위를 추가한다.

- [x] **T-002** — PRD 승인 gate
  - Phase: ① PRD gate
  - Artifact: `spec/PRD.md`
  - Depends: T-001
  - Notes: 2026-03-10 사용자 go-ahead("ok")로 PRD delta 승인.

- [x] **T-003** — 신규 blocking AC 식별 및 dependency order 확정
  - Phase: ② AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-002

- [x] **T-004** — AC별 ADR/Direct Input 설계 결정 및 승인
  - Phase: ③ AC review
  - Artifact: `adr/multi-api-contract-adapter-boundary.md`, `spec/AC.md`
  - Depends: T-003
  - Notes: AC-014~AC-018 설계 결정과 ADR 승인을 완료했다. AC-018은 Option A(provider-reported USD cost only)로 결정했다.

- [x] **T-005** — ASR delta 통합 및 승인
  - Phase: ④ ASR consolidation
  - Artifact: `spec/ASR.md`
  - Depends: T-004
  - Notes: 2026-03-10 사용자 go-ahead("ok")로 ASR-016~ASR-020 및 전체 ASR delta를 승인했다.

- [x] **T-006** — Spec delta 작성
  - Phase: ⑤ Spec writing
  - Artifact: `spec/llm-proxy-server.md`
  - Depends: T-005
  - Notes: 승인된 ASR-016~ASR-020을 R-017~R-022 및 C-010~C-012로 반영했다.

- [x] **T-007** — Spec review 및 승인
  - Phase: ⑥ Spec review
  - Artifact: `spec-review/llm-proxy-server.md`
  - Depends: T-006
  - Notes: 2026-03-10 Spec consistency review 통과 및 사용자 go-ahead("ok")로 Spec을 SSOT로 승인했다.

- [x] **T-008** — PB-012 세분화 및 Sprint Boundary → sprint-08
  - Phase: backlog encode / cross-cutting
  - Artifact: `scrum/product-backlog.md`
  - Depends: T-007
  - Notes: PB-012를 PB-013~PB-018 구현 story로 분해하고 Sprint Boundary를 완료했다.

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

- 2026-03-10: Sprint 07 계획 승인. 실행 보드를 seed하고 PRD delta 작업을 시작했다.
- 2026-03-10: Sprint 07 완료 승인과 Boundary 실행 승인을 반영했다. `scrum/TODO-07.md`에 보드를 아카이브했다.
- 2026-03-10: Sprint 08 구현 계획 초안은 작성했지만 Sprint plan approval 전까지 실행 보드는 전환하지 않는다.
