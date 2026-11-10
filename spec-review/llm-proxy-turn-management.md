# Spec Review: Turn 관리·분석 UI

**Spec:** `llm-proxy-server/spec/llm-proxy-turn-management.md` (aligned with `spec/PRD.md`)
**Reviewed:** 2026-03-10
**Summary:** 3 pass, 0 fail, 1 non-blocking clarification

## SSOT Sufficiency

| # | Check | Status | Notes |
|---|---|---|---|
| 1 | Blocking ASRs encoded in R-NNN / C-NNN (substance) | pass | ASR-028~ASR-031의 저장·삭제, filter/pagination, summary/usage, viewer/mode/1 MiB 기준이 R-001~R-012와 C-001~C-005에 내용상 반영되었다. |
| 2 | No ID-/path-only bullets (provenance after statement OK) | pass | 각 R/C 항목은 독립적으로 구현 가능한 본문을 갖고 provenance는 후행 추적 정보로만 사용한다. |
| 3 | Every R-NNN is testable; every C-NNN present and stable | pass | R-001~R-012와 C-001~C-005가 연속·중복 없이 정의되었고 API, transaction, fallback, state scope, size bound를 검증할 수 있다. |

## Pre-Implementation Design Gaps

- **Non-blocking — exact dependency versions:** `@uiw/react-json-view`, `react-markdown` 계열, `@monaco-editor/react`, `highlight.js`의 실제 버전·lockfile 조합은 설치 시점에 확정한다. `adr/viewer-dependency-selection.md`의 승인된 deferred assumption에 따라 React 19 호환성, production bundle, worker, license, security 검증을 통과하지 못하면 구현 전에 Spec을 갱신하고 재승인한다.
- Blocking design gap은 없다. Mode contract, viewer adapter 경계, 1 MiB display bound, execution safety는 Spec에 명시되어 있다.

## Cross-Document Inconsistencies

- 없음. `spec/PRD.md`의 Turn 관리·분석 UI delta, `spec/ASR.md`의 ASR-028~ASR-031, AC-025~AC-028의 승인 결과와 Spec R/C가 일치한다.
- `spec/llm-proxy-turn-traffic.md`와의 관계도 기존 grouping·tree·URL selection 계약을 유지하는 C-001/C-002로 명시되어 기능 범위가 중복·충돌하지 않는다.

## Ambiguities & Clarifications Needed

- **Non-blocking — R-007/R-009:** curated code language의 최종 목록은 dependency 설치와 Monaco language mapping 검증 후 확정한다. 목록 밖 언어의 Plain text fallback은 이미 고정되어 있으므로 implementation blocker가 아니다.
- **Non-blocking — R-010:** 1 MiB는 UTF-8 byte 기준이며 field별 적용이라는 점이 명시되어 있다. inline layout의 구체적인 접기 UI는 제품 구현 선택으로 남기되, 전체 보기에서 bounded content 전체를 표시해야 한다.

## Recommended Next Steps

- **Pass + user approval recorded:** Spec을 SSOT로 승인하고 PB-025 이후 product backlog를 append한다.
- Spec→backlog Sprint 12에서 제품 코드를 구현하지 않는다.
- 다음 Backlog→Implementation sprint 계획에서 PB-025~PB-029 중 구현 범위를 선택하고 별도 Sprint plan approval을 받는다.

## User Review

- 2026-03-10: 사용자 go-ahead("ok")로 `spec/llm-proxy-turn-management.md`를 구현·검증의 SSOT로 승인했다. 본 review는 3 pass, 0 fail이며 dependency version과 curated language 최종 목록은 비차단 구현 전 검증 항목으로 승인된 deferred assumption에 따른다.
