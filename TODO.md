# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-02 — [확장 가능한 아키텍처 설계와 백로그 갱신](./scrum/sprint-02.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 4 | 9 | 0 | 0 |

**Sprint goal:** API·UI·provider·저장소 확장을 위한 설계 결정을 승인된 Spec과 제품 백로그에 반영한다.
**Current focus:** T-005 — 첫 번째 unsettled AC 검토
**Recommended next:** T-005 — 첫 번째 unsettled AC 검토 (AC-008 API framework ADR의 옵션과 trade-off 중 하나를 선택해야 함)

## Tasks

- [x] **T-001** — PRD delta 작성
  - Phase: ① PRD
  - Artifact: `spec/PRD.md`
  - Depends: —
  - Notes: sprint-02의 모듈화·framework·provider routing·DB boundary·확장 UI 설계를 제품 범위에 반영한다.

- [x] **T-002** — PRD 승인
  - Phase: gate
  - Artifact: `spec/PRD.md`
  - Depends: T-001
  - Notes: 2026-03-10 사용자 “ok”로 PRD delta 승인.

- [x] **T-003** — delta AC 식별
  - Phase: ② AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-002
  - Notes: AC-008~AC-013을 append하고 dependency order를 설정.

- [x] **T-004** — AC 목록 승인
  - Phase: gate
  - Artifact: `spec/AC.md`
  - Depends: T-003
  - Notes: 2026-03-10 사용자 “ok”로 전체 AC 목록과 dependency order 승인.

- [ ] **T-005** — 첫 번째 unsettled AC 검토
  - Phase: ③ AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-004
  - Notes: AC-008을 reviewing으로 전환하고 `adr/api-framework-and-server-structure.md`를 proposed로 작성함. 사용자 선택 대기.
  - Notes: dependency order에 따라 한 번에 하나의 blocking AC만 검토한다.

- [ ] **T-006** — AC resolution gate
  - Phase: gate
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-005

- [ ] **T-007** — 다음 AC 검토·resolution 반복
  - Phase: ③ AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-006
  - Notes: 모든 새 blocking AC가 designed/deferred가 될 때까지 필요한 만큼 반복한다.

- [ ] **T-008** — ASR delta 통합
  - Phase: ④ ASR consolidation
  - Artifact: `spec/ASR.md`
  - Depends: T-006, T-007

- [ ] **T-009** — ASR 승인
  - Phase: gate
  - Artifact: `spec/ASR.md`
  - Depends: T-008

- [ ] **T-010** — Spec delta 작성·검토
  - Phase: ⑤ Spec writing / ⑥ Spec review
  - Artifact: `spec/llm-proxy-server.md`, `spec-review/`
  - Depends: T-009

- [ ] **T-011** — PB-007~PB-011 Spec 참조·DoD 갱신
  - Phase: Spec→backlog encode
  - Artifact: `scrum/product-backlog.md`
  - Depends: T-010

- [ ] **T-012** — Demo checklist 확인
  - Phase: gate
  - Artifact: `scrum/sprint-02.md`
  - Depends: T-011

- [ ] **T-013** — Sprint Boundary → sprint-03
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-02.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012
  - Notes: sprint completion 승인 후 보드 archive, backlog 갱신, 다음 스프린트 계획으로 전환한다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|
| 00 | 초기 제품 백로그 정의 | 2026-03-10 | [`TODO-00.md`](./scrum/TODO-00.md) |
| 01 | LLM Proxy MVP 구현 | 2026-03-10 | [`TODO-01.md`](./scrum/TODO-01.md) |

## Notes

- 2026-03-10: sprint-01 Boundary 완료 상태에서 sprint-02 계획을 승인하고 실행 보드를 시드했다.
- sprint-02는 Spec→backlog delta 스프린트이며 실제 제품 구현은 범위에 포함하지 않는다.
