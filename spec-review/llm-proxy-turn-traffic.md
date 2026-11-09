# Spec Review: Turn 기반 LLM traffic 그룹핑·탐색

**Spec:** `spec/llm-proxy-turn-traffic.md` (aligned with `spec/PRD.md`의 `Delta: Turn 기반 traffic 그룹핑·탐색 UI`)
**Reviewed:** 2026-03-10
**Summary:** 3 pass, 0 fail, 2 needs-clarification

## SSOT Sufficiency
| # | Check | Status | Notes |
|---|---|---|---|
| 1 | Blocking ASRs encoded in R-NNN / C-NNN (substance) | pass | ASR-021~ASR-027의 핵심 결과가 R-001~R-008 및 C-001~C-007에 반영되어 있다. proxy semantic grouping, 동시 미완료 turn, SSE aggregate, tree query, legacy projection, URL selection을 확인할 수 있다. |
| 2 | No ID-/path-only bullets (provenance after statement OK) | pass | 요구사항과 제약은 대체로 독립적인 문장으로 작성되어 있으며 provenance는 본문 뒤에 보조적으로 사용된다. |
| 3 | Every R-NNN is testable; every C-NNN present and stable | pass | 승인된 fallback policy가 R-001/R-002/C-007에 deep-copy되었다. 누락·미매칭·모호 identity는 각각 고정 reason과 새 standalone turn으로 결정적으로 처리된다. |

## Pre-Implementation Design Gaps

### Blocking
- 없음. `adr/ambiguous-missing-tool-id-fallback.md`의 Option B 승인 결과가 AC-023, ASR-022, R-001, R-002, C-007에 반영되었고 blocking Open Question을 제거했다.

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

- `adr/ambiguous-missing-tool-id-fallback.md`의 approved Decision과 Spec의 R-001/R-002/C-007, ASR-022, AC-023 사이에 일관성이 확인되었다.
- 그 외 PRD delta, ASR-021~ASR-027, 관련 approved ADR의 주요 결과와 Spec 사이에서 명백한 누락·모순은 발견되지 않았다.

## Ambiguities & Clarifications Needed

1. **Resolved — missing/ambiguous tool identity**
   - `R-001`, `R-002`, `C-007`
   - identity 누락·미매칭·모호 매칭 request는 각각 고정 fallback reason과 함께 새 standalone turn으로 저장하고, 기존 turn은 변경하지 않으며 request는 계속 upstream으로 전달한다.

2. **Needs clarification — persistence identity/ordering contract**
   - `R-001`, `R-002`, `R-006`
   - turn/traffic stable identifier와 sequence 할당 규칙을 명시할 필요가 있다.

3. **Needs clarification — tree API wire contract**
   - `R-004`, `R-005`
   - endpoint의 pagination 입력·출력과 node 필드, 동일 시각 정렬 규칙을 명시할 필요가 있다.

## Recommended Next Steps

- fallback ADR 승인 결과를 AC → ASR → Spec에 반영하고 ⑥ Spec review를 재실행했다.
- Review는 pass했지만 stable identity/ordering 및 tree API wire contract는 non-blocking clarification으로 남아 있다. 사용자는 이제 Spec을 구현·검증의 SSOT로 승인할 수 있다.
- Spec 승인 후 Sprint 09의 PB-019를 구현 가능한 하위 backlog story로 분해하고 Boundary로 진행한다.

## User Review

- 2026-03-10: Spec review 최초 결과를 기록했다. `C-007`의 fallback policy가 미정의되어 당시 Spec은 SSOT 승인 불가 상태였다.
- 2026-03-10: `adr/ambiguous-missing-tool-id-fallback.md` 승인 결과를 AC-023, ASR-022, R-001/R-002/C-007에 반영하고 review를 재실행했다. 결과는 3 pass, 0 fail, 2 needs-clarification이며 SSOT 승인 가능 상태다.
