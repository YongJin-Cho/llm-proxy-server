# TODO: LLM Proxy Server — API별 turn note 요구사항·구현 backlog 확정

> **Project root:** `llm-proxy-server`
> **Current sprint:** sprint-15 — [Turn 완료 후 API별 분석 note 파이프라인 요구사항·구현 backlog 확정](./scrum/sprint-15.md)
> **Product Backlog:** [`scrum/product-backlog.md`](./scrum/product-backlog.md)

## Snapshot

| Done | Open | Blocked | Skipped |
|------|------|---------|---------|
| 2 | 6 | 0 | 0 |

**Sprint goal:** Turn 종료 후 API별 request/response 분석으로 도구 사용 이력을 note로 남기고 Turn view에서 확인하는 기능의 사용자 승인 요구사항, 설계 결정, 구현·검증 backlog를 확정한다.
**Current focus:** T-003
**Recommended next:** T-003 — AC review 전체 settled 결과 확인 및 ASR stage-exit 승인 대기

## Tasks

- [x] **T-001** — PRD delta 작성 및 승인
  - Phase: PRD
  - Artifact: `spec/PRD.md`
  - Depends: —
  - Notes: 기존 제품 PRD에 API별 turn note 분석·저장·표시 delta를 추가했다. 2026-03-10 사용자 go-ahead("ok")로 승인되어 AC 식별로 진행했다.

- [x] **T-002** — Blocking AC 식별 및 목록 승인
  - Phase: AC identification
  - Artifact: `spec/AC.md`
  - Depends: T-001
  - Notes: AC-029~AC-034를 식별하고 dependency order를 등록했다. 2026-03-10 사용자 go-ahead("ok")로 목록을 승인해 AC review를 시작했다.

- [ ] **T-003** — Blocking AC 설계 결정
  - Phase: AC review
  - Artifact: `spec/AC.md`, `adr/`
  - Depends: T-002
  - Notes: AC-029를 승인 처리했다. 다음은 AC-030 adapter와 turn grouping 경계이며, 이후 AC-031~034를 순차적으로 확정한다.

- [ ] **T-004** — ASR consolidation 및 승인
  - Phase: ASR consolidation
  - Artifact: `spec/ASR.md`
  - Depends: T-003
  - Notes: PRD delta와 모든 설계 완료 AC 결과를 통합한다.

- [ ] **T-005** — API별 turn note Spec 작성
  - Phase: Spec writing
  - Artifact: `spec/llm-proxy-turn-notes.md`
  - Depends: T-004
  - Notes: 구현·검증 SSOT가 될 R/C 요구사항과 API/data/UI 계약을 작성한다.

- [ ] **T-006** — Spec review 및 승인
  - Phase: Spec review
  - Artifact: `spec/llm-proxy-turn-notes.md`, `spec-review/llm-proxy-turn-notes.md`
  - Depends: T-005
  - Notes: 승인 Spec과 review record를 확정한다.

- [ ] **T-007** — PB-030을 구현 stories로 분해
  - Phase: backlog encoding
  - Artifact: `scrum/product-backlog.md`
  - Depends: T-006
  - Notes: 승인 Spec 기반으로 후속 Backlog→Implementation sprint 후보 PB stories를 append한다.

- [ ] **T-008** — Sprint Boundary → sprint-16
  - Phase: cross-cutting
  - Artifact: `scrum/TODO-15.md`
  - Depends: T-001, T-002, T-003, T-004, T-005, T-006, T-007
  - Notes: Sprint completion 승인 후 board archive, PB-030 DoD 갱신, 후속 implementation sprint 계획을 준비한다.

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
| 12 | Turn 관리·분석 UI 요구사항 및 구현 백로그 확정 | 2026-03-10 | [`TODO-12.md`](./scrum/TODO-12.md) |
| 13 | Turn 관리·메타데이터·탐색·요약 구현 | 2026-03-10 | [`TODO-13.md`](./scrum/TODO-13.md) |
| 14 | 안전한 traffic content viewer 구현·검증 | 2026-03-10 | [`TODO-14.md`](./scrum/TODO-14.md) |

## Notes

- 2026-03-10: Sprint 15 계획을 사용자 go-ahead("ok")로 승인하고 Spec→backlog 실행 보드를 seed했다.
- 2026-03-10: Sprint 15 첫 작업으로 API별 turn note 기능의 PRD delta를 작성했다.
- 2026-03-10: PRD delta 승인 후 AC-029~AC-034를 `spec/AC.md`에 append했다. 사용자 목록 승인 후 AC-029 ADR 검토를 시작했다.
