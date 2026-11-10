# Turn·traffic 관리 메타데이터 저장과 삭제 의미

## Concern
사용자가 편집한 turn·traffic 제목, flag 상태, 삭제 상태를 어떻게 영구 저장하고 turn 또는 개별 traffic 삭제를 어떤 의미로 처리할 것인가?

## Status
proposed

## Context
- 이번 UI는 turn과 traffic의 제목 편집, flag 설정·해제, 선택 삭제를 제공한다.
- 기존 traffic 본문과 lifecycle 원본은 분석·회귀 검증의 근거이므로 관리 메타데이터가 이를 임의로 덮어써서는 안 된다.
- turn은 여러 traffic의 projection이며, legacy traffic도 synthetic turn으로 조회될 수 있다.
- 기존 SQLite writer/reader 경계와 non-migration 호환 정책을 유지해야 한다.

## Decision

## Options
### Option A — 별도 관리 메타데이터와 논리 삭제
- turn·traffic 관리 필드를 별도 metadata 구조로 저장하고 원본 traffic row는 보존한다.
- 제목·flag는 upsert하고 삭제는 `deleted_at` 또는 동등한 tombstone으로 표시한다.
- Pro: 원본 보존, 복구·감사 가능성, turn projection과의 분리가 높다.
- Con: query가 metadata join과 삭제 필터를 일관되게 적용해야 한다.

### Option B — 기존 turn·traffic row에 관리 컬럼 추가와 논리 삭제
- 기존 저장 모델에 title, flagged, deleted 같은 컬럼을 추가한다.
- 삭제는 row를 물리 삭제하지 않고 삭제 상태로 표시한다.
- Pro: 조회와 업데이트가 단순하고 transaction 경계가 명확하다.
- Con: 원본과 운영 메타데이터의 schema 결합이 커지고 legacy/non-migration 처리에 schema 변경이 필요하다.

### Option C — 관리 필드 직접 변경과 물리 삭제
- 기존 row의 title·flag를 직접 수정하고 삭제 시 turn/traffic row를 실제로 제거한다.
- Pro: 구현과 조회가 가장 단순하고 삭제 후 저장 공간을 즉시 회수한다.
- Con: 원본 보존·복구·감사·turn 관계 추적이 불가능하며 accidental delete 비용이 크다.

## Tradeoffs
| | Option A — 별도 metadata + 논리 삭제 | Option B — 기존 row 컬럼 + 논리 삭제 | Option C — 직접 변경 + 물리 삭제 |
|---|---|---|---|
| 원본 traffic 보존 | 높음 | 중간 | 낮음 |
| query 구현 단순성 | 중간 | 높음 | 높음 |
| 기존 schema 영향 | 낮음~중간 | 높음 | 중간 |
| 복구·감사 가능성 | 높음 | 중간 | 낮음 |
| turn/legacy projection 호환 | 높음 | 중간 | 낮음 |
| 저장 공간 회수 | 낮음 | 낮음 | 높음 |

## Recommendation
- **Option A — 별도 관리 메타데이터와 논리 삭제**를 권장한다. 관리 기능이 분석 원본을 훼손하지 않아야 하고, turn projection 및 legacy fallback을 유지하면서 향후 복구·감사 가능성을 남길 수 있다.

## Consequences
- 제목·flag·삭제 상태는 기존 request/response body와 lifecycle 원본과 분리된 관리 metadata로 저장한다.
- turn 삭제는 해당 turn의 관리 표시를 삭제 상태로 만들고 child traffic 원본은 보존하는 의미로 정의한다. 개별 traffic 삭제가 필요하면 해당 traffic만 삭제 상태로 표시하되 turn projection은 남은 child와 상태 규칙을 사용한다.
- `/api/v1/turns`, 기존 logs list/detail, summary query는 삭제 상태를 일관되게 제외하거나 명시적으로 표시해야 한다.
- 물리 삭제와 자동 복구 UI는 이번 범위에서 제공하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Deleted turn projection:** 삭제된 turn을 sidebar와 direct URL에서 완전히 숨길지, 삭제 상태로 표시할지 결정해야 한다.
- [x] **covered — Secret handling:** 관리 metadata도 기존 redaction·access boundary를 따른다.
- [x] **out of scope — Audit history:** 제목·flag 변경 이력의 버전별 감사 로그는 이번 범위에 포함하지 않는다.

## Related
- `spec/AC.md` — AC-025
- `adr/turn-traffic-query-tree-projection.md`
- `adr/legacy-traffic-tree-compatibility.md`
- `adr/api-log-write-ui-read-boundary.md`

## Notes
- 2026-03-10: AC-025 review를 위해 세 가지 저장·삭제 전략을 비교하는 proposed ADR을 작성했다.
