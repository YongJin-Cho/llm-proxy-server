# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-02 — [확장 가능한 아키텍처 설계와 백로그 갱신](./scrum/sprint-02.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 15 | 0 | 0 | 0 |

**Sprint goal:** API·UI·provider·저장소 확장을 위한 설계 결정을 승인된 Spec과 제품 백로그에 반영한다.
**Current focus:** —
**Recommended next:** —

## Tasks

- [x] **T-001** — PRD delta 작성
  - Phase: ① PRD
  - Artifact: `spec/PRD.md`
  - Depends: —

- [x] **T-002** — PRD 승인
  - Phase: gate
  - Artifact: `spec/PRD.md`
  - Depends: T-001

- [x] **T-003** — delta AC 식별
  - Phase: ② AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-002

- [x] **T-004** — AC 목록 승인
  - Phase: gate
  - Artifact: `spec/AC.md`
  - Depends: T-003

- [x] **T-005** — 첫 번째 unsettled AC 검토
  - Phase: ③ AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-004

- [x] **T-006** — AC resolution gate
  - Phase: gate
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-005

- [x] **T-007** — 다음 AC 검토·resolution 반복
  - Phase: ③ AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-006

- [x] **T-008** — ASR delta 통합
  - Phase: ④ ASR consolidation
  - Artifact: `spec/ASR.md`
  - Depends: T-006, T-007

- [x] **T-009** — ASR 승인
  - Phase: gate
  - Artifact: `spec/ASR.md`
  - Depends: T-008

- [x] **T-010** — Spec delta 작성·검토
  - Phase: ⑤ Spec writing / ⑥ Spec review
  - Artifact: `spec/llm-proxy-server.md`, `spec-review/`
  - Depends: T-009

- [x] **T-011** — PB-007~PB-011 Spec 참조·DoD 갱신
  - Phase: Spec→backlog encode
  - Artifact: `scrum/product-backlog.md`
  - Depends: T-010

- [x] **T-012** — Demo checklist 확인
  - Phase: gate
  - Artifact: `scrum/sprint-02.md`
  - Depends: T-011

- [x] **T-013** — Sprint Boundary → sprint-03
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-02.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012
  - Notes: 2026-03-10 Sprint completion 승인 후 archive 완료. PB-007~PB-011 설계 DoD 충족.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`TODO-01.md`](./TODO-01.md) |
| 02 | 확장 가능한 아키텍처 설계와 백로그 갱신 | 2026-03-10 | [`TODO-02.md`](./TODO-02.md) |

## Notes

- 2026-03-10: sprint-02 Boundary 완료. 승인된 Spec과 PB-007~PB-011 설계 결과를 보존하고 implementation sprint로 전환한다.
