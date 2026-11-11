# API별 Turn Note Semantic Contract

## Concern
Responses, Chat Completions, Claude Messages의 request/response에서 tool call·tool result를 어떤 공통 turn note contract로 추출할 것인가?

## Status
proposed

## Context
- Sprint 15는 turn이 완료된 뒤 세 API의 request/response를 분석해 도구 사용 이력을 저장·표시하는 범위를 다룬다.
- 세 API는 tool call, tool result/message, streaming aggregate, metadata의 표현이 서로 다르다.
- 기존 turn grouping과 SSE aggregate는 이미 API별 semantic adapter 경계를 사용하므로 note 분석이 그 계약과 충돌하지 않아야 한다.
- note는 새로운 LLM 요약이 아니라 원본 payload에서 재현 가능한 구조화 분석 결과여야 한다.

## Decision

## Options
### Option A — 공통 Tool Interaction note contract
- 각 API adapter가 원본 request/최종 response를 분석해 공통 `ToolInteraction` 목록과 API/source metadata를 반환한다.
- 각 interaction은 최소한 call identity(있을 때), tool name, call input, tool result, 관찰 순서, 결과 상태를 표현한다.
- Pro: 세 API의 동일한 의미를 persistence·query·UI가 재사용하고, API 추가 시 adapter만 확장할 수 있다.
- Con: API별 고유 field를 공통 contract에 넣지 못하거나 별도 extension field가 필요하다.

### Option B — API별 note payload 보존
- adapter가 Responses·Chat Completions·Messages별 note payload를 각각 반환하고, 공통 계층은 API kind와 raw 분석 결과만 감싼다.
- Pro: API 고유 field와 원본 구조를 손실 없이 보존하고 adapter 구현이 직접적이다.
- Con: persistence·query·UI가 API별 분기를 가지며, 동일한 tool 사용 의미를 화면에서 다시 해석해야 한다.

### Option C — 공통 event envelope와 API별 extension
- adapter가 `tool_call`, `tool_result` 등의 공통 event envelope를 순서대로 반환하고, API별 특수 값은 typed extension에 둔다.
- Pro: 여러 event와 부분 분석을 표현하기 쉽고, API 고유 정보도 확장 가능하다.
- Con: 동일한 interaction을 call/result event 조합으로 재구성해야 하며, 저장·UI 계약이 Option A보다 복잡해진다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 공통 UI·조회 단순성 | 높음 | 낮음 | 중간 |
| API 고유 정보 보존 | extension 필요 | 높음 | 높음 |
| 호출·결과 매칭 표현 | 직접적 | API별 재해석 | event 조합 필요 |
| 재현 가능성 | 높음 | 높음 | 높음 |
| 신규 API 확장 비용 | adapter 중심 | 전 계층 분기 가능 | adapter·event 해석 확장 |

## Recommendation
- **Option A — 공통 Tool Interaction note contract**를 권장한다.
- 이번 범위의 핵심은 API별 원본을 다시 보여주는 것이 아니라, 세 API에서 발생한 도구 사용 이력을 동일한 의미로 Turn view에 표시하는 것이다. API 고유 정보는 별도 `source_metadata` 또는 bounded extension으로 제한적으로 보존하는 후속 설계가 적절하다.

## Consequences
- 승인 시 API별 분석 adapter는 공통 note contract를 반환하고, API별 차이는 adapter 내부에 캡슐화한다.
- note contract에는 adapter가 실제로 관찰한 값과 unavailable 상태를 구분하는 규칙이 필요하다.
- 원본 request/response는 기존 traffic 저장에 계속 보존하며 note는 파생 projection으로 저장한다.
- 자연어 요약, tool 품질 평가, provider 비용 계산은 이 concern의 contract에 포함하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Tool Interaction field completeness:** call input/result를 원문·요약·bounded 형태 중 무엇으로 저장할지
- [x] **directly resolved — 자연어 요약:** 새 LLM 호출 없이 payload 기반 구조화 분석만 수행한다. 이번 요구사항의 Out of Scope에 근거한다.
- [x] **covered — streaming aggregate 입력:** 분석 adapter는 기존 API별 최종 aggregate response와 request를 입력으로 사용한다. AC-024에 근거한다.

## Related
- `spec/AC.md` — AC-029
- `spec/PRD.md` — Delta: Turn 완료 후 API별 분석 note

## Notes
- 2026-03-10: AC-029 review를 위해 세 가지 note contract 대안을 작성하고 Option A를 권장안으로 제시했다.
