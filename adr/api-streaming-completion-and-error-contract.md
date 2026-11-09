# API별 Streaming 종료와 오류 계약

## Concern
Chat Completions와 Claude Messages의 SSE event, 정상 종료 sentinel, upstream 오류, client disconnect를 어떻게 전달하고 완료·실패 로그로 판정할 것인가?

## Status
approved

## Context
- 기존 Responses proxy는 SSE를 전달하고 `response.completed` 또는 `data: [DONE]`를 정상 종료 기준으로 사용한다.
- Chat Completions는 일반적으로 `data: [DONE]` sentinel을 사용한다.
- Claude Messages streaming은 event type 기반으로 `message_stop`을 정상 종료 기준으로 사용한다.
- 이번 API contract 결정은 transparent pass-through이므로 event body를 변환하지 않는다.

## Decision
**Option A — API-specific completion detectors with transparent streaming.** API kind별 정상 종료 event/sentinel을 감지하고 모든 원본 SSE bytes는 그대로 client에 전달한다. Chat Completions는 `data: [DONE]`, Claude Messages는 `message_stop`, Responses는 기존 `response.completed` 또는 `[DONE]`를 정상 종료 기준으로 사용한다. Sentinel/event 이전 종료, upstream 오류, client disconnect는 `failed`로 기록하고 부분 결과를 보존한다.

## Options
### Option A — API-specific completion detectors with transparent streaming
- API kind별로 정상 종료 event/sentinel을 감지하고 모든 원본 SSE bytes는 그대로 client에 전달한다.
- Pro: 각 API의 정상 종료를 정확히 판정하면서 public streaming contract를 보존한다.
- Con: API별 detector와 테스트가 필요하다.

### Option B — Connection close only
- upstream connection이 닫히면 성공으로 간주하고 sentinel/event를 검사하지 않는다.
- Pro: 구현이 단순하다.
- Con: 중간 오류·불완전 stream을 completed로 기록할 위험이 크다.

### Option C — Canonical event conversion
- API별 event를 공통 내부 event로 변환하고 다시 public event로 출력한다.
- Pro: 중앙화된 lifecycle 처리.
- Con: transparent pass-through 결정과 충돌하고 event 손실·변환 오류가 발생할 수 있다.

## Tradeoffs
| | Option A — API-specific detectors | Option B — Connection close | Option C — Canonical conversion |
|---|---|---|---|
| Public event preservation | 높음 | 높음 | 낮음~중간 |
| 완료 판정 정확도 | 높음 | 낮음 | 중간~높음 |
| 구현 복잡도 | 중간 | 낮음 | 높음 |
| 기존 결정과 정합성 | 높음 | 중간 | 낮음 |

## Recommendation
- **Option A — API-specific completion detectors with transparent streaming**을 권장했으며, 사용자가 Option A를 선택했다.

## Consequences
- stream handler는 API kind를 받아 API별 completion detector를 사용한다.
- upstream status가 오류이거나 sentinel/event 전에 stream이 끝나거나 client가 disconnect하면 `failed`로 기록한다.
- 부분 결과는 bounded response content로 저장한다.
- 원본 SSE event와 chunk는 변환하지 않고 그대로 client에 전달한다.

## Downstream Concerns
- [x] **directly resolved — Event transformation:** AC-014 Option A에 따라 event를 변환하지 않는다.
- [x] **covered — Client disconnect:** 기존 AC-002와 streaming ADR에 따라 부분 결과를 보존하고 `failed`로 기록한다.
- [x] **directly resolved — Non-stream response:** HTTP status, content type, body를 가능한 한 pass-through한다.

## Related
- `spec/AC.md` — AC-002, AC-014, AC-016
- `adr/streaming-response-handling.md`

## Notes
- 2026-03-10: AC-016 검토를 위해 API별 completion detector, connection close, canonical event conversion을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("A ok")로 Option A를 승인했다.
