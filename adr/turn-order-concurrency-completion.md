# Turn grouping 순서·동시성·완료 판정

## Concern
Proxy가 traffic을 분석해 turn을 그룹핑할 때 traffic 순서, 동시 turn 분리, 진행 중 상태와 완료 상태를 어떻게 관리할 것인가?

## Status
approved

## Context
- client와 harness는 변경할 수 없으므로 proxy가 request/response 내용을 분석해야 한다.
- response에 tool call이 있으면 turn은 종료되지 않고, tool call이 없는 response면 turn이 종료된다.
- 다음 request에 이전 response의 tool call에 대한 tool message가 있으면 같은 turn의 다음 traffic이다.
- 복수 tool call과 tool message는 ID로 매칭하며 tool message 순서는 tool call 순서와 다를 수 있다.
- proxy에는 명시적인 turn ID가 전달되지 않는다.

## Decision
**Option B — 미완료 turn pool과 tool-call ID 역색인.** Proxy는 여러 미완료 turn을 동시에 유지하고 각 turn의 미해결 tool call ID를 역색인한다. incoming request의 tool message ID가 일치하는 turn에 다음 traffic을 연결하며, 최종 response에 tool call이 없으면 turn을 완료한다. 이 방식은 복수 tool call 결과가 원래 요청 순서와 다르게 도착해도 ID 기준으로 정확히 연결한다.

## Options
### Option A — 최근 진행 turn 하나와 순차 상태 머신
- proxy가 각 API/model/session 추정 context마다 가장 최근의 미완료 turn 하나를 유지한다.
- tool message가 그 turn의 미해결 tool call ID와 일치하면 해당 turn에 연결한다.
- 최종 response에 tool call이 없으면 turn을 완료한다.
- Pro: 현재 규칙을 가장 단순하게 구현하고 결과가 예측 가능하다.
- Con: 명시적 client session이 없으면 독립 요청이 같은 context로 오인될 가능성이 있다.

### Option B — 미완료 turn pool과 tool-call ID 역색인
- 여러 미완료 turn을 동시에 유지하고, incoming request의 tool message ID를 역색인해 일치하는 turn을 선택한다.
- tool message가 없으면 새 turn으로 시작한다.
- Pro: 동시 turn과 out-of-order tool result를 더 정확히 처리할 수 있다.
- Con: tool message가 없는 후속 request나 ID 충돌·누락에 대한 fallback이 복잡하다.

### Option C — 시간창 기반 traffic sequence grouping
- 최근 traffic과 짧은 시간창, API/model 등의 heuristic으로 turn을 묶고 tool ID는 보조 정보로 사용한다.
- Pro: metadata와 tool message가 불완전해도 grouping을 계속할 수 있다.
- Con: 동시 요청과 지연된 tool result에서 오그룹핑 가능성이 높고 결과 재현성이 낮다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 동시 turn 처리 | 제한적 | 높음 | 낮음~중간 |
| out-of-order tool result | ID가 현재 turn에 있으면 가능 | 높음 | 불안정 |
| 구현 복잡도 | 낮음 | 높음 | 중간 |
| 오그룹핑 위험 | context 의존 | ID가 있으면 낮음 | 높음 |
| 누락 metadata fallback | 단순 | 별도 정책 필요 | heuristic으로 보완 |

## Recommendation
- **Option B — 미완료 turn pool과 tool-call ID 역색인**을 채택한다. 사용자가 명시한 복수 tool call 및 out-of-order tool message 요구를 가장 직접적으로 만족시키며, proxy가 동시에 관찰할 수 있는 미완료 turn을 보존한다.

## Consequences
- turn별 미해결 tool call ID 집합과 traffic sequence를 유지해야 한다.
- request의 tool message ID가 하나 이상의 미완료 turn과 매칭되면 해당 turn에 연결하고, 매칭되지 않으면 새 turn 또는 fallback traffic으로 처리하는 규칙이 필요하다.
- 완료 turn은 더 이상 새 traffic에 연결하지 않는다.
- proxy 재시작 후 미완료 turn 상태를 복구할지 별도 결정해야 한다.

## Downstream Concerns
- [ ] **ADR candidate — Grouping state durability:** proxy 재시작 후 미완료 turn을 저장 데이터에서 복구할지 결정해야 한다.
- [ ] **ADR candidate — Ambiguous/missing tool IDs:** tool message ID가 없거나 여러 turn과 매칭될 때의 fallback을 결정해야 한다.
- [x] **deferred assumption — cross-process ordering:** 단일 proxy 프로세스 내 traffic ordering만 이번 범위에 포함한다.

## Related
- `spec/AC.md` — AC-019, AC-023, AC-024
- `adr/turn-grouping-storage-lifecycle.md`

## Notes
- 2026-03-10: AC-023 review를 위해 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option B를 승인했다. 미완료 turn pool과 tool-call ID 역색인을 사용한다.
