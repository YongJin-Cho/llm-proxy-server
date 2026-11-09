# Non-migration legacy traffic 호환 표시

## Concern
기존 schema/data를 migration하지 않고 turn metadata가 없는 traffic을 turn tree와 기존 조회 화면에서 어떻게 표현할 것인가?

## Status
approved

## Context
- 기존 traffic row에는 turn grouping metadata가 없다.
- 사용자는 기존 traffic migration을 원하지 않는다.
- 새 sidebar는 turn/traffic tree를 제공하지만 legacy traffic도 조회 불능이나 유실이 되면 안 된다.
- 기존 flat traffic list/detail API는 유지해야 한다.

## Decision
**Option A — Legacy traffic을 synthetic single-traffic turn으로 표시.** turn metadata가 없는 각 traffic을 `kind: "legacy"`인 synthetic turn node로 `/api/v1/turns`에 표시하고, child traffic 하나를 연결한다. 이는 실제 grouping 결과가 아님을 명시하며, 기존 flat logs list/detail API도 유지한다. 기존 traffic 간의 과거 turn 관계는 추론하지 않는다.

## Options
### Option A — Legacy traffic을 synthetic single-traffic turn으로 표시
- turn metadata가 없는 각 traffic을 하나의 synthetic turn node로 표시한다.
- synthetic turn은 실제 grouping이 아니라 `legacy` 유형임을 응답에 표시한다.
- child는 해당 traffic 하나이며 기존 detail API로 조회한다.
- Pro: tree 구조가 항상 turn → traffic으로 일관되고 legacy row가 누락되지 않는다.
- Con: 실제로 같은 사용자 turn이었을 가능성을 복원하지 못한다.

### Option B — Legacy traffic을 tree 최상위 traffic node로 표시
- turn metadata가 없는 traffic은 turn 계층 밖의 ungrouped root node로 표시한다.
- Pro: synthetic turn이라는 오해가 없다.
- Con: sidebar가 turn과 traffic의 두 종류 root를 처리해야 하고 tree 구조가 복잡해진다.

### Option C — Legacy traffic을 tree에서 제외하고 기존 flat 화면에서만 제공
- `/turns`에는 새 turn metadata가 있는 traffic만 포함한다.
- legacy row는 기존 logs endpoint에서만 조회한다.
- Pro: 새 tree projection이 단순하다.
- Con: 새 sidebar에서 전체 traffic을 탐색할 수 없고 사용자 기대와 기존 조회 일관성이 떨어진다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| tree 구조 일관성 | 높음 | 중간 | 낮음 |
| legacy 의미 정확성 | synthetic임을 표시 | 높음 | 높음 |
| 구현 복잡도 | 낮음 | 중간 | 낮음 |
| 전체 traffic 탐색성 | 높음 | 높음 | 낮음 |
| 오해 가능성 | type 표시로 완화 | 낮음 | 낮음 |

## Recommendation
- **Option A — Legacy traffic을 synthetic single-traffic turn으로 표시**를 채택한다. tree의 기본 단위를 turn으로 유지하면서 legacy row의 누락을 막고, `legacy` type으로 실제 grouping 결과가 아님을 명확히 표시할 수 있다.

## Consequences
- `/turns` 응답은 `kind: "turn" | "legacy"`와 같은 node type을 제공해야 한다.
- legacy synthetic turn에는 child traffic 하나와 legacy 표시 label을 제공한다.
- 기존 flat logs list/detail API는 계속 지원한다.
- legacy traffic 간의 turn 관계를 추론하거나 재구성하지 않는다.

## Downstream Concerns
- [x] **covered — Migration:** 기존 schema/data를 migration하지 않는다.
- [x] **directly resolved — Legacy ordering:** legacy node는 traffic의 기존 `started_at DESC` 목록 순서를 따른다.
- [x] **out of scope — Retroactive grouping:** 기존 traffic의 과거 turn 관계를 추론하지 않는다.

## Related
- `spec/AC.md` — AC-020, AC-022
- `adr/turn-traffic-query-tree-projection.md`

## Notes
- 2026-03-10: AC-022 review를 위해 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다. migration 없이 legacy traffic을 synthetic single-traffic turn으로 표시한다.
