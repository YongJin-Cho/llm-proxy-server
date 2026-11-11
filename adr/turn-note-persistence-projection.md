# Turn Note Persistence와 Query Projection

## Concern
`TurnNote[]`와 분석 상태를 기존 turn/traffic 원본과 어떻게 분리해 저장하고, turn 조회 API에서 어떻게 함께 반환할 것인가?

## Status
approved

## Context
- AC-029에서 외부 note contract는 turn별 `{ title, content }` Markdown note 배열로 결정되었다.
- AC-030에서 note 분석은 `TurnAnalysisService`와 API별 `TurnAnalysisAdapter`가 담당하고, persistence는 ports로 분리하기로 했다.
- AC-031에서 note analysis는 completion 후 비동기로 실행되며 `pending`, `ready`, `empty`, `failed` 상태와 `turn_id + analysis_version` idempotency key를 사용한다.
- 기존 turn/traffic request·response와 lifecycle 원본을 덮어쓰지 않고, 기존 `GET /api/v1/turns` tree projection 및 turn detail 조회와 회귀 없이 note를 제공해야 한다.

## Decision
**Option B — turn당 하나의 별도 `turn_notes` projection row**를 채택한다. 기존 turn/traffic 원본은 변경하지 않고, `turn_notes`에 `turn_id`, `analysis_version`, status, `notes_json`, error/retry metadata를 저장한다. turn query service는 기존 turn aggregate와 note projection을 조합해 반환하며 note 결과는 동일 logical result에 대해 원자적으로 upsert한다.

## Options
### Option A — `turns` row에 note JSON과 상태 column 추가
- 기존 turn table에 `analysis_status`, `analysis_version`, `notes_json`, error/retry metadata를 추가한다.
- Pro: turn 조회가 단순하고 한 row read로 note를 가져올 수 있다.
- Con: turn 원본 lifecycle과 파생 분석 projection이 같은 row에 결합되고, schema 변경·payload 크기·version 교체가 turn 모델에 직접 영향을 준다.

### Option B — turn당 하나의 별도 `turn_notes` projection row
- `turn_notes` table에 `turn_id` unique key, analysis version, status, notes JSON, error/retry metadata를 저장한다.
- turn row와 traffic row는 변경하지 않으며, query service가 turn aggregate와 note projection을 조합한다.
- Pro: 원본과 파생 projection을 분리하면서 사용자의 `TurnNote[]` 모델과 잘 맞고, 동일 turn의 결과를 원자적으로 교체하기 쉽다.
- Con: turn query가 note projection을 join/read해야 하고 별도 schema가 필요하다.

### Option C — note마다 별도 relational row
- `turn_notes`에 note 하나당 row를 저장하고 title/content를 각각 column으로 둔다. 상태와 analysis version은 별도 job/turn metadata에 둔다.
- Pro: note별 검색·정렬·부분 갱신이 쉽다.
- Con: 이번 범위에 불필요한 relational complexity가 생기고 note 배열의 원자적 결과 교체와 상태 일관성이 복잡해진다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 원본 lifecycle과 분리 | 낮음 | 높음 | 높음 |
| `TurnNote[]` 저장 적합성 | 높음 | 높음 | 중간 |
| 결과 원자적 교체 | 높음 | 높음 | 낮음 |
| query projection 복잡도 | 낮음 | 중간 | 중간 |
| note별 검색/부분 갱신 | 낮음 | 낮음 | 높음 |
| schema 결합·변경 위험 | 높음 | 낮음 | 중간 |

## Recommendation
- **Option B — turn당 하나의 별도 `turn_notes` projection row**를 권장한다.
- row에는 최소 `turn_id`, `analysis_version`, `status`, `notes_json`, `error_code`, `error_message`, `attempt_count`, `updated_at`을 두고, `turn_id`와 `analysis_version`을 idempotency uniqueness 기준으로 사용한다.
- query service는 기존 turn tree/summary projection에 note status와 notes를 추가하되, note 조회 실패가 turn/traffic 조회 전체 실패로 전파되지 않도록 한다.

## Consequences
- turn/traffic 원본 schema와 request/response/lifecycle data는 변경하지 않는다.
- note projection은 `pending` row를 먼저 만들고 분석 완료 시 같은 logical result를 upsert한다.
- 현재는 note 전체 배열을 JSON으로 저장하며 note별 검색·편집·댓글은 제공하지 않는다.
- API 응답은 기존 turn fields를 보존하고 note projection을 optional nested object로 추가한다.

## Downstream Concerns
- [ ] **ADR candidate — Query join failure behavior:** note row 누락·손상·reader 오류를 `empty`, `unavailable`, `failed` 중 어떻게 반환할지
- [ ] **ADR candidate — Note JSON validation/version migration:** notes JSON schema invalid 시 복구와 analysis version migration을 어떻게 처리할지
- [x] **directly resolved — Note ordering:** adapter가 생성한 배열 순서를 저장·반환 순서로 보존한다. 별도 note pagination은 없다.
- [x] **out of scope — Note-level search/edit:** 이번 범위는 표시용 파생 note projection이며 검색·편집·댓글은 포함하지 않는다.

## Related
- `spec/AC.md` — AC-032
- `adr/turn-note-semantic-contract.md` — approved
- `adr/turn-note-adapter-boundary.md` — approved
- `adr/turn-note-analysis-lifecycle.md` — approved

## Notes
- 2026-03-10: AC-032 review를 위해 turn row 확장, turn당 별도 projection row, note별 relational row 대안을 작성하고 Option B를 권장했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option B를 승인했다.
