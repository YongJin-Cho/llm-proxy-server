# Turn·traffic 관리 메타데이터 저장과 삭제 의미

## Concern
사용자가 편집한 turn·traffic 제목과 flag 상태를 기존 traffic 본문·lifecycle 원본과 분리해 어떻게 저장하고, turn 삭제를 어떤 물리 삭제와 cascade 규칙으로 처리할 것인가?

## Status
approved

## Context
- 이번 UI는 turn과 traffic의 제목 편집 및 flag 설정·해제를 제공한다.
- traffic 단독 삭제는 제공하지 않는다. 삭제 단위는 turn이다.
- turn을 삭제하면 해당 turn에 속한 모든 traffic을 함께 삭제한다.
- 로그가 누적되므로 삭제는 저장 공간과 검색·관리 효율을 높이기 위한 실제 데이터 제거여야 한다.
- 논리 삭제, 복원, 삭제 이력·감사 로그는 이번 범위에 필요하지 않다.
- 기존 traffic request/response 본문과 lifecycle 원본을 제목·flag 같은 관리 메타데이터가 덮어써서는 안 된다.
- 현재 저장 모델은 `turns`와 `traffic_logs` 테이블이며, traffic은 `turn_id`로 turn에 연결된다.
- 기존 legacy traffic 표시와 flat traffic 조회 호환성을 유지해야 한다.

## Decision
**Option B — 기존 row의 관리 컬럼과 turn 단위 물리 삭제.** `turns`와 `traffic_logs`에 제목·flag 같은 관리 컬럼을 추가하되 request/response JSON과 lifecycle 원본 컬럼은 변경하지 않는다. turn 삭제는 하나의 transaction에서 해당 turn의 모든 child traffic과 turn row를 물리 삭제한다. traffic 단독 삭제, 논리 삭제, 복원, 삭제 이력은 제공하지 않는다.

## Options
### Option A — 별도 관리 metadata와 turn 단위 물리 삭제
- 제목·flag를 `turn_management` 및 필요 시 `traffic_management` 같은 별도 metadata 구조에 저장한다.
- turn 삭제는 하나의 transaction에서 관리 metadata와 해당 turn의 모든 traffic 및 turn row를 물리 삭제한다.
- traffic 단독 삭제 API와 UI는 제공하지 않는다.
- Pro: 원본 저장 row와 운영 metadata의 결합이 낮고 향후 관리 필드 확장이 쉽다.
- Con: 목록·상세·flag 필터에 metadata join이 필요하고 삭제 시 관련 metadata 정리가 추가된다.

### Option B — 기존 row의 관리 컬럼과 turn 단위 물리 삭제
- `turns`와 `traffic_logs`에 제목·flag 같은 관리 컬럼을 추가하되 request/response JSON과 lifecycle 원본 컬럼은 변경하지 않는다.
- turn 삭제는 하나의 transaction에서 해당 turn의 모든 traffic을 먼저 삭제하고 turn row를 물리 삭제한다. foreign key cascade 또는 명시적 cascade를 사용한다.
- traffic 단독 삭제 API와 UI는 제공하지 않는다.
- Pro: 현재 저장 구조와 직접 연결되어 조회·flag 필터·삭제 transaction이 단순하다.
- Con: schema 변경과 기존 row의 기본값 처리가 필요하고 관리 필드가 저장 row에 결합된다.

## Tradeoffs
| | Option A — 별도 metadata | Option B — 기존 row 관리 컬럼 |
|---|---|---|
| 원본 본문 보호 | 높음 | 높음; 본문 컬럼은 변경하지 않음 |
| 조회·필터 단순성 | 중간; join 필요 | 높음 |
| 물리 삭제 정합성 | metadata까지 함께 삭제 필요 | turn/traffic cascade로 단순화 가능 |
| schema 영향 | metadata table 추가 | 기존 table 컬럼 추가 |
| 향후 관리 필드 확장 | 높음 | 중간 |
| 검색·저장 공간 개선 | turn과 child traffic 물리 삭제 | turn과 child traffic 물리 삭제 |
| 복원 가능성 | 없음 | 없음 |

## Recommendation
- **Option B — 기존 row의 관리 컬럼과 turn 단위 물리 삭제**를 권장한다. 현재 `turns`와 `traffic_logs`가 이미 분리되어 있고 `turn_id` 관계가 있으므로, 원본 JSON을 보존하면서 조회·flag 필터·cascade 삭제를 가장 단순하게 구현할 수 있다.

## Consequences
- 제목·flag는 기존 row의 별도 관리 컬럼에 저장하며 request/response body와 lifecycle 원본은 수정하지 않는다.
- turn 삭제 API는 turn ID를 받아 해당 turn의 모든 child traffic과 turn row를 하나의 transaction에서 물리 삭제한다.
- traffic 단독 삭제 API, UI, 논리 삭제 상태, 복원 기능, 삭제 이력은 제공하지 않는다.
- 삭제 후 `/api/v1/turns`, 기존 logs list/detail, summary query에서는 해당 turn과 child traffic이 더 이상 조회되지 않는다.
- legacy traffic은 turn에 속하지 않으므로 turn 삭제 대상이 아니다. legacy traffic 삭제 요구는 이번 범위에 포함하지 않는다.
- foreign key cascade를 사용하거나 동일한 transaction에서 child traffic 삭제 후 turn 삭제를 보장해야 한다.

## Downstream Concerns
- [x] **directly resolved — Delete unit:** turn만 삭제 단위로 제공하고 traffic 단독 삭제는 제공하지 않는다.
- [x] **directly resolved — Delete semantics:** turn 삭제는 child traffic을 포함한 물리 삭제이며 논리 삭제·복원은 제공하지 않는다.
- [x] **directly resolved — Legacy traffic:** turn에 연결되지 않은 legacy traffic은 이번 turn 삭제의 대상이 아니다.
- [x] **covered — Source body preservation:** 제목·flag 컬럼을 request/response 본문과 분리해 원본을 보존한다.
- [x] **out of scope — Audit history:** 삭제 이력과 복원용 tombstone은 이번 범위에 포함하지 않는다.

## Related
- `spec/AC.md` — AC-025
- `adr/turn-traffic-query-tree-projection.md`
- `adr/legacy-traffic-tree-compatibility.md`
- `adr/api-log-write-ui-read-boundary.md`

## Notes
- 2026-03-10: AC-025 review를 위해 세 가지 저장·삭제 전략을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 입력에 따라 traffic 단독 삭제를 제거하고 turn 단위 물리 삭제·child traffic cascade·논리 삭제/복원 제외로 삭제 의미를 수정했다.
- 2026-03-10: 사용자 go-ahead("B로 해줘")로 Option B를 승인하고 Status를 approved로 변경했다. 기존 row에 관리 컬럼을 추가하고 원본 본문은 보존한다.
