# Turn 기반 LLM traffic 그룹핑·탐색

LLM Proxy가 client/harness 변경 없이 traffic request/response를 분석해 하나의 사용자 요청에 속한 복수 traffic을 turn으로 그룹핑하고, 운영자가 sidebar tree에서 turn/traffic을 탐색·선택해 메인 뷰에서 확인할 수 있도록 한다.

## Context
- 한 번의 사용자 요청은 LLM response의 tool call과 harness의 tool 처리 후속 request로 인해 여러 LLM traffic으로 이어질 수 있다.
- 기존 저장 모델은 traffic 단위이며, 새 기능은 turn 관계와 API별 semantic 차이를 추가로 표현해야 한다.
- 기존 traffic schema/data migration은 하지 않는다.
- 일반 SSE 전달·API별 종료 감지·upstream/client disconnect·최종 aggregate 저장 및 UI 표시의 공통 계약은 `spec/llm-proxy-server.md`가 소유한다.
- 이 문서는 일반 SSE transport와 저장 표현을 재정의하지 않고, turn grouping에 직접 필요한 semantic 분석 및 adapter contract만 추가한다.
- 기존 flat logs list/detail 조회와 client-facing SSE 전달은 보존한다.
- Parent: `spec/PRD.md`의 `Delta: Turn 기반 traffic 그룹핑·탐색 UI`

## Requirements

- R-001: Proxy는 client 또는 harness의 변경 없이 각 API adapter를 사용해 traffic request/response에서 tool call과 대응하는 tool message를 분석하고, 하나의 사용자 요청에 속한 traffic을 하나의 turn으로 그룹핑해야 한다. response에 tool call이 있으면 turn은 진행 중으로 유지하고, tool call이 없는 response면 turn을 종료해야 한다. 다음 request에 이전 response의 tool call들에 대응하는 tool message가 있으면 해당 traffic을 같은 turn의 다음 traffic으로 연결해야 한다. 하나의 미완료 turn에 유일하게 매칭되는 tool identity만 기존 turn 연결의 근거로 사용해야 한다. identity가 없거나 어떤 미완료 turn에도 매칭되지 않거나 여러 미완료 turn에 매칭되면 기존 turn에 연결하지 않고 새 standalone turn으로 시작해야 하며, 각각 `missing_tool_identity`, `unmatched_tool_identity`, `ambiguous_tool_identity` fallback reason을 기록해야 한다. 이 경우 request는 거부하지 않고 upstream으로 전달·저장해야 한다. 복수 tool call/tool message는 tool call ID로 매칭하며 tool message 배열의 순서는 tool call 순서를 의미하지 않는다. ← ASR-021; AC-019; adr/turn-grouping-storage-lifecycle.md; adr/ambiguous-missing-tool-id-fallback.md
- R-002: Proxy는 여러 미완료 turn을 동시에 유지하고 turn별 미해결 tool call ID를 역색인해야 한다. Incoming request의 tool message ID가 하나의 미완료 turn에 유일하게 매칭되면 해당 turn에 traffic을 연결하고, response에 tool call이 없는 traffic을 해당 turn의 마지막 traffic으로 저장한 뒤 turn을 완료해야 한다. identity가 없거나 미매칭되거나 모호한 request는 새 standalone turn의 첫 traffic으로 저장하고 기존 미완료 turn의 상태를 변경하지 않아야 한다. 완료된 turn에는 이후 traffic을 연결하지 않아야 한다. Traffic sequence는 proxy가 관찰해 저장한 순서를 사용해야 한다. ← ASR-022; AC-023; adr/turn-order-concurrency-completion.md; adr/ambiguous-missing-tool-id-fallback.md
- R-003: API adapter 표준 contract는 request의 tool result identities, response의 tool call identities와 `hasToolCalls`, 그리고 stream aggregator factory를 제공해야 한다. 공통 proxy service는 이 semantic operation만 사용하고 API별 최종 response JSON 생성은 adapter가 담당해야 한다. API 간 canonical response 변환은 수행하지 않아야 한다. ← ASR-024; AC-019; AC-024; adr/standard-semantic-stream-adapter-interface.md
- R-004: `GET /api/v1/turns`는 turn 단위 pagination을 사용하는 tree aggregate 응답을 제공해야 하며, 각 turn node 아래에 child traffic summary를 proxy가 저장한 sequence 순서로 포함해야 한다. Sidebar 응답에는 request/response 본문을 포함하지 않고 traffic 상세 본문은 traffic 선택 시 기존 detail API로 지연 조회해야 한다. ← ASR-025; AC-020; adr/turn-traffic-query-tree-projection.md
- R-005: `/api/v1/turns`는 turn metadata가 없는 기존 traffic을 `kind: "legacy"`인 synthetic single-traffic turn으로 표시해야 하며, 각 legacy node에는 child traffic 하나를 연결해야 한다. Legacy traffic 간의 과거 turn 관계를 추론하거나 기존 schema/data를 migration해서는 안 된다. Legacy node 순서는 기존 `started_at DESC` 목록 순서를 따라야 하며 기존 flat logs list/detail API도 계속 제공해야 한다. ← ASR-026; AC-022; adr/legacy-traffic-tree-compatibility.md
- R-006: UI sidebar는 `/api/v1/turns` 응답의 turn과 child traffic을 tree view로 표시하고, turn 선택과 traffic 선택을 URL query/route의 stable identifier로 구분해 저장해야 한다. Turn 선택 시 main view에 turn summary, 상태, traffic 개수/순서와 child 목록을 표시하고, traffic 선택 시 기존 `LogDetail`로 request/response/error/metadata를 조회해야 한다. URL state로 새로고침과 browser back/forward를 지원해야 한다. ← ASR-027; AC-021; adr/sidebar-selection-main-view-contract.md
- R-007: Tree와 main view는 loading, empty, fetch error 상태를 사용자에게 식별 가능하게 표시해야 하며, traffic detail fetch 실패가 sidebar tree 전체를 사용할 수 없게 만들지 않아야 한다. ← PRD Delta Success Criteria
- R-008: Turn grouping, multiple concurrent incomplete turns, out-of-order tool messages, final response without tool calls, legacy synthetic nodes, tree query, URL selection을 자동화된 검증으로 재현해야 한다. 공통 SSE final/partial aggregate 저장과 UI 표시 검증은 `spec/llm-proxy-server.md`의 검증 범위에 따른다. `npm run build`와 `npm run verify`를 검증 진입점으로 유지해야 한다. ← PRD Delta Success Criteria; ASR-009

