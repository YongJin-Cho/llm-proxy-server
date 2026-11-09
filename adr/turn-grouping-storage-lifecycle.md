# Turn grouping metadata와 저장 lifecycle

## Concern
하나의 사용자 요청에서 발생한 여러 LLM traffic을 어떤 turn metadata와 저장 lifecycle로 그룹핑할 것인가?

## Status
proposed

## Context
- 한 번의 사용자 요청은 LLM 응답에 tool call이 포함될 때 여러 provider traffic으로 이어질 수 있다.
- harness는 각 tool call을 처리한 뒤 tool message를 포함한 후속 요청을 LLM에 전달한다.
- 현재 저장 모델은 traffic 단위이며, turn과 traffic 사이의 부모 관계를 표현하지 않는다.
- 기존 traffic schema/data migration은 이번 범위에서 제외한다.

## Decision

## Options
### Option A — Harness-owned turn ID를 각 traffic에 기록
- harness가 사용자 요청 시작 시 turn ID를 생성하고 모든 후속 traffic에 전달한다.
- traffic row에 turn ID와 turn 내 순서를 기록하고, turn summary는 traffic에서 조회 시 계산한다.
- Pro: 실제 그룹 경계를 결정하는 harness와 책임이 일치하고, 별도 turn 상태 저장이 적다.
- Con: harness와 proxy 사이의 metadata 전달 계약이 필요하며, 누락 시 fallback이 필요하다.

### Option B — Proxy가 요청 흐름을 추론해 turn을 생성
- proxy가 시간 간격, 요청 내용, tool call 여부 등을 이용해 연속 traffic을 turn으로 묶는다.
- Pro: harness 변경과 metadata 전달이 필요 없다.
- Con: 요청 경계를 정확히 알 수 없고 동시 요청 오그룹핑·재현성 문제가 크다.

### Option C — 명시적 turns와 traffic을 별도 aggregate로 저장
- turn 시작/완료 이벤트 또는 API를 받아 turns row를 만들고 traffic은 turn foreign key를 가진다.
- Pro: turn lifecycle과 summary를 명시적으로 저장하고 조회하기 쉽다.
- Con: proxy/harness 간 turn lifecycle 계약과 orphan/incomplete 상태 관리가 추가된다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 그룹 경계 정확성 | 높음 | 낮음 | 높음 |
| harness 연동 비용 | metadata 전달 필요 | 없음 | lifecycle 계약 필요 |
| 동시 요청 안전성 | 높음 | 낮음 | 높음 |
| 저장 모델 복잡도 | 낮음~중간 | 낮음 | 높음 |
| lifecycle 표현력 | traffic 기반 계산 | 추론 기반 | 명시적 저장 |

## Recommendation
- **Option A — Harness-owned turn ID를 각 traffic에 기록**을 권장한다. 실제 turn 경계를 알고 있는 harness가 ID를 생성하고, proxy는 전달받은 식별자와 순서를 보존하는 역할에 집중하는 것이 가장 정확하면서 현재 traffic 중심 저장 구조와도 잘 맞는다.

## Consequences
- proxy 입력 경계에서 turn ID와 traffic sequence metadata를 받는 계약이 필요하다.
- turn summary와 완료 상태는 traffic metadata에서 계산하거나 별도 query projection으로 제공한다.
- turn metadata가 없는 기존 traffic은 AC-022에서 별도 fallback을 결정한다.
- turn ID 생성 자체와 tool execution은 proxy 범위에 포함하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Turn ID 전달 계약:** turn ID·sequence를 HTTP header, request metadata, 또는 harness 내부 adapter 중 어디에서 전달할지 결정해야 한다.
- [x] **deferred assumption — 기존 traffic migration:** 이번 요구사항에서는 기존 schema/data를 migration하지 않는다. 기존 traffic 표시 fallback은 AC-022에서 결정한다.
- [x] **out of scope — tool execution:** tool call 실행과 harness orchestration은 이 concern의 범위가 아니다.

## Related
- `spec/AC.md` — AC-019, AC-022, AC-023
- `adr/traffic-log-storage.md`

## Notes
- 2026-03-10: AC-019 review를 위해 proposed ADR을 작성했다.
