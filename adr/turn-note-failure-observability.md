# Turn Note 실패 관찰성과 완료 독립성

## Concern
note 분석의 pending·empty·failed·unavailable 상태와 재시도 가능성을 어떻게 관찰하고, 분석 실패가 completed turn과 traffic 저장에 영향을 주지 않도록 할 것인가?

## Status
approved

## Context
- AC-031에서 note 분석은 turn completion 후 비동기 job으로 실행되며 상태는 기본적으로 `pending`, `ready`, `empty`, `failed`를 사용한다.
- AC-032에서 상태와 `TurnNote[]`는 별도 `turn_notes` projection row에 저장한다.
- 운영자는 note가 아직 처리되지 않은 것인지, 도구 사용이 없었던 것인지, 분석에 실패한 것인지 구분할 수 있어야 한다.
- completed turn의 lifecycle과 traffic 원본은 note 분석 오류로 실패 상태가 되면 안 된다.

## Decision
**Option A — 네 가지 canonical status와 실패 상세 metadata**를 채택한다. note status는 `pending`, `ready`, `empty`, `failed`로 관리한다. `failed`에는 `retryable`, `error_code`, 안전한 bounded `error_message`, `attempt_count`, `updated_at`을 포함하며, projection/원본 조회 불능은 `error_code: note_unavailable`로 표현한다. 이 status는 completed turn lifecycle과 독립적이다.

## Options
### Option A — 네 가지 분석 상태 + 실패 상세
- `pending`, `ready`, `empty`, `failed`를 persistence/API의 canonical status로 사용한다.
- `failed`일 때 `retryable`, `error_code`, 안전한 `error_message`, `attempt_count`, `updated_at`을 함께 반환한다.
- 분석 결과를 읽을 수 없거나 projection이 손상된 경우도 `failed` 또는 `unavailable` detail로 표현한다.
- Pro: 상태 수가 작고 AC-031과 일치하며 retry 가능성을 명시할 수 있다.
- Con: 일시적 분석 실패와 projection 자체의 조회 불능을 한 status 계열에서 해석해야 한다.

### Option B — `unavailable`을 canonical 상태로 분리
- `pending`, `ready`, `empty`, `failed`, `unavailable`을 별도 상태로 저장·반환한다.
- `failed`는 분석 job이 실행됐지만 오류가 난 경우, `unavailable`은 note projection이나 필요한 원본을 읽을 수 없는 경우로 한정한다.
- Pro: 분석 실패와 데이터 조회 불능을 운영자와 UI가 명확히 구분한다.
- Con: 상태 전이와 API/UI 분기가 늘고, unavailable의 복구·재시도 의미를 별도로 정의해야 한다.

### Option C — 분석 상태와 availability를 별도 축으로 분리
- `analysis_status`는 `pending`, `ready`, `empty`, `failed`를 유지하고, `availability` 또는 `read_error`를 별도 field로 둔다.
- Pro: job 결과와 projection 조회 문제를 독립적으로 표현한다.
- Con: 두 축 조합이 늘어나고 UI가 모든 조합을 처리해야 한다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| API contract 단순성 | 높음 | 중간 | 낮음 |
| 분석 오류와 조회 불능 구분 | 중간 | 높음 | 매우 높음 |
| UI 상태 처리 복잡도 | 낮음 | 중간 | 높음 |
| retry 표현 | detail field | 상태별 정의 필요 | 별도 축으로 명확 |
| AC-031과의 정합성 | 높음 | 중간 | 중간 |

## Recommendation
- **Option A — 네 가지 canonical status와 실패 상세 metadata**를 권장한다.
- 이번 범위에서는 `unavailable`을 별도 canonical 상태로 추가하지 않고, projection/원본 조회 불능은 `failed`와 `error_code: note_unavailable` detail로 표현한다.
- 모든 오류 메시지는 secret과 원본 민감 payload를 포함하지 않는 bounded safe message여야 한다.

## Consequences
- turn API는 completed turn 상태와 독립적으로 note projection status를 반환한다.
- `empty`는 분석 성공 후 tool interaction이 없어 notes가 빈 배열인 정상 결과다.
- `failed`는 `retryable`과 error metadata로 재처리 가능성을 나타낸다.
- note query/read 오류가 발생해도 turn summary와 traffic tree는 가능한 범위에서 계속 반환한다.
- UI는 `failed`의 detail에 따라 분석 실패와 unavailable 상황을 사용자에게 구분해 표시할 수 있다.

## Downstream Concerns
- [ ] **ADR candidate — Safe error taxonomy:** retryable/permanent 오류 code와 사용자 표시 message 목록
- [x] **covered — Turn completion independence:** note status는 turn lifecycle status와 별도 projection field로 관리한다. AC-031·AC-032에 근거한다.
- [x] **directly resolved — Secret redaction:** error code/message는 기존 redaction·bounded error policy를 따른다.

## Related
- `spec/AC.md` — AC-033
- `adr/turn-note-analysis-lifecycle.md` — approved
- `adr/turn-note-persistence-projection.md` — approved

## Notes
- 2026-03-10: AC-033 review를 위해 네 상태, unavailable 분리, 상태·availability 이중 축 대안을 작성하고 Option A를 권장했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다.