## Constraints

- C-001: Client와 harness의 API contract, request/response payload, tool execution 및 orchestration을 변경하지 않는다. ← ASR-021; AC-019
- C-002: API별 semantic 차이는 adapter 내부에서 구현하며 공통 proxy service와 persistence는 Responses, Chat Completions, Messages의 raw schema를 직접 해석하지 않는다. ← ASR-024; AC-011
- C-003: 기존 API application path의 `TrafficLogWriter`와 UI query path의 `TrafficLogReader` 경계를 유지하고, UI가 SQLite table/connection에 직접 접근하지 않도록 한다. ← ASR-014; AC-012
- C-004: 기존 `/api/v1` namespace, secret redaction, bounded request/response body 정책, localhost 접근 경계를 유지한다. ← PRD Delta Constraints; ASR-004; ASR-005
- C-005: 기존 traffic schema/data migration은 하지 않는다. Turn grouping은 새로 관찰되는 traffic에 적용하며 metadata가 없는 기존 traffic은 R-007의 synthetic legacy projection으로만 표시한다. ← ASR-026; AC-022
- C-006: Turn grouping state는 단일 proxy 프로세스 내에서 관리한다. proxy 재시작 후 미완료 turn state 복구, cross-process ordering, 자동 retry/recovery는 이번 Spec의 구현 대상이 아니다. ← adr/turn-order-concurrency-completion.md; adr/partial-stream-aggregate-failure.md
- C-007: tool call/message identity가 없으면 `missing_tool_identity`, 어떤 미완료 turn에도 매칭되지 않으면 `unmatched_tool_identity`, 여러 미완료 turn에 매칭되면 `ambiguous_tool_identity`를 fallback reason으로 기록해야 한다. 이 세 경우 traffic은 기존 미완료 turn에 연결하지 않고 새 standalone turn의 첫 traffic으로 저장해야 하며, request는 upstream으로 전달해야 한다. fallback reason은 첫 traffic metadata에서 조회 가능해야 한다. ← ASR-022; AC-023; adr/ambiguous-missing-tool-id-fallback.md

## Out of Scope

- Client 또는 harness 수정
- Tool execution 및 harness orchestration 로직 변경
- 기존 traffic schema/data migration 또는 과거 traffic의 retroactive grouping
- 실시간 streaming transcript UI
- 사용자/조직 인증, 권한 관리, 고급 분석·차트·알림·과금
- 다중 proxy process 간 turn ordering과 미완료 turn 복구

## Open Questions

- Stable turn/traffic identifier, sequence 할당 시점, turn 상태 enum의 최소 persistence contract를 명시한다.
- `GET /api/v1/turns`의 pagination parameter, response metadata, 필수 node field와 deterministic tie-breaker를 명시한다.

## Related

- `spec/PRD.md`
- `spec/ASR.md`
- `spec/AC.md`
- `spec/llm-proxy-server.md` — 일반 SSE transport·completion·failure·aggregate 저장·UI 표시 contract의 SSOT
- `adr/turn-grouping-storage-lifecycle.md`
- `adr/turn-order-concurrency-completion.md`
- `adr/ambiguous-missing-tool-id-fallback.md`
- `adr/standard-semantic-stream-adapter-interface.md`
- `adr/sse-final-response-aggregation.md`
- `adr/partial-stream-aggregate-failure.md`
- `adr/turn-traffic-query-tree-projection.md`
- `adr/legacy-traffic-tree-compatibility.md`
- `adr/sidebar-selection-main-view-contract.md`
