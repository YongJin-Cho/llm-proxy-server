# Spec Review: LLM Proxy Monitoring UI

**Spec:** `llm-proxy-server/spec/llm-proxy-ui.md` (aligned with `spec/PRD.md`)
**Reviewed:** 2026-03-10
**Summary:** 3 pass, 1 fail, 2 needs-clarification

## SSOT Sufficiency

| # | Check | Status | Notes |
|---|---|---|---|
| 1 | Blocking ASRs encoded in R-NNN / C-NNN (substance) | pass | UI 관련 ASR-011, ASR-014, ASR-023, ASR-025~ASR-031의 React boundary, tree/query, selection, summary, safe viewer, JSON container와 문자열 leaf popup 계약이 R-001~R-026 및 C-001~C-011에 내용상 반영되어 있다. |
| 2 | No ID-/path-only bullets (provenance after statement OK) | pass | R/C 항목은 구현 가능한 본문을 가지며 provenance는 후행 추적 정보로 사용된다. |
| 3 | Every R-NNN is testable; every C-NNN present and stable | pass | R-001~R-026과 C-001~C-011은 중복 ID 없이 정의되어 있다. JSON tree container, 문자열 preview, popup open/close, mode reset, exclusive view, 상태 표시를 검증할 수 있다. R-025~R-026은 기존 R-024 이후 append되었다. |

## Pre-Implementation Design Gaps

### Blocking — traffic summary data contract is not owned by an API Spec

- **Location:** `spec/llm-proxy-ui.md` R-021, R-022, R-023; C-001; Out of Scope.
- **Issue:** UI Spec은 turn traffic summary table과 traffic summary에서 `model provider`, input tokens, cached input tokens, output tokens, cost, 처리 시간을 요구한다. 그러나 현재 `TurnTraffic` view model과 `/api/v1/turns` tree projection에는 provider 및 traffic별 usage/cost 필드가 없고, `Log` view model에도 provider 필드가 없다.
- **Conflict:** UI Spec은 “새 turn/traffic API contract는 Out of Scope”라고 하면서, 현재 상위 turn-management Spec에도 traffic별 usage summary의 필드·provider 공급 계약이 명시되어 있지 않다.
- **Required action:** 다음 중 하나를 사용자 결정으로 확정해야 한다.
  1. `/api/v1/turns` child traffic projection과 traffic detail response에 provider 및 normalized usage/cost/latency 필드를 추가하고, 해당 server Spec/ASR/verification을 갱신한다.
  2. UI Spec에서 provider·traffic별 usage table을 제거하거나 현재 API가 제공하는 필드로 범위를 축소한다.
- **Why blocking:** 구현자가 데이터를 추정하거나 UI가 server projection을 재계산하게 만들 수 있어 R-021/R-023을 독립적으로 구현·검증할 수 없다.

## Cross-Document Inconsistencies

### Fail — existing management Spec review is stale for the changed viewer contract

- **Sources:** `spec-review/llm-proxy-turn-management.md` User Review; `spec/llm-proxy-turn-management.md` R-007~R-012; `spec/llm-proxy-ui.md` R-012~R-016 and R-024~R-026.
- **Description:** 기존 review record는 “JSON parse 성공은 JSON tree, Markdown/code/text는 field-level viewer” 계약을 승인했다. 현재 Spec은 request/response를 JSON container로 고정하고 JSON 내부 문자열 leaf만 popup viewer 대상으로 변경했다.
- **Severity:** blocking for treating the existing management review as approval of the new contract; non-blocking for this UI draft once the new UI Spec receives its own approval and the parent review is superseded or amended.
- **Required action:** `spec-review/llm-proxy-turn-management.md`에 변경 후 재검토 기록을 추가하거나, 변경된 parent Spec에 대한 새 review pass를 기록해야 한다. 기존 User Review 문구를 새 계약 승인으로 간주해서는 안 된다.

### Non-blocking — ADR historical options retain the previous whole-content wording

