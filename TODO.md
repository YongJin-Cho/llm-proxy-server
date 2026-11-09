# TODO: LLM Proxy Server — Chat Completions·Claude Messages 지원

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-07 — [Chat Completions·Claude Messages 지원 요구사항 확정](./scrum/sprint-07.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 0 | 8 | 0 | 0 |

**Sprint goal:** OpenAI Chat Completions API와 Claude Messages API를 기존 Responses 프록시에 추가하기 위한 사용자 승인 PRD·AC·설계 결정·ASR·Spec을 확정하고 구현 가능한 product backlog를 만든다.
**Current focus:** T-001 — PRD delta 작성 및 검토
**Recommended next:** T-001 — PRD delta 작성 및 검토

## Tasks

- [ ] **T-001** — PRD delta 작성 및 검토
  - Phase: ① PRD
  - Artifact: `spec/PRD.md`
  - Depends: —
  - Notes: 기존 승인 PRD를 보존하고 두 API 지원 범위를 추가한다.

- [ ] **T-002** — PRD 승인 gate
  - Phase: ① PRD gate
  - Artifact: `spec/PRD.md`
  - Depends: T-001

- [ ] **T-003** — 신규 blocking AC 식별 및 dependency order 확정
  - Phase: ② AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-002

- [ ] **T-004** — AC별 ADR/Direct Input 설계 결정 및 승인
  - Phase: ③ AC review
  - Artifact: `adr/`, `spec/AC.md`
  - Depends: T-003

- [ ] **T-005** — ASR delta 통합 및 승인
  - Phase: ④ ASR consolidation
  - Artifact: `spec/ASR.md`
  - Depends: T-004

- [ ] **T-006** — Spec delta 작성
  - Phase: ⑤ Spec writing
  - Artifact: `spec/llm-proxy-server.md`
  - Depends: T-005

- [ ] **T-007** — Spec review 및 승인
  - Phase: ⑥ Spec review
  - Artifact: `spec-review/llm-proxy-server.md`
  - Depends: T-006

- [ ] **T-008** — PB-012 세분화 및 Sprint Boundary → sprint-08
  - Phase: backlog encode / cross-cutting
  - Artifact: `scrum/product-backlog.md`, `scrum/TODO-07.md`
  - Depends: T-007
  - Notes: 제품 코드 구현은 다음 Backlog→Implementation sprint로 이월한다.

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

## Notes

- 2026-03-10: Sprint 07 계획 승인. 실행 보드를 seed하고 PRD delta 작업을 시작했다.
