# Turn grouping metadata와 저장 lifecycle

## Concern
하나의 사용자 요청에서 발생한 여러 LLM traffic을 어떤 turn metadata와 저장 lifecycle로 그룹핑할 것인가?

## Status
approved

## Context
- 한 번의 사용자 요청은 LLM 응답에 tool call이 포함될 때 여러 provider traffic으로 이어질 수 있다.
- harness는 각 tool call을 처리한 뒤 tool message를 포함한 후속 요청을 LLM에 전달한다.
- 현재 저장 모델은 traffic 단위이며, turn과 traffic 사이의 부모 관계를 표현하지 않는다.
- 기존 traffic schema/data migration은 이번 범위에서 제외한다.

## Decision
**Proxy semantic grouping with API-specific adapters.** Client와 harness는 변경하지 않는다. Proxy가 traffic의 request/response를 API별 adapter로 분석해 tool call과 대응하는 tool message를 식별하고, tool call이 남아 있으면 turn을 진행 중으로 유지하며 tool call이 없는 최종 response에서 turn을 종료한다. 복수 tool call/tool message는 tool call ID를 기준으로 매칭하고 배열 순서는 의미 있는 순서로 가정하지 않는다.

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

### Option D — Proxy semantic grouping with API-specific adapters
- client/harness 변경 없이 proxy가 request/response의 tool call과 tool message를 분석한다.
- response에 tool call이 있으면 turn을 종료하지 않고, 다음 request에 대응하는 tool message가 있으면 같은 turn의 다음 traffic으로 연결한다.
- Pro: 현재 외부 계약을 보존하면서 실제 LLM 상호작용 의미로 turn을 판정한다.
- Con: API별 메시지·tool schema를 표준 adapter interface로 정의하고, 불완전·비정상 traffic fallback을 명시해야 한다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 그룹 경계 정확성 | 높음 | 낮음 | 높음 |
| harness 연동 비용 | metadata 전달 필요 | 없음 | lifecycle 계약 필요 |
| 동시 요청 안전성 | 높음 | 낮음 | 높음 |
| 저장 모델 복잡도 | 낮음~중간 | 낮음 | 높음 | 중간 |
| lifecycle 표현력 | traffic 기반 계산 | 추론 기반 | 명시적 저장 | semantic 추론 |
| 외부 계약 변경 | 필요 | 없음 | 필요 | 없음 |

## Recommendation
- **Option D — Proxy semantic grouping with API-specific adapters**를 채택한다. client/harness를 변경할 수 없으므로 proxy가 API별 adapter를 통해 tool call과 tool message 관계를 분석해야 하며, tool call이 없는 response를 turn 종료로 판정하는 규칙이 현재 요구사항과 일치한다.

## Consequences
- proxy는 traffic request/response를 API별 adapter를 통해 분석하고 turn 관계와 순서를 저장해야 한다.
- 복수 tool call과 tool message는 tool call ID 기준으로 매칭하며 응답 순서는 보장하지 않는다.
- turn summary와 완료 상태는 traffic metadata에서 계산하거나 별도 query projection으로 제공한다.
- 기존 traffic migration은 하지 않으며 turn metadata가 없는 traffic은 AC-022에서 fallback을 결정한다.
- tool execution과 harness orchestration은 proxy 범위에 포함하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — API semantic adapter contract:** API별 tool call/tool message 차이를 숨기는 표준 interface의 필드와 매칭·불완전 데이터 계약을 결정해야 한다.
- [x] **deferred assumption — 기존 traffic migration:** 이번 요구사항에서는 기존 schema/data를 migration하지 않는다. 기존 traffic 표시 fallback은 AC-022에서 결정한다.
- [x] **out of scope — tool execution:** tool call 실행과 harness orchestration은 이 concern의 범위가 아니다.

## Related
- `spec/AC.md` — AC-019, AC-022, AC-023
- `adr/traffic-log-storage.md`

## Notes
- 2026-03-10: AC-019 review를 위해 proposed ADR을 작성했다.
- 2026-03-10: 사용자 결정에 따라 Option D를 채택하고 Status를 approved로 변경했다. client/harness 변경 없이 proxy semantic grouping과 API별 adapter를 사용한다.