- **Source:** `adr/long-string-safe-rendering.md` Options A/D and Recommendation versus revised Decision/Consequences.
- **Description:** ADR의 historical Options와 Recommendation은 이전의 field-level JSON/Markdown/code viewer 선택지를 설명하고, revised Decision은 JSON container + string leaf popup으로 변경했다.
- **Severity:** non-blocking because Decision/Consequences now contain the active contract.
- **Recommended action:** Notes에 revised Decision이 historical options/recommendation을 supersede한다는 점을 더 명확히 기록하거나, 다음 ADR maintenance pass에서 Recommendation 문구를 revised Decision과 일치시킨다.

## Ambiguities & Clarifications Needed

### Needs clarification — provider identity source

- **Location:** `spec/llm-proxy-ui.md` R-021, R-022, R-023.
- **Question:** “model provider”는 어떤 값을 의미하는가? provider routing 설정의 provider ID, traffic log에 저장된 provider ID, 또는 provider endpoint/URL인가?
- **Suggested resolution:** UI는 server projection이 제공하는 stable `provider` display field만 표시하고 URL이나 configuration을 추론하지 않도록 정의한다. field가 unavailable이면 `—`를 표시한다.

### Needs clarification — traffic summary data source and null/partial semantics

- **Location:** `spec/llm-proxy-ui.md` R-021, R-023; `spec/llm-proxy-turn-management.md` R-006.
- **Question:** traffic row의 usage/cost가 child traffic projection에 포함되는가, 아니면 각 traffic detail fetch 후 조합하는가? UI Spec은 lazy detail fetch를 유지하면서 table을 즉시 표시해야 하므로, table에 필요한 값은 tree response에 포함되어야 하는지 확정이 필요하다.
- **Suggested resolution:** tree child summary에 body-free normalized usage/cost/provider fields를 포함하고, 값이 없으면 `null`을 전달한다. UI는 `—`를 표시하며 partial은 turn-level aggregate에만 적용한다. 이 resolution을 선택하면 turn query Spec과 verification fixture를 갱신한다.

## Current Implementation Alignment

| Area | Evidence | Status |
|---|---|---|
| Right content is `TurnView` or `TrafficView` | `src/ui/pages/TrafficPage.tsx` | pass; implemented |
| URL selection and direct traffic detail fetch | `TrafficPage` selection/effect | pass; implemented |
| Turn collapse/expand icon and header pagination | `src/ui/components/TurnTree.tsx`, current styles | fail against R-019/R-020; not implemented |
| Turn traffic summary table | `src/ui/components/TurnView.tsx` | fail against R-021; child buttons only |
| Traffic usage summary | `src/ui/components/TrafficView.tsx`, `LogDetail.tsx` | fail/needs API data; no dedicated summary and no provider field |
| JSON container plus string leaf popup viewer | `src/ui/components/ContentViewer.tsx` | fail against R-012~R-016/R-024~R-026; current component detects whole content and has no popup |
| Safe viewer fallback and read-only existing viewer | `ContentViewer.tsx`, viewer verification | partial; existing safety tests cover old field-level viewer contract |

## Recommended Next Steps

1. **Do not approve the UI Spec as implementation SSOT yet.** Resolve the blocking provider/traffic usage data contract in dependency order.
2. Update the owning query/API Spec and its ASR/verification fixture, or explicitly reduce R-021/R-023 to fields already supplied by the server.
3. Reconcile the stale `spec-review/llm-proxy-turn-management.md` record with the revised JSON container/string popup contract.
4. After those changes, re-run Stage ⑥ review. Then user approval of `spec/llm-proxy-ui.md` can authorize backlog/implementation planning; current implementation gaps must be implemented against the approved Spec rather than treated as completed.

## Review Outcome

**Verdict: Needs revision before approval.**

The UI Spec is structurally strong and accurately records the requested JSON container/string popup direction, but it is not yet a complete implementation SSOT because the required provider and per-traffic usage data are not owned by a compatible query contract. The existing management review also cannot serve as approval for the changed viewer behavior.
