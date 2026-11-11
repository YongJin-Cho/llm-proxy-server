# API별 Turn Note Semantic Contract

## Concern
Responses, Chat Completions, Claude Messages의 request/response에서 tool call·tool result를 어떤 공통 turn note contract로 추출할 것인가?

## Status
approved

## Context
- Sprint 15는 turn이 완료된 뒤 세 API의 request/response를 분석해 도구 사용 이력을 저장·표시하는 범위를 다룬다.
- 세 API는 tool call, tool result/message, streaming aggregate, metadata의 표현이 서로 다르다.
- 기존 turn grouping과 SSE aggregate는 이미 API별 semantic adapter 경계를 사용하므로 note 분석이 그 계약과 충돌하지 않아야 한다.
- note는 새로운 LLM 요약이 아니라 원본 payload에서 재현 가능한 구조화 분석 결과여야 한다.

## Decision
**Option D를 외부 note 저장 contract로 채택하고, adapter 내부에서는 Option A의 공통 semantic 분석 단계를 사용한다.** 각 turn은 `title`과 Markdown `content`를 가진 `TurnNote[]`로 저장·조회하며, API별 adapter는 payload를 먼저 공통 의미로 해석한 뒤 deterministic Markdown으로 렌더링한다. 분석 상태는 notes 배열과 별도의 status envelope로 표현한다.

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
- Con: 동일한 interaction을 call/result event 조합으로 재구성해야 하며, 저장·UI 계약이 Option A보다 복잡하다.

### Option D — `title` + Markdown `content` note 배열
- adapter가 turn별로 사람이 읽을 수 있는 note를 만들고, 저장 모델은 `{ title, content }` 배열로 제한한다.
- `content`는 새 LLM 호출 없이 API별 규칙에 따라 결정적으로 생성되는 Markdown 문자열이다.
- Pro: persistence·조회·UI contract가 매우 단순하고, 이번 범위의 운영자용 메모 표시 목적에 직접 맞는다.
- Con: 저장 시점에 구조화된 tool call/result 필드를 잃으므로 이후 검색·재렌더링·세부 검증을 하려면 원본 traffic을 다시 분석해야 한다.

## Tradeoffs
| | Option A | Option B | Option C | Option D |
|---|---|---|---|---|
| 공통 UI·조회 단순성 | 높음 | 낮음 | 중간 | 매우 높음 |
| API 고유 정보 보존 | extension 필요 | 높음 | 높음 | Markdown에 포함한 범위만 |
| 호출·결과 매칭 표현 | 직접적 | API별 재해석 | event 조합 필요 | 생성된 Markdown에 표현 |
| 재현·재렌더링 가능성 | 높음 | 높음 | 높음 | 원본 재분석 필요 |
| 신규 API 확장 비용 | adapter 중심 | 전 계층 분기 가능 | adapter·event 해석 확장 | adapter의 Markdown renderer 확장 |

## Recommendation
- **저장 contract는 Option D를 채택하되, adapter 내부 분석은 Option A의 공통 semantic 단계로 유지하는 조합**을 권장한다.
- 즉 adapter는 먼저 API별 payload를 공통 의미로 해석해 tool call/result의 누락·매칭·순서를 검증한 뒤, 그 결과를 결정적인 `{ title, content }` Markdown note로 렌더링한다.
- 이렇게 하면 사용자가 원하는 단순한 note 배열을 제공하면서도 API별 adapter가 단순 문자열 concatenation으로 변질되는 것을 막을 수 있다.

## Consequences
- 승인 시 외부 persistence/query/UI contract는 turn별 note 배열로 제공하며 각 note는 `title`과 Markdown `content`를 가진다.
- API별 분석 adapter는 내부적으로 공통 semantic intermediate result를 사용한 뒤 Markdown을 생성한다. 이 intermediate result를 DB에 별도 저장할지는 후속 persistence concern에서 결정한다.
- 원본 request/response는 기존 traffic 저장에 계속 보존하며 note는 파생 projection으로 저장한다.
- 자연어 요약, tool 품질 평가, provider 비용 계산은 이 concern의 contract에 포함하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Note status envelope:** `notes` 배열과 별도로 pending·empty·failed/unavailable 분석 상태를 어디에 표현할지. AC-033에서 결정한다.
- [ ] **ADR candidate — Tool Interaction field completeness:** 내부 semantic result에서 call input/result를 원문·요약·bounded 형태 중 무엇으로 Markdown에 포함할지. AC-030에서 adapter 책임과 함께 결정한다.
- [x] **directly resolved — 자연어 요약:** 새 LLM 호출 없이 payload 기반 구조화 분석만 수행한다. 이번 요구사항의 Out of Scope에 근거한다.
- [x] **covered — streaming aggregate 입력:** 분석 adapter는 기존 API별 최종 aggregate response와 request를 입력으로 사용한다. AC-024에 근거한다.

## Related
- `spec/AC.md` — AC-029
- `spec/PRD.md` — Delta: Turn 완료 후 API별 분석 note

## Notes
- 2026-03-10: AC-029 review를 위해 세 가지 note contract 대안을 작성하고 Option A를 권장안으로 제시했다.
- 2026-03-10: 사용자 제안에 따라 `title` + Markdown `content` 배열인 Option D를 추가하고, 저장 contract는 D·adapter 내부 semantic 분석은 A로 조합하는 권장안으로 수정했다. 아직 승인 전이다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option D 저장 contract와 Option A 내부 semantic 분석 조합을 승인했다.
