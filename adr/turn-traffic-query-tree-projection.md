# Turn/traffic 조회 API와 tree projection

## Concern
Sidebar tree가 turn과 하위 traffic을 효율적으로 표시하도록 어떤 조회 API와 계층 projection을 제공할 것인가?

## Status
approved

## Context
- turn은 proxy가 traffic semantic 분석으로 계산하고, traffic은 기존 SQLite log의 상세 본문을 가진다.
- sidebar는 turn/traffic 계층을 표시하고 선택 항목의 내용을 메인 뷰에 전달해야 한다.
- 기존 flat traffic list/detail API와 UI 조회 구조가 존재한다.
- 기존 traffic schema/data migration은 하지 않는다.

## Decision
**Option A — Tree 전용 aggregate endpoint.** `GET /api/v1/turns`가 turn 단위로 pagination된 turn node와 child traffic summary를 반환한다. child는 sequence 순으로 정렬하며 request/response 본문은 포함하지 않는다. traffic 상세 본문은 기존 `GET /api/v1/logs/:id`를 선택 시 호출하고, turn 선택은 tree 응답의 summary와 child 관계를 사용한다.

## Options
### Option A — Tree 전용 aggregate endpoint
- `GET /api/v1/turns`가 turn node와 child traffic summary를 계층형으로 반환한다.
- traffic 상세는 기존 `GET /api/v1/logs/:id`를 사용한다.
- turn summary 선택 시 필요한 요약은 tree 응답에 포함한다.
- Pro: sidebar에 필요한 응답을 한 번에 제공하고 UI가 SQLite 구조를 알지 않는다.
- Con: turn query projection과 pagination 정책을 별도로 구현해야 한다.

### Option B — Flat traffic endpoint 확장 후 UI에서 tree 구성
- 기존 logs list에 turn ID, sequence, grouping 상태를 추가하고 UI가 turn별로 묶는다.
- Pro: API surface 증가가 적고 기존 query 재사용이 쉽다.
- Con: pagination 경계에서 child가 분리되고 UI가 grouping 규칙을 재구현해야 한다.

### Option C — Turn/traffic 모두 nested full detail 반환
- turn endpoint가 각 child traffic의 request/response 본문까지 모두 반환한다.
- Pro: 선택 시 추가 fetch가 적다.
- Con: sidebar 초기 payload가 커지고 민감한 본문 노출·성능 부담이 증가한다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| Tree 일관성 | 높음 | pagination에 따라 흔들림 | 높음 |
| UI 복잡도 | 낮음 | 높음 | 낮음 |
| 초기 payload | summary 중심 | traffic page 크기 | 큼 |
| 기존 API 재사용 | 상세 endpoint 재사용 | 높음 | 낮음 |
| 본문 과다 조회 위험 | 낮음 | 중간 | 높음 |

## Recommendation
- **Option A — Tree 전용 aggregate endpoint**를 채택한다. sidebar의 단위가 turn이므로 turn 경계가 pagination으로 깨지지 않으며, 상세 본문은 선택 시 기존 detail API로 지연 조회할 수 있다.

## Consequences
- turn 목록은 turn 단위로 pagination하고 child traffic은 sequence 순으로 summary를 반환한다.
- traffic 상세 본문은 기존 detail endpoint 또는 선택 전용 조회로 분리한다.
- turn 선택 시 tree 응답의 summary/child 관계를 사용하고 traffic 선택 시 traffic detail을 fetch한다.
- legacy traffic fallback node 정책은 AC-022에서 결정한다.

## Downstream Concerns
- [ ] **ADR candidate — Tree pagination and loading:** turn page size, child limit, lazy expansion/loading policy를 결정해야 한다.
- [x] **covered — Detail body fetch:** 기존 traffic detail query boundary를 유지한다.
- [x] **out of scope — Full-text search:** 이번 tree 기능에서는 제공하지 않는다.

## Related
- `spec/AC.md` — AC-020, AC-021, AC-022
- `adr/api-log-write-ui-read-boundary.md`
- `adr/turn-grouping-storage-lifecycle.md`

## Notes
- 2026-03-10: AC-020 review를 위해 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다. turn 전용 aggregate endpoint와 traffic detail 지연 조회를 사용한다.
