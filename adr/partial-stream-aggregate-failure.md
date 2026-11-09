# Partial stream aggregate on failure

## Concern
SSE stream이 정상 종료 event 전에 upstream 오류, client disconnect 또는 연결 중단으로 끝날 때 adapter가 만든 partial aggregate를 어떤 형식과 상태로 저장할 것인가?

## Status
approved

## Context
- client에는 원본 SSE bytes를 투명하게 전달한다.
- 정상 종료 시에는 개별 `data` event가 아니라 API별 최종 response JSON 하나를 저장한다.
- 정상 종료 전 중단에서도 debugging을 위해 이미 수신한 content/tool call/usage를 보존할 필요가 있다.
- 기존 traffic log는 `response_json`, `status`, `error`를 저장하며 `failed` 상태와 partial response를 지원한다.

## Decision
**Option A — Partial aggregate를 failed log에 저장.** 정상 종료 event 전에 stream이 중단되면 adapter가 중단 시점까지 누적한 API별 aggregate JSON을 `response_json`에 저장하고, traffic status는 `failed`로 기록한다. upstream/client disconnect 원인은 `error`에 저장하며 개별 SSE `data` event 배열은 저장하지 않는다.

## Options
### Option A — Partial aggregate를 failed log에 저장
- adapter가 중단 시점까지 누적한 API별 aggregate JSON을 `response_json`에 저장한다.
- traffic status는 `failed`로 기록하고 error에 upstream/client disconnect 원인을 저장한다.
- aggregate는 incomplete 상태를 나타내는 adapter 결과 또는 metadata를 포함한다.
- Pro: 디버깅에 필요한 실제 partial 결과를 보존하고 기존 log model과 맞는다.
- Con: final response가 아니므로 UI와 소비자가 status를 함께 확인해야 한다.

### Option B — 실패 시 response를 저장하지 않음
- `response_json`을 NULL로 두고 error와 metadata만 저장한다.
- Pro: 불완전한 응답을 최종 결과로 오해할 위험이 낮다.
- Con: 이미 수신한 tool call/content가 유실되어 장애 분석이 어려워진다.

### Option C — partial event 배열을 별도 저장
- 정상 종료 전에는 누적 event들을 별도 raw event 배열로 저장한다.
- Pro: 원본 stream 복구에 가장 가깝다.
- Con: 개별 event 영구 저장을 제외한 결정과 충돌하고 저장·조회 복잡도가 커진다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 장애 분석성 | 높음 | 낮음 | 높음 |
| final response 오해 위험 | status로 구분 | 낮음 | status로 구분 |
| 저장 모델 변경 | 최소 | 없음 | 큼 |
| event-level persistence 준수 | 준수 | 준수 | 위반 |
| UI 처리 | failed + partial 표시 | error 중심 | 별도 viewer 필요 |

## Recommendation
- **Option A — Partial aggregate를 failed log에 저장**을 채택한다. 기존 failed log의 partial response 정책과 일치하고, event-level persistence 없이도 이미 수신한 semantic 결과를 보존한다.

## Consequences
- 정상 종료 aggregate와 partial aggregate를 `status`로 구분한다.
- adapter interface는 정상 완료와 중단 결과를 모두 API response JSON 형태로 반환해야 한다.
- verification은 정상 종료, upstream failure, client disconnect에서 partial response·failed status·error를 확인해야 한다.
- 저장된 partial aggregate를 최종 완성 응답으로 간주하지 않도록 UI와 query contract가 status를 표시해야 한다.

## Downstream Concerns
- [x] **covered — Event-level persistence:** 개별 SSE data event는 저장하지 않고 aggregate만 저장한다.
- [x] **directly resolved — Retry/recovery:** 자동 재시도나 partial aggregate 보정은 이번 범위에 포함하지 않는다.
- [x] **out of scope — Stream replay:** 저장된 partial aggregate로 client stream을 재생하는 기능은 제공하지 않는다.

## Related
- `spec/AC.md` — AC-002, AC-016, AC-024
- `adr/standard-semantic-stream-adapter-interface.md`
- `adr/sse-final-response-aggregation.md`
- `adr/standard-semantic-stream-adapter-interface.md`

## Notes
- 2026-03-10: 표준 semantic·stream adapter interface ADR의 downstream concern으로 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다. 중단 시 partial aggregate를 failed log에 저장한다.
