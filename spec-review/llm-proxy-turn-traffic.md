# Spec Review: Turn 기반 LLM traffic 그룹핑·탐색

**Spec:** `spec/llm-proxy-turn-traffic.md` (aligned with `spec/PRD.md`의 `Delta: Turn 기반 traffic 그룹핑·탐색 UI`)
**Reviewed:** 2026-03-10
**Summary:** 2 pass, 1 fail, 2 needs-clarification

## SSOT Sufficiency
| # | Check | Status | Notes |
|---|---|---|---|
| 1 | Blocking ASRs encoded in R-NNN / C-NNN (substance) | pass | ASR-021~ASR-027의 핵심 결과가 R-001~R-008 및 C-001~C-007에 반영되어 있다. proxy semantic grouping, 동시 미완료 turn, SSE aggregate, tree query, legacy projection, URL selection을 확인할 수 있다. |
| 2 | No ID-/path-only bullets (provenance after statement OK) | pass | 요구사항과 제약은 대체로 독립적인 문장으로 작성되어 있으며 provenance는 본문 뒤에 보조적으로 사용된다. |
| 3 | Every R-NNN is testable; every C-NNN present and stable | fail | R-001/R-002 및 C-007이 tool identity 누락·모호 매칭의 fallback 동작을 정의하지 않는다. 이 상태에서는 동일 입력에 대해 새 turn, orphan traffic, 기존 turn 연결 중 어느 결과가 정답인지 검증할 수 없다. |

## Pre-Implementation Design Gaps

### Blocking
1. **Tool identity 누락·모호 매칭 fallback이 미정의됨**
   - **Location:** `C-007`, `Open Questions`, `R-001`, `R-002`
   - **Issue:** tool message identity가 없거나, 하나의 incoming request가 여러 미완료 turn의 tool call ID와 매칭될 수 있을 때의 처리 규칙이 없다. 예를 들어 새 turn을 생성할지, traffic을 orphan/legacy로 둘지, 요청을 거부할지, 결정적으로 하나를 선택할지 명시되지 않았다.
   - **Impact:** turn grouping과 completion 결과가 구현자 선택에 따라 달라지고 자동 검증의 expected result를 고정할 수 없다.
   - **Required action:** AC/ADR에서 fallback policy를 결정하고, 승인 결과를 ASR에 통합한 뒤 Spec의 R-001/R-002/C-007 및 검증 요구사항에 구체적인 입력·결과 규칙으로 deep-copy해야 한다. `Open Questions`의 Blocking 항목도 제거하거나 사용자 승인된 deferred assumption으로 바꿔야 한다.
   - **Related:** `adr/turn-order-concurrency-completion.md`의 `Ambiguous/missing tool IDs` downstream concern

### Non-blocking recommendations
1. **Turn 저장 관계와 stable identifier의 최소 계약을 더 구체화할 것**
   - **Location:** `R-001`, `R-002`, `R-006`
   - **Issue:** stable turn ID, traffic-to-turn 관계의 저장 표현, turn 상태/sequence를 구현자가 설계할 수 있다. 이는 현재 동작 구현을 완전히 막지는 않지만 persistence/query 구현과 테스트 fixture의 일관성을 약화시킨다.
   - **Suggested action:** 최소한 turn identifier의 생성·유일성 범위, traffic의 turn reference, sequence의 정수/할당 시점, 상태 값 집합을 명시한다.

2. **`GET /api/v1/turns`의 응답·pagination 계약을 더 구체화할 것**
   - **Location:** `R-004`, `R-005`
   - **Issue:** turn 단위 pagination과 child summary의 의미는 명시되어 있으나 query parameter, total/has-next 표현, 필수 node 필드와 정렬 tie-breaker가 고정되어 있지 않다.
   - **Suggested action:** 최소 response shape, pagination parameter/metadata, 동일 `started_at`일 때의 deterministic tie-breaker를 명시한다.

## Cross-Document Inconsistencies

- **Blocking consistency gap:** Spec의 `C-007`과 `Open Questions`는 `adr/turn-order-concurrency-completion.md`의 미해결 downstream concern을 그대로 반영하고 있으므로 문서 간 모순은 아니다. 그러나 SDD readiness 기준상 구현을 막는 미해결 설계 결정이므로 Spec 승인 조건을 충족하지 못한다.
- 그 외 PRD delta, ASR-021~ASR-027, 관련 approved ADR의 주요 결과와 Spec 사이에서 명백한 누락·모순은 발견되지 않았다.

## Ambiguities & Clarifications Needed

1. **Blocking — missing/ambiguous tool identity**
   - `R-001`, `R-002`, `C-007`
   - 질문: identity가 없거나 여러 미완료 turn에 매칭되면 어떤 결과를 저장하는가? 이 경우 turn completion과 이후 traffic 연결은 어떻게 처리하는가?

2. **Needs clarification — persistence identity/ordering contract**
   - `R-001`, `R-002`, `R-006`
   - turn/traffic stable identifier와 sequence 할당 규칙을 명시할 필요가 있다.

3. **Needs clarification — tree API wire contract**
   - `R-004`, `R-005`
   - endpoint의 pagination 입력·출력과 node 필드, 동일 시각 정렬 규칙을 명시할 필요가 있다.

## Recommended Next Steps

- **Fail (design gap) →** `adr/turn-order-concurrency-completion.md`의 `Ambiguous/missing tool IDs` concern을 사용자 결정으로 확정한다. 필요하면 AC를 재개하고 ADR을 승인한 뒤 `ASR.md` → `spec/llm-proxy-turn-traffic.md`를 갱신하고 ⑥을 다시 실행한다.
- fallback 정책이 Spec에 반영되고 blocking Open Question이 닫힌 뒤에만 사용자가 Spec을 구현·검증의 SSOT로 승인할 수 있다.
- 이후 Spec review가 pass하면 Sprint 09의 PB-019를 구현 가능한 하위 backlog story로 분해하고 Boundary로 진행한다.

## User Review

- 2026-03-10: Spec review 결과를 기록했다. `C-007`의 fallback policy가 미정의되어 현재 Spec은 SSOT 승인 불가 상태다.
