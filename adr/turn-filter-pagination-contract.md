# Turn 전체·flagged 필터와 pagination 계약

## Concern
전체·flagged sidebar 필터를 서버 query와 UI 중 어디에서 책임지고, flag 변경·turn 물리 삭제 및 pagination 경계에서 어떤 조회 계약을 제공할 것인가?

## Status
approved

## Context
- sidebar의 목록 단위는 turn이며, legacy traffic은 synthetic single-traffic turn으로 표시된다.
- 로그 데이터는 page 단위로 조회되므로 UI가 현재 page의 일부만 필터링하면 전체 결과를 누락할 수 있다.
- AC-025에서 제목·flag를 기존 `turns`/`traffic_logs` row의 관리 컬럼에 저장하고 turn 삭제 시 child traffic을 물리 삭제하기로 결정했다.
- flag 변경이나 turn 삭제 직후 목록·pagination이 stale 상태로 남으면 운영자가 결과를 잘못 해석할 수 있다.
- 기존 `GET /api/v1/turns` tree aggregate endpoint와 turn 단위 pagination을 유지해야 한다.

## Decision
**Option A — 서버 query 필터와 turn 단위 pagination.** `GET /api/v1/turns`가 전체와 flagged 필터를 서버에서 적용하고, 필터 적용 후의 top-level turn node를 기준으로 pagination·total·has_next를 계산한다. child traffic은 parent turn 내부에 반환한다. flag 변경 또는 turn 삭제 성공 후 UI는 현재 query를 재조회하고, 현재 page가 비면 마지막 유효 page로 보정한다.

## Options
### Option A — 서버 query 필터와 turn 단위 pagination
- `GET /api/v1/turns`가 `filter=all|flagged` 같은 명시적 필터를 받고 서버가 turn row 및 legacy traffic을 필터링한다.
- pagination은 필터 적용 후의 top-level turn node에만 적용하며 child traffic은 turn 내부에서 반환한다.
- flag 변경·삭제 성공 후 UI는 현재 page를 재조회하고, page가 비면 이전 유효 page로 이동한다.
- Pro: 전체 결과가 누락되지 않고 page total·has_next가 필터 결과와 일치한다.
- Con: filter query와 turn/legacy flag projection을 서버에서 구현해야 한다.

### Option B — 전체 page 조회 후 UI 필터
- 서버는 기존 전체 turn page만 반환하고 UI가 현재 page의 turn을 flag 기준으로 제거한다.
- page 이동과 total은 전체 목록 기준으로 유지한다.
- Pro: API 변경과 서버 query 변경이 작다.
- Con: flagged 결과가 page 경계에서 누락되고 전체 flagged 탐색을 보장할 수 없다.

### Option C — 별도 flagged 목록 endpoint와 client-side 전체 merge
- 일반 목록과 flagged 목록을 별도 endpoint로 제공하고 UI가 필요한 목록을 선택한다.
- Pro: 각 query를 독립적으로 최적화할 수 있다.
- Con: 중복 API 계약과 pagination 상태가 생기며 두 목록의 정렬·삭제 일관성을 관리해야 한다.

## Tradeoffs
| | Option A — 서버 필터 | Option B — UI 필터 | Option C — 별도 endpoint |
|---|---|---|---|
| 전체 flagged 결과 정확성 | 높음 | 낮음 | 높음 |
| API 계약 단순성 | 중간 | 높음 | 낮음 |
| pagination 일관성 | 높음 | 낮음 | 중간 |
| flag 변경·삭제 반영 | 재조회로 명확 | page 내부에 한정 | endpoint별 재조회 필요 |
| 구현 중복 | 낮음 | 낮음 | 높음 |

## Recommendation
- **Option A — 서버 query 필터와 turn 단위 pagination**을 권장한다. sidebar 목록의 실제 결과 집합을 서버가 구성해야 flagged turn이 page 경계에서 사라지지 않으며, 기존 tree endpoint의 turn 단위 pagination과도 자연스럽게 결합된다.

## Consequences
- `GET /api/v1/turns`는 전체와 flagged 필터를 명시적으로 구분하고, 응답의 `total`, `page`, `limit`, `has_next`는 필터 적용 후 top-level turn 집합을 기준으로 계산한다.
- child traffic은 parent turn과 함께 반환하며 child 자체를 별도 pagination하지 않는다.
- flag 변경 또는 turn 삭제 성공 후 UI는 현재 필터·정렬·page를 재조회한다. 현재 page가 비면 마지막 유효 page로 보정한다.
- traffic 단독 삭제는 없으므로 traffic 삭제에 따른 pagination 규칙은 만들지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Filter query shape:** filter 값과 기본값, 잘못된 filter 처리 방식을 API contract에서 확정해야 한다.
- [x] **directly resolved — Page unit:** top-level turn node 단위로 pagination하고 child traffic은 parent 응답에 포함한다.
- [x] **directly resolved — Mutation refresh:** flag 변경·turn 삭제 후 현재 query를 재조회하고 빈 page는 마지막 유효 page로 보정한다.
- [x] **covered — Delete behavior:** AC-025의 turn 물리 삭제와 traffic 단독 삭제 미지원 정책을 따른다.

## Related
- `spec/AC.md` — AC-026
- `adr/turn-management-metadata-and-deletion.md`
- `adr/turn-traffic-query-tree-projection.md`
- `adr/legacy-traffic-tree-compatibility.md`

## Notes
- 2026-03-10: AC-026 review를 위해 서버 필터·UI 필터·별도 endpoint 선택지를 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인하고 Status를 approved 처리했다. filter query shape은 별도 downstream ADR 후보로 남겼다.
