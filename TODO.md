# TODO: LLM Proxy Server

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-00 — [초기 제품 백로그 정의](./scrum/sprint-00.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 6 | 3 | 0 | 0 |

**Sprint goal:** LLM Proxy Server와 트래픽 모니터링 UI의 승인된 요구사항과 설계를 초기 제품 백로그로 변환한다.
**Current focus:** T-009
**Recommended next:** T-009 — Sprint Boundary → sprint-01 계획 승인 필요

## Tasks

- [x] **T-001** — Sprint 00 계획 승인 기록 및 실행 보드 초기화
  - Phase: scrum bootstrap
  - Artifact: `scrum/sprint-00.md`, `TODO.md`
  - Depends: —
  - Notes: 사용자 go-ahead(“계속해줘”)로 승인됨.

- [x] **T-002** — PRD 작성
  - Phase: ① PRD
  - Artifact: `spec/PRD.md`
  - Depends: T-001

- [x] **T-003** — PRD 승인 게이트
  - Phase: ① PRD gate
  - Artifact: `spec/PRD.md`
  - Depends: T-002

- [x] **T-004** — Blocking AC 식별 및 의존 순서 정의
  - Phase: ② AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-003

- [x] **T-005** — AC별 설계 결정 및 ADR/Direct Input 기록
  - Phase: ③ AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-004

- [x] **T-006** — ASR 통합 및 승인
  - Phase: ④ ASR consolidation
  - Artifact: `spec/ASR.md`
  - Depends: T-005

- [x] **T-007** — Spec 작성 및 승인 리뷰
  - Phase: ⑤–⑥ Spec
  - Artifact: `spec/llm-proxy-server.md`, `spec-review/llm-proxy-server.md`
  - Depends: T-006

- [x] **T-008** — 승인 Spec을 Product Backlog로 인코딩
  - Phase: backlog encoding
  - Artifact: `scrum/product-backlog.md`
  - Depends: T-007
  - Notes: PB-002–PB-006으로 구현 범위를 분해했다.

  - [ ] **T-009** — Sprint Boundary → sprint-01 계획
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-00.md`
  - Depends: T-002, T-003, T-004, T-005, T-006, T-007, T-008
  - Notes: 완료 검토와 별도 Boundary 승인을 거쳐 아카이브한다.

## Completed sprints

| Sprint | Goal | Closed | Archive |
|--------|------|--------|---------|

## Notes

- sprint-00 계획은 사용자 go-ahead로 승인되었다.
- Spec 리뷰와 사용자 승인을 완료했다.
- `scrum/sprint-01.md`에 다음 구현 스프린트 계획 초안을 작성했으며, sprint-00 Boundary 승인을 기다린다.
- 제품 구현은 이 Spec→backlog sprint의 범위가 아니다.
