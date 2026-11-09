# SSE 최종 응답 통합 저장

## Concern
SSE streaming traffic을 client에는 투명하게 전달하면서 저장 시에는 개별 `data` event가 아닌 최종 통합 응답 하나로 저장하려면 어떤 aggregation contract를 사용할 것인가?

## Status
approved

## Context
- 기존 streaming 결정은 SSE를 client에 전달하고 종료 후 집계 로그를 저장한다.
- 현재 구현은 response에 개별 `data` event를 저장할 수 있어 traffic 상세가 최종 응답으로 바로 재사용되지 않는다.
- Responses, Chat Completions, Messages는 delta, tool call, finish event, usage 표현이 서로 다르다.
- client/harness는 변경하지 않고 API별 adapter에서 차이를 처리해야 한다.

## Decision
**Option A — API별 adapter가 canonical final response를 생성.** 각 adapter가 stream event를 API별 규칙으로 누적해 정상 종료 시 해당 API의 최종 response JSON 하나를 생성한다. content delta는 순서대로 합치고, tool call delta는 tool call ID 기준으로 병합하며, usage와 finish metadata를 반영한다. client로 전달하는 SSE bytes는 원본을 유지하고 개별 `data` event 배열은 저장하지 않는다.

## Options
### Option A — API별 adapter가 canonical final response를 생성
- adapter가 stream event를 API별 규칙으로 누적하고 정상 종료 시 해당 API의 최종 response JSON 하나를 생성한다.
- content delta는 순서대로 합치고, tool call delta는 tool call ID 기준으로 병합하며, usage와 finish metadata를 최종 결과에 반영한다.
- client로 전달하는 SSE bytes는 기존처럼 원본을 유지한다.
- Pro: 저장 결과가 API별 client contract와 일치하고 공통 service는 API 차이를 몰라도 된다.
- Con: API별 adapter에 aggregation 구현과 검증이 필요하다.

### Option B — 공통 service가 raw event를 모아 generic JSON으로 저장
- 공통 service가 모든 event를 모은 뒤 `events` 배열 또는 generic aggregate JSON으로 저장한다.
- Pro: adapter 변경량이 작고 구현이 빠르다.
- Con: 최종 API response가 아니며 UI/client contract 재사용성이 낮고 API별 병합 규칙이 공통 계층으로 샌다.

### Option C — 비스트리밍 response를 재구성하지 않고 마지막 event만 저장
- 마지막 data event 또는 종료 event를 response로 저장한다.
- Pro: 저장 구현이 단순하다.
- Con: 누적 content, 복수 tool call, usage가 손실되므로 최종 응답 보존 요구를 충족하지 못한다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 최종 API response 재사용성 | 높음 | 낮음 | 낮음 |
| API별 구현 복잡도 | 중간~높음 | 낮음 | 낮음 |
| tool call 보존 | ID 병합 | raw event 의존 | 손실 가능 |
| 계층 경계 | adapter에 국소화 | 공통 service 오염 | 단순하지만 부정확 |
| client streaming 호환성 | 원본 유지 | 원본 유지 | 원본 유지 |

## Recommendation
- **Option A — API별 adapter가 canonical final response를 생성**을 채택한다. 저장 SSOT가 최종 traffic response가 되어야 하며 API별 schema 차이는 이미 adapter 경계로 분리하기로 했기 때문이다.

## Consequences
- 표준 adapter interface에 stream aggregation lifecycle을 추가해야 한다.
- 정상 종료 시 최종 response 하나를 저장하고, 개별 `data` event 배열은 저장하지 않는다.
- stream이 정상 종료하기 전에 실패하면 adapter가 생성한 partial aggregate를 failed log에 저장할지 별도 규칙이 필요하다.
- adapter별 contract test에서 content, tool call, usage, finish metadata 병합을 검증해야 한다.

## Downstream Concerns
- [ ] **ADR candidate — Standard semantic adapter interface:** API별 request/response tool semantic과 SSE aggregation을 하나의 표준 interface로 어떻게 표현할지 결정해야 한다.
- [ ] **ADR candidate — Partial aggregate on failure:** 정상 종료 전 중단 시 partial aggregate 저장 형식과 상태를 결정해야 한다.
- [x] **covered — Client SSE delivery:** 원본 SSE bytes는 기존 streaming ADR에 따라 client에 투명 전달한다.
- [x] **out of scope — event-level persistence:** 개별 `data` event의 영구 저장은 하지 않는다.

## Related
- `spec/AC.md` — AC-002, AC-016, AC-024
- `adr/streaming-response-handling.md`
- `adr/turn-grouping-storage-lifecycle.md`

## Notes
- 2026-03-10: AC-024 review를 위해 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다. API별 adapter가 최종 response를 생성하고 개별 SSE data event는 영구 저장하지 않는다.
