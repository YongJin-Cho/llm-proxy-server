# Token Usage와 Cost Metadata

## Concern
Responses, Chat Completions, Claude Messages의 서로 다른 usage 응답에서 token usage와 dollar cost를 어떻게 추출·정규화·저장할 것인가?

## Status
approved

## Context
- 사용자는 `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`, `cost ($)`를 응답에서 추출해 별도 저장하기를 원한다.
- API별 usage 필드명과 위치가 다를 수 있다.
- `total_tokens`는 요청에 따라 `input_tokens + output_tokens`로 계산한다.
- cached input tokens는 input tokens의 하위 분류일 수 있으므로 total 계산에 별도 가산하지 않는다.
- provider가 cost를 직접 응답하지 않을 수 있으며, proxy가 모델별 요금표를 관리하면 가격 변경·provider별 할인·통화 기준을 책임져야 한다.

## Decision
**Option A — Provider-reported cost only.** Token usage는 API별 응답에서 정규화하되, `cost_usd`는 provider가 명시한 USD 비용만 저장하고 비용이 없거나 통화가 불명확하면 `NULL`로 둔다. Proxy-owned pricing table은 도입하지 않는다.

## Options
### Option A — Provider-reported cost only
- provider 응답에 명시적인 cost가 있을 때만 저장하고, 없으면 `NULL`로 둔다.
- Pro: proxy가 임의의 가격을 계산하지 않아 비용값의 출처가 명확하다.
- Con: 많은 API에서 cost가 없어 운영자가 비용을 볼 수 없는 경우가 많다.

### Option B — Proxy-owned model pricing table
- provider/model별 input·cached input·output 단가를 config 또는 DB에 관리하고 usage로 cost를 계산한다.
- Pro: provider가 cost를 주지 않아도 비용을 제공할 수 있다.
- Con: 가격표 유지, 단위·통화·할인·버전 관리가 필요하고 잘못된 가격은 오해를 만든다.

### Option C — Store provider cost and optionally estimate
- provider가 제공한 cost는 `cost_usd`로 저장하고, 없을 때 proxy 추정값을 별도 `estimated_cost_usd`로 저장한다.
- Pro: 실제값과 추정값을 구분하면서 coverage를 높인다.
- Con: schema와 UI가 복잡해지고 provider cost의 의미가 API마다 다를 수 있다.

## Tradeoffs
| | Option A — Provider cost only | Option B — Proxy pricing | Option C — Actual + estimate |
|---|---|---|---|
| 값의 출처 명확성 | 높음 | 중간 | 높음 |
| Cost coverage | 낮음 | 높음 | 중간~높음 |
| 운영·설정 부담 | 낮음 | 높음 | 높음 |
| 잘못된 비용 표시 위험 | 낮음 | 높음 | 중간 |
| 구현 범위 | 낮음 | 높음 | 중간~높음 |

## Recommendation
- 초기 구현에는 **Option A — Provider-reported cost only**를 권장한다.
- token usage는 API별 usage 필드에서 정규화하고, cost는 provider가 명시적으로 제공한 USD 값만 저장한다. provider가 cost를 제공하지 않으면 `NULL`로 두어 추정값을 실제 비용처럼 표시하지 않는다.

## Consequences
- 별도 column에 `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`, `cost_usd`를 저장한다.
- `total_tokens`는 항상 `input_tokens + output_tokens`로 계산한다. 누락된 token 값은 `NULL`로 처리하며, 충분한 값이 있을 때만 계산한다.
- usage가 응답 body에 없거나 streaming 마지막 event에만 있으면 해당 시점에서 추출한다.
- provider가 cost를 제공하지 않으면 `cost_usd = NULL`이다.
- cost가 provider 응답의 어떤 필드에서 왔는지는 raw response JSON과 함께 추적할 수 있어야 한다.

## Downstream Concerns
- [x] **directly resolved — Pricing table:** 이번 범위에서는 proxy-owned pricing table을 도입하지 않는다.
- [x] **directly resolved — Currency:** 저장 cost는 provider가 USD로 명시한 값만 `cost_usd`에 저장한다. 통화가 불명확하면 `NULL`이다.
- [x] **covered — Secret and body policy:** usage와 cost도 기존 redaction·body size limit 정책을 따른다.
- [x] **deferred assumption — API-specific usage field map:** 각 API의 공식 응답 계약에 따라 구현 Spec과 implementation task에서 field map을 확정한다. provider 계약이 불명확해 별도 설계 trade-off가 생길 때만 ADR을 추가한다.

## Related
- `spec/AC.md` — AC-017, AC-018
- `spec/llm-proxy-server.md` — R-006, R-009
- `adr/traffic-log-api-metadata.md`

## Notes
- 2026-03-10: 사용자 요구로 token usage와 cost metadata를 별도 저장하는 AC-018을 추가하고 세 가지 cost source 전략을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("A로해줘")로 Status → approved; Option A를 선택하고 provider-reported USD cost only 및 미제공·불명확 통화 시 `NULL` 정책을 확정했다.
