# Sidebar 선택 상태와 메인 뷰 계약

## Concern
Sidebar에서 turn 또는 traffic을 선택했을 때 선택 상태를 어떻게 유지·공유하고 메인 뷰에 어떤 내용을 표시할 것인가?

## Status
approved

## Context
- `/api/v1/turns`는 turn과 child traffic summary를 tree로 제공한다.
- traffic 상세는 기존 detail API로 지연 조회한다.
- legacy traffic은 synthetic `kind: "legacy"` turn으로 표시된다.
- 현재 UI는 traffic 목록과 상세를 page state로 전환하며 sidebar tree와 URL 선택 계약이 없다.

## Decision
**Option A — URL-addressable selection with split main views.** 선택 상태를 URL query/route로 표현하고 turn 선택과 traffic 선택을 구분한다. turn 선택 시 turn summary, 상태, traffic 개수/순서와 child 목록을 표시하고, traffic 선택 시 기존 `LogDetail`로 request/response/error/metadata를 조회한다. URL state로 새로고침과 browser back/forward를 지원한다.

## Options
### Option A — URL-addressable selection with split main views
- 선택 상태를 URL query/route로 표현한다: turn 선택과 traffic 선택을 구분한다.
- turn 선택 시 메인 뷰에 turn summary, 상태, traffic 개수/순서와 child 목록을 표시한다.
- traffic 선택 시 기존 LogDetail을 메인 뷰에 표시하고 request/response/error/metadata를 조회한다.
- Pro: 새로고침·뒤로가기·직접 링크가 가능하고 turn/traffic의 표시 목적이 명확하다.
- Con: route/state 동기화와 turn summary view가 추가된다.

### Option B — URL 없이 local React state만 사용
- sidebar click 결과를 page memory에만 저장한다.
- turn/traffic 선택 모두 메인 뷰를 교체하되 새로고침 시 초기화한다.
- Pro: 구현이 가장 단순하다.
- Con: 선택 내용을 공유·복원할 수 없고 브라우저 navigation과 맞지 않는다.

### Option C — 선택 시 항상 traffic detail로 확장
- turn 선택도 첫 child 또는 전체 traffic detail로 바로 확장한다.
- Pro: 별도 turn summary 화면이 필요 없다.
- Con: turn-level 관계와 진행 상태를 확인하기 어렵고 turn 선택 의미가 약해진다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 새로고침/직접 링크 | 높음 | 없음 | 중간 |
| 구현 복잡도 | 중간 | 낮음 | 낮음~중간 |
| turn 관계 가시성 | 높음 | 높음 | 낮음 |
| 기존 detail 재사용 | 높음 | 높음 | 높음 |
| UX 명확성 | 높음 | 중간 | 낮음 |

## Recommendation
- **Option A — URL-addressable selection with split main views**를 채택한다. 운영자가 특정 turn/traffic을 다시 열거나 공유할 수 있고, turn 선택과 traffic 선택의 서로 다른 정보 요구를 보존한다.

## Consequences
- UI route/state contract에 turn selection과 traffic selection을 구분하는 stable ID가 필요하다.
- turn summary view는 child traffic을 선택할 수 있어야 한다.
- traffic detail loading/error 상태와 turn summary empty/loading/error 상태를 정의해야 한다.
- 기존 flat list navigation은 compatibility를 위해 유지하거나 tree page 안에서 접근 가능하게 해야 한다.

## Downstream Concerns
- [x] **covered — Browser history:** URL state 변경을 사용해 browser back/forward를 지원한다.
- [x] **directly resolved — Selection IDs:** turn ID와 traffic ID를 각각 URL-safe stable identifier로 사용한다.
- [x] **out of scope — Multi-tab synchronization:** 여러 browser tab 간 선택 상태 동기화는 제공하지 않는다.

## Related
- `spec/AC.md` — AC-020, AC-021, AC-022
- `adr/turn-traffic-query-tree-projection.md`
- `adr/legacy-traffic-tree-compatibility.md`

## Notes
- 2026-03-10: AC-021 review를 위해 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 승인했다. URL-addressable selection과 turn/traffic 분리 메인 뷰를 사용한다.
