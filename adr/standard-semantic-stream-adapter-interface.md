# 표준 semantic·stream adapter interface

## Concern
Responses, Chat Completions, Messages의 API별 tool call/tool message 분석과 SSE 최종 응답 aggregation을 공통 proxy service가 사용할 수 있도록 어떤 표준 adapter interface로 정의할 것인가?

## Status
approved

## Context
- client와 harness는 변경할 수 없고 proxy가 traffic request/response를 분석해야 한다.
- response의 tool call 유무로 turn 진행·종료를 판정하고, 다음 request의 tool message ID로 기존 turn을 연결한다.
- SSE는 client에 원본 event를 전달하지만 저장 시 API별 최종 response 하나를 생성해야 한다.
- API별 메시지, tool call, tool result, SSE delta와 종료 event schema가 다르다.
- 기존 ProxyAdapter 경계를 유지하면서 semantic 분석과 aggregation을 API별 adapter에 격리해야 한다.

## Decision
**Option A — 최소 semantic + stream aggregate contract.** Adapter는 request의 tool result identities, response의 tool call identities와 `hasToolCalls`, stream aggregator factory를 제공한다. 공통 proxy service는 이 semantic operation만 호출하고, API별 adapter가 최종 provider response JSON을 생성한다. API 간 canonical response 변환은 수행하지 않는다.

## Options
### Option A — 최소 semantic + stream aggregate contract
- adapter가 request에서 tool result identity를 추출하고 response에서 tool call identity·유무를 추출한다.
- adapter가 stream event를 누적하고 최종 response JSON을 반환한다.
- 공통 service는 `analyzeRequest`, `analyzeResponse`, `createStreamAggregator` 같은 semantic operation만 호출한다.
- Pro: 공통 service가 API schema를 몰라도 되고, 기존 adapter 경계와 자연스럽게 결합된다.
- Con: API별 최종 response 생성 결과의 형태와 오류 contract를 엄격히 정의해야 한다.

### Option B — canonical internal message/tool model로 완전 변환
- adapter가 모든 API payload를 공통 message, tool call, tool result, usage 모델로 변환한다.
- 공통 service가 canonical model로 grouping과 aggregation을 수행한다.
- Pro: grouping 로직과 test fixture를 공통화하기 쉽다.
- Con: provider/API 원본 schema 손실과 변환 복잡도, 다시 API별 response로 복원하는 비용이 발생한다.

### Option C — API별 callback/event processor를 공통 service에 주입
- 공통 service는 raw event를 callback으로 adapter에 전달하고 adapter가 상태를 직접 변경한다.
- semantic 결과는 callback 또는 mutable context로 반환한다.
- Pro: API별 특수 event를 유연하게 처리한다.
- Con: lifecycle·mutable state·실패 처리 경계가 불명확해져 테스트와 유지보수가 어렵다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| API 원본 보존 | 높음 | 변환에 따라 손실 | 높음 |
| 공통 grouping 로직 | 높음 | 매우 높음 | 낮음 |
| adapter 책임 명확성 | 높음 | 중간 | 낮음 |
| 구현 복잡도 | 중간 | 높음 | 중간~높음 |
| stream lifecycle 테스트 | 명확 | 명확하지만 변환 필요 | 불명확 |

## Recommendation
- **Option A — 최소 semantic + stream aggregate contract**를 채택한다. turn grouping에 필요한 semantic 정보만 표준화하고 최종 response 생성은 adapter가 소유하면 API 원본 계약과 현재 adapter 구조를 함께 보존할 수 있다.

## Consequences
- 표준 interface는 최소한 request의 tool result identities, response의 tool call identities/hasToolCalls, stream aggregator factory를 제공해야 한다.
- tool call/result identity가 없는 API는 empty semantic result를 반환하고 AC-022 fallback 규칙을 따른다.
- aggregation 결과는 adapter가 소유하는 API response JSON이며 공통 service는 raw API schema를 조립하지 않는다.
- API adapter contract tests는 normal response, multiple tool calls, out-of-order tool results, streaming content/tool deltas, completion and failure cases를 포함해야 한다.

## Downstream Concerns
- [ ] **ADR candidate — Partial aggregate on failure:** 정상 종료 전 중단 시 partial aggregate의 저장 형식과 상태를 결정해야 한다.
- [x] **covered — Adapter registration:** 기존 `ProxyAdapter` 등록 구조를 유지하고 semantic operation을 contract에 확장한다.
- [x] **out of scope — Canonical cross-API response:** API 간 공통 response 변환은 하지 않는다.

## Related
- `spec/AC.md` — AC-011, AC-019, AC-024
- `adr/turn-grouping-storage-lifecycle.md`
- `adr/sse-final-response-aggregation.md`

## Notes
- 2026-03-10: AC-019 및 AC-024 승인 ADR의 downstream concern으로 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다. 최소 semantic contract와 adapter-owned final response aggregation을 사용한다.
