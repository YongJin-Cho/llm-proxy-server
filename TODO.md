# TODO: LLM Proxy Server — Turn 관리·분석 UI 요구사항 및 구현 백로그 확정

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-12 — [Turn 관리·분석 UI 요구사항 및 구현 백로그 확정](./scrum/sprint-12.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 6 | 2 | 0 | 0 |

**Sprint goal:** 저장·분석할 가치가 있는 turn을 운영자가 별도로 관리할 수 있도록 요구사항을 확정하고 승인 Spec을 구현 backlog로 분해한다.
**Current focus:** T-007
**Recommended next:** T-007 — Turn 관리·분석 UI Spec 작성 및 승인

## Tasks

- [x] **T-001** — Turn 관리·분석 UI PRD delta 작성
  - Phase: PRD
  - Artifact: `spec/PRD.md`
  - Depends: —
  - Notes: 기존 turn traffic 탐색 기능을 확장하는 이번 요구사항의 목표·범위·성공 기준을 추가했다. 사용자 승인 대기.

- [x] **T-002** — PRD delta 승인
  - Phase: gate
  - Artifact: `spec/PRD.md`
  - Depends: T-001
  - Notes: 사용자 go-ahead("ok")로 승인했다. 같은 턴에 AC 식별을 시작했다.

- [x] **T-003** — Blocking AC 식별 및 의존 순서 확정
  - Phase: AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-002
  - Notes: AC-025~AC-028을 identified로 append하고 AC-025 → AC-026 → AC-027 → AC-028 review 순서를 설정했다.

- [x] **T-004** — AC 목록 승인 게이트
  - Phase: gate
  - Artifact: `spec/AC.md`
  - Depends: T-003
  - Notes: 사용자 go-ahead("ok")로 AC-025~AC-028과 의존 순서를 승인했다.

- [x] **T-005** — AC별 설계 결정 및 ADR/Direct Input 정리
  - Phase: AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-004
  - Notes: AC-025를 reviewing으로 전환하고 proposed ADR을 작성했다. 사용자 입력으로 turn 단위 물리 삭제·child traffic cascade·논리 삭제/복원 제외를 반영했다. 사용자 go-ahead("B로 해줘")로 Option B ADR을 approved 처리하고 AC-025를 designed로 정리했다. AC-026 Option A와 AC-027 Option A를 승인 후 designed 처리했으며, AC-028 review를 시작했다. AC-028 ADR에 `highlight.js` 감지 → Monaco read-only 표시와 viewer 내 사용자 형식 재선택을 포함한 Option B~D를 추가했다. 사용자 go-ahead("D로 해줘")로 Option D를 approved 처리하고 AC-028을 designed로 정리했다. 후속 쟁점은 viewer dependency selection, format mode contract, preview thresholds로 triage했다. `adr/viewer-dependency-selection.md`를 proposed 상태로 열어 Option A~C와 검증 기준을 기록했다. 사용자 go-ahead("ok")로 Option A를 approved 처리했으며, `adr/format-mode-contract.md`를 proposed 상태로 열어 Option A~C를 비교했다. 사용자 go-ahead("ok")로 Option A를 approved 처리했으며, preview thresholds가 남은 후속 쟁점이다. 사용자 Direct Input으로 preview threshold를 확정했다: 각 request/response/error content field는 1 MiB까지 전문을 제공하고 별도 문자 수·줄 수 truncation은 두지 않으며, inline 접기와 전체 보기만 표시 상태로 구분한다. AC-028과 부모 ADR에 반영했고 모든 blocking AC·후속 ADR이 settled 상태가 되었다.

  - [x] **T-006** — ASR 통합 및 승인
  - Phase: ASR
  - Artifact: `spec/ASR.md`
  - Depends: T-005
  - Notes: ASR-028~ASR-031 초안을 기존 registry에 append했다. 사용자 go-ahead("ok")로 Sprint 12 ASR delta와 전체 ASR registry를 승인했다.

- [ ] **T-007** — Turn 관리·분석 UI Spec 작성 및 승인
  - Phase: Spec
  - Artifact: `spec/llm-proxy-turn-management.md`, `spec-review/llm-proxy-turn-management.md`
  - Depends: T-006
  - Notes: `spec/llm-proxy-turn-management.md` 초안을 작성했다. formal Spec review 및 승인을 기다린다.

  - [ ] **T-008** — 승인 Spec 기반 PB-025 이후 backlog encode 및 Demo Checklist
  - Phase: backlog
  - Artifact: `scrum/product-backlog.md`, `scrum/sprint-12.md`
  - Depends: T-007

- [ ] **T-009** — Sprint Boundary → next implementation sprint
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-12.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008

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
| 09 | Turn 기반 traffic 그룹핑·탐색 요구사항 확정 | 2026-03-10 | [`TODO-09.md`](./scrum/TODO-09.md) |
| 10 | Turn grouping backend과 SSE aggregate 구현 | 2026-03-10 | [`TODO-10.md`](./scrum/TODO-10.md) |
| 11 | Turn tree API·Sidebar UI·통합 검증 완성 | 2026-03-10 | [`TODO-11.md`](./scrum/TODO-11.md) |

## Notes

- 2026-03-10: Sprint 11 Boundary 완료 상태를 반영해 Sprint 12 Spec→backlog 계획을 승인하고 실행 보드를 시드했다.
- 2026-03-10: T-001 PRD delta 초안 작성 완료. 사용자 PRD 승인 후 AC 식별로 진행한다.
