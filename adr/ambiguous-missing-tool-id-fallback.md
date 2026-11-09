# 모호하거나 누락된 tool ID의 Turn grouping fallback

## Concern
Tool message의 identity가 없거나 하나의 요청이 여러 미완료 turn과 매칭될 때, proxy는 해당 traffic을 어떤 turn에 연결하고 어떻게 보존해야 하는가?

## Status
proposed

## Context
- Parent 결정은 여러 미완료 turn을 유지하고 tool-call ID 역색인으로 incoming request를 연결하도록 정했다.
- 정상적인 tool message는 tool-call ID를 통해 하나의 미완료 turn에 결정적으로 매칭되어야 한다.
- 그러나 일부 API payload에는 tool ID가 없을 수 있고, ID가 누락되거나 충돌하면 하나의 request가 여러 미완료 turn에 매칭될 수 있다.
- 이 경우 임의로 기존 turn을 선택하면 서로 다른 사용자 요청이 잘못 합쳐질 수 있으며, 구현·검증 결과가 비결정적이 된다.
- proxy는 client/harness를 수정할 수 없고, upstream traffic을 가능한 한 전달·기록해야 한다.

## Decision

## Options
### Option A — 최근 미완료 turn에 결정적으로 연결
- identity가 없거나 여러 turn에 매칭되면 context와 관찰 순서를 기준으로 가장 최근의 미완료 turn을 선택한다.
- Pro: turn 수가 늘지 않고 일부 payload에서도 연속적인 grouping을 유지한다.
- Con: 실제 관계를 증명할 수 없는 traffic을 잘못된 turn에 합칠 수 있으며, 동시 turn에서 오그룹핑 위험이 크다.

### Option B — 매칭 불가 traffic을 새 standalone turn으로 격리
- identity가 없는 tool message, 어떤 미완료 turn에도 매칭되지 않는 tool message, 여러 미완료 turn에 매칭되는 모호한 message가 포함된 request는 기존 turn에 연결하지 않는다.
- 해당 request는 새 turn의 첫 traffic으로 저장하고 fallback 사유를 metadata에 기록한다. 이후 response에 tool call이 있으면 새 turn을 미완료 상태로 유지하며, tool call이 없으면 즉시 완료한다.
- Pro: 기존 turn을 추측으로 변경하지 않고, 모든 traffic을 보존하며, 동일 입력에 대해 결정적인 결과를 만든다.
- Con: 실제로는 기존 turn의 후속 traffic인 경우에도 turn이 분리될 수 있고, fallback metadata를 저장·표시해야 한다.

### Option C — 요청을 거부하고 기존 turn 상태를 유지
- identity가 없거나 매칭이 모호한 request는 proxy가 4xx 오류로 거부하고 traffic을 turn에 저장하지 않는다.
- Pro: 잘못된 grouping을 만들지 않고 turn 상태를 오염시키지 않는다.
- Con: proxy가 client/harness 호환성을 깨뜨리고 관찰된 traffic을 유실하며, upstream 호출 자체가 수행되지 않는다.

## Tradeoffs
| | Option A — 최근 turn 연결 | Option B — standalone 격리 | Option C — 요청 거부 |
|---|---|---|---|
| 오그룹핑 위험 | 높음 | 낮음 | 없음 |
| traffic 보존 | 보존 | 보존 | 유실 가능 |
| client/harness 호환성 | 유지 | 유지 | 깨질 수 있음 |
| 구현·검증 결정성 | context heuristic 의존 | 높음 | 높음 |
| 사용자에게 보이는 turn 분리 | 적음 | fallback 시 발생 | traffic 자체 미표시 |

## Recommendation
- **Option B — 매칭 불가 traffic을 새 standalone turn으로 격리**를 권고한다.
- tool ID가 없거나 모호한 경우 기존 미완료 turn에 연결하지 않는 보수적 규칙으로 오그룹핑을 방지한다.
- 요청은 계속 처리·저장해 proxy의 transparent forwarding과 observability를 유지한다.
- fallback reason은 최소한 `missing_tool_identity`, `unmatched_tool_identity`, `ambiguous_tool_identity` 중 하나로 저장해 운영자와 자동 검증이 결과를 식별할 수 있게 한다.

## Consequences
- fallback request마다 새 stable turn을 생성하고 해당 request traffic을 첫 child로 저장한다.
- `missing_tool_identity` 또는 `unmatched_tool_identity`가 있는 request는 기존 미완료 turn을 변경하지 않는다.
- 하나 이상의 미완료 turn에 매칭되는 `ambiguous_tool_identity` request도 기존 turn을 변경하지 않고 새 turn으로 격리한다.
- fallback으로 생성된 새 turn에서 이후 tool call이 발생하면 해당 새 turn의 미완료 상태를 유지하고, tool call이 없으면 정상 규칙에 따라 완료한다.
- fallback reason은 turn 또는 첫 traffic metadata에서 조회 가능해야 하며, tree projection은 일반 turn과 동일하게 표시하되 fallback 상태를 식별할 수 있어야 한다.
- tool identity 자체가 없는 API의 정상적인 요청도 이 규칙에 따라 standalone turn으로 시작하며, proxy는 payload 추측으로 과거 turn을 연결하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Fallback metadata wire shape:** fallback reason을 traffic metadata 또는 turn 상태 필드 중 어디에 어떤 고정 enum과 response shape으로 노출할지 결정해야 한다.
- [x] **directly resolved — 기존 turn 선택 heuristic:** identity가 없거나 모호하면 최근 turn을 추측하지 않고 standalone turn으로 격리한다.
- [x] **directly resolved — 요청 처리:** fallback 상황에서도 request를 거부하지 않고 upstream forwarding과 traffic 저장을 계속한다.
- [x] **covered — 정상 ID 매칭:** 하나의 미완료 turn에 유일하게 매칭되는 tool ID는 parent ADR의 ID 역색인 규칙을 따른다.
- [x] **deferred assumption — cross-process ordering:** 단일 proxy 프로세스 내 관찰 순서만 현재 범위에 포함한다.

## Related
- Parent: `adr/turn-order-concurrency-completion.md`
- `adr/standard-semantic-stream-adapter-interface.md`
- `spec/AC.md` — AC-023
- `spec/ASR.md` — ASR-022
- `spec/llm-proxy-turn-traffic.md` — C-007, R-001, R-002
- Follow-up (pending user decision): `adr/fallback-metadata-wire-shape.md`

## Notes
- 2026-03-10: Parent ADR의 downstream concern을 분리해 proposed ADR로 작성했다. Option B를 추천한다.
