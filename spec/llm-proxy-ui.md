# LLM Proxy Monitoring UI

LLM Proxy의 React 모니터링 UI가 turn/traffic tree를 탐색하고, 선택한 대상에 맞는 `TurnView` 또는 `TrafficView`를 오른쪽 콘텐츠 영역에 표시하도록 정의한다. 이 문서는 UI 화면 구조·상태·선택·컴포넌트 경계·검증 기준을 소유하며, 서버의 grouping·query·metadata·content safety 계약은 관련 상위 Spec을 따른다.

## Context

- 기본 제품 목표와 localhost 모니터링 범위는 `spec/PRD.md`와 `spec/llm-proxy-server.md`가 소유한다.
- turn/traffic grouping, tree aggregate, legacy projection, URL selection 계약은 `spec/llm-proxy-turn-traffic.md`가 소유한다.
- turn metadata, filter/pagination, summary/usage projection, safe content viewer 계약은 `spec/llm-proxy-turn-management.md`가 소유한다.
- 현재 UI 구현 기준선은 다음과 같다.
  - `src/ui/main.tsx`: React bootstrap
  - `src/ui/pages/TrafficPage.tsx`: page-level state와 화면 조합
  - `src/ui/components/TurnTree.tsx`: 왼쪽 turn/traffic tree와 관리 action
  - `src/ui/components/TurnView.tsx`: turn 선택 시 오른쪽 view
  - `src/ui/components/TrafficView.tsx`: traffic 선택 시 오른쪽 view
  - `src/ui/components/LogDetail.tsx`: traffic request/response/error 상세
  - `src/ui/components/ContentViewer.tsx`: 안전한 content 형식별 표시
  - `src/ui/data-query/log-api.ts`: 브라우저 HTTP query/mutation 경계
  - `src/ui/types.ts`: UI view model
- UI는 Fastify가 제공하는 React 정적 bundle로 동작하며 SQLite, DB driver, persistence table에 직접 접근하지 않는다.

## UI Information Architecture

```text
TrafficPage
├── Sidebar
│   ├── Turn filter: 전체 / Flagged
│   ├── TurnTree header: Turns + turn pagination
│   └── TurnTree
│       ├── Turn node: collapse/expand + flag + title/status/count
│       └── Child traffic node (visible when expanded)
└── Right content
    ├── TurnView       # turn이 선택된 경우
    └── TrafficView    # traffic이 선택된 경우
```

오른쪽 콘텐츠 영역의 active view는 선택 종류와 일대일로 대응한다. turn을 선택하면 `TurnView`, traffic을 선택하면 `TrafficView`를 표시하며, 두 view를 동시에 표시하거나 turn 선택 화면에 flat log table을 혼합하지 않는다.

## Requirements

- R-001: UI는 React `main → page → component/data-query` 구조를 사용해야 한다. `main.tsx`는 bootstrap만 담당하고, `TrafficPage`는 화면 상태와 use-case 조합을 담당하며, presentational component는 API를 직접 호출하지 않아야 한다. UI bundle에는 SQLite 또는 DB driver를 포함하지 않아야 한다. ← ASR-011; ASR-014; `adr/ui-framework-and-monitoring-structure.md`; `adr/api-log-write-ui-read-boundary.md`

- R-002: `TrafficPage`는 `/api/v1/turns` query 결과를 사용해 왼쪽 sidebar에 turn과 child traffic을 tree로 표시해야 한다. 각 turn node는 kind, title 또는 ID fallback, status, flag, traffic count를 표시하고 child traffic은 proxy가 저장한 sequence 순서와 상태를 표시해야 한다. Tree 응답에 request/response 본문을 포함하지 않아야 한다. ← ASR-025; ASR-026; R-004~R-005 of `spec/llm-proxy-turn-traffic.md`

- R-003: Sidebar는 `all`과 `flagged` turn filter를 제공하고, filter는 서버 query parameter로 전달해야 한다. pagination은 top-level turn 단위로 동작하며 child traffic을 별도로 page 처리하지 않아야 한다. flag 변경 또는 turn 삭제 성공 후 현재 filter/page query를 다시 조회하고, 결과가 빈 page이면 마지막 유효 page로 보정해야 한다. ← ASR-029; R-003~R-004 of `spec/llm-proxy-turn-management.md`

- R-004: Turn node와 child traffic은 stable identifier로 선택되어야 한다. turn 선택은 URL query `turn=<turn-id>`로, traffic 선택은 `turn=<turn-id>&traffic=<traffic-id>`로 표현해야 한다. URL 변경은 browser back/forward와 새로고침에서 복원되어야 하며 URL에는 본문 content를 저장하지 않아야 한다. ← ASR-027; R-006 of `spec/llm-proxy-turn-traffic.md`

- R-005: 오른쪽 콘텐츠 영역은 선택 상태에 따라 다음 중 정확히 하나의 view를 렌더링해야 한다.
  - `traffic` selection이 있으면 `TrafficView`를 렌더링한다.
  - `traffic` selection이 없고 유효한 `turn` selection이 있으면 `TurnView`를 렌더링한다.
  - selection이 없으면 empty 상태를 가진 `TurnView`를 렌더링한다.
  - turn summary, traffic detail, flat legacy log table을 동시에 오른쪽 영역에 표시하지 않는다.
  이 계약은 turn 선택과 traffic 선택의 시각적·기능적 구분을 보장한다. ← ASR-027; `adr/sidebar-selection-main-view-contract.md`

- R-006: `TurnView`는 선택한 turn의 title 또는 ID fallback, lifecycle status, traffic count, model, duration, usage/cost, partial 상태를 서버 projection 그대로 표시해야 한다. 시작 user input은 turn summary의 `start_user_input`을, 종료 AI output은 `end_ai_output`을 사용하며 UI가 summary 계산·usage 합산·cost 추정을 다시 수행해서는 안 된다. ← ASR-030; R-005~R-006 of `spec/llm-proxy-turn-management.md`

- R-007: `TurnView`는 선택한 turn의 child traffic 목록을 표시하고 각 child의 sequence/title 또는 sequence fallback, status, model 등 tree summary metadata를 표시해야 한다. child traffic을 선택하면 해당 turn ID와 traffic ID를 함께 URL state에 기록하고 `TrafficView`로 전환해야 한다. ← ASR-025; ASR-027

- R-008: `TrafficView`는 traffic 선택 시 기존 detail API를 통해 traffic 본문을 지연 조회해야 한다. traffic tree aggregate 응답에는 본문을 요구하지 않으며, detail 응답의 request, response, error, metadata를 `LogDetail`로 표시해야 한다. streaming traffic은 raw SSE event 배열이 아니라 저장된 final aggregate 또는 failed partial aggregate를 response로 표시해야 한다. ← ASR-023; R-004/R-006 of `spec/llm-proxy-server.md`; R-004 of `spec/llm-proxy-turn-traffic.md`

- R-009: Traffic detail fetch는 sidebar tree fetch와 독립적으로 동작해야 한다. detail fetch 중에는 `TrafficView`의 loading 상태를 표시하고, 실패하면 오른쪽 영역에 식별 가능한 error와 turn으로 돌아가는 동작을 제공해야 하며, sidebar tree를 제거하거나 unusable 상태로 만들지 않아야 한다. ← R-007 of `spec/llm-proxy-turn-traffic.md`

- R-010: Tree와 오른쪽 view는 loading, empty, error 상태를 사용자에게 식별 가능하게 표시해야 한다. Tree loading 중에는 tree loading 상태, 결과가 없으면 empty 안내, tree query 실패 시 error를 표시한다. selection이 없을 때는 turn 선택 안내를 표시하고, detail selection이 있으나 아직 응답이 없을 때는 traffic loading/empty 상태를 표시한다. ← R-007 of `spec/llm-proxy-turn-traffic.md`

- R-011: TurnTree는 turn title 편집, flag 설정·해제, turn 삭제 action을 제공해야 한다. 삭제는 turn 단위만 가능하고 confirmation 이후 성공하면 현재 selection을 정리하며 현재 filter/page를 재조회해야 한다. legacy synthetic node에는 turn cascade 삭제 action을 제공하지 않아야 한다. ← ASR-028; R-001~R-004 of `spec/llm-proxy-turn-management.md`

- R-012: Traffic detail의 `request`와 `response`는 전체 문자열을 하나의 표시 형식으로 감지하는 대상이 아니라 JSON object/array container로 처리해야 한다. JSON parse에 성공한 request/response는 read-only JSON tree로 표시하고, object/array/number/boolean/null node는 tree 탐색 대상으로 유지하며 문자열 leaf만 별도의 viewer 대상이 된다. JSON parse에 실패한 content는 안전한 plain text fallback으로 표시한다. ← ASR-031; R-007~R-012 of `spec/llm-proxy-turn-management.md`

- R-013: JSON tree의 문자열 leaf는 기본 상태에서 축약된 preview를 표시해야 한다. 사용자가 문자열 leaf의 전체 보기/확대를 요청하면 inline content를 확장하지 않고 popup viewer window를 열어 해당 문자열 값만 viewer로 표시해야 한다. Popup viewer는 문자열 단위로 열리고 닫혀야 하며, 다른 문자열 leaf나 request/response 전체를 viewer 대상으로 취급하지 않아야 한다.

- R-014: Popup viewer는 선택된 문자열 값에 대해서만 Auto, JSON, Markdown, Code, Plain text 표시 형식을 제공해야 한다. Auto mode는 해당 문자열 값에 대해 content hint → JSON parse → 제한된 Markdown 판별 → curated code language 후보 → escaped plain text fallback 순서를 따르고, 사용자가 선택한 mode/language는 자동 감지 결과보다 우선해야 한다. ← ASR-031; R-007~R-012 of `spec/llm-proxy-turn-management.md`

- R-015: UI는 기존 `/api/v1` namespace와 `src/ui/data-query/` 경계를 사용해야 한다. page와 component는 SQLite connection/table 또는 server 내부 module을 import하지 않고, 모든 query/mutation은 browser-side data-query 함수와 API route를 통해 수행해야 한다. ← ASR-014; C-001/C-003 of `spec/llm-proxy-turn-management.md`

- R-016: UI는 localhost monitoring 용도로 제공되며 저장된 redaction 결과만 표시해야 한다. API key, Authorization, cookie 및 기타 알려진 secret이 UI에 평문으로 노출되지 않아야 한다. ← ASR-004; ASR-005; C-004 of `spec/llm-proxy-server.md`

- R-017: UI layout은 desktop에서 sidebar와 right content를 나란히 표시하고, 폭이 좁은 화면에서는 sidebar가 위, right content가 아래로 배치되도록 responsive fallback을 제공해야 한다. 오른쪽 content는 horizontal overflow로 인해 tree와 detail의 식별 가능성을 잃지 않아야 한다.

- R-018: UI 검증은 최소한 다음 동작을 재현해야 한다: turn tree 표시, all/flagged filter, turn pagination, URL turn/traffic selection, browser back/forward, `TurnView`/`TrafficView` exclusive rendering, initial traffic URL detail fetch, independent detail error, turn metadata action, summary null/partial 표시, JSON object tree rendering, string leaf preview, popup viewer open/close, string-scoped viewer mode/fallback/safety/1 MiB bound. `npm run build`와 `npm run verify`를 기본 진입점으로 유지해야 한다. ← ASR-009; ASR-015; ASR-027; ASR-031

- R-019: 각 turn node는 탐색기처럼 접힘/펼침 상태를 가져야 한다. turn header에는 왼쪽부터 접힘/펼침 아이콘 버튼, flag 아이콘 버튼, turn title/status/count 정보를 표시해야 한다. 접힘 상태에서는 child traffic node를 숨기고, 펼침 상태에서는 해당 turn의 child traffic을 sequence 순서로 표시해야 한다. 접힘/펼침과 flag action은 서로 독립적으로 동작해야 한다.

- R-020: TurnTree의 `Turns` title과 turn pagination control은 같은 header 행에 배치해야 한다. title은 왼쪽, pagination은 오른쪽에 위치하며, 좁은 화면에서는 pagination이 다음 줄로 내려가더라도 turn tree와 pagination의 의미가 유지되어야 한다.

- R-021: `TurnView`는 turn summary 아래에 child traffic summary를 table 형태로 표시해야 한다. table의 각 row는 sidebar child와 동일한 traffic 표시값을 사용해야 하며, column은 `Traffic`, `Input tokens`, `Cached input tokens`, `Output tokens`, `Elapsed time`, `Cost` 순서로 제공해야 한다. 서버가 값을 제공하지 않는 경우 UI는 `—` 또는 서버가 정의한 null 표시를 사용하고 값을 추정하지 않아야 한다. ← R-019 of `spec/llm-proxy-turn-management.md`

- R-022: `TurnView`의 turn summary는 Traffic page와 동일한 summary 정보와 turn 전체 usage 합계를 표시해야 한다. request는 첫 traffic request의 마지막 user 메시지, response는 turn을 종료하는 마지막 traffic response의 최종 assistant 메시지를 서버 projection으로 표시해야 한다. API별 추출은 Responses API의 `input` 문자열 또는 마지막 user item의 마지막 `input_text`와 마지막 assistant output item의 마지막 `output_text`, Chat Completions API의 마지막 user `messages[].content`와 assistant `choices[0].message.content`, Messages API의 마지막 user `messages[].content`와 assistant `content[]`의 마지막 `text`를 따른다. UI는 request/response를 다시 선택하거나 usage/cost를 재계산하지 않아야 한다. ← R-005 of `spec/llm-proxy-turn-management.md`; Direct Input

- R-023: `TrafficView`는 traffic summary를 content detail보다 먼저 표시해야 한다. summary에는 detail API가 제공하는 stable provider ID, model, input tokens, cached input tokens, output tokens, cost, 처리 시간을 표시하며 서버 projection의 null/partial 의미를 유지해야 한다. TrafficView는 해당 값을 다른 traffic이나 turn의 값으로 보완하거나 추정하지 않아야 한다. ← R-013 of `spec/llm-proxy-turn-management.md`

- R-024: `TrafficView`의 request와 response content는 각각 read-only JSON tree view로 표시해야 한다. JSON parse가 성공한 request/response는 접을 수 있는 JSON tree로 탐색할 수 있어야 하며, JSON parse가 실패하거나 content가 JSON이 아닌 경우에는 기존 ContentViewer의 안전한 fallback 규칙을 사용한다. request와 response의 viewer state는 서로 독립이어야 한다.

- R-025: 문자열 preview에서 전체 보기/확대를 요청하면 popup viewer를 열고, popup을 닫으면 동일한 JSON tree 위치로 돌아가야 한다. Popup viewer는 read-only여야 하며 원본 request/response JSON이나 문자열 값을 변경하지 않아야 한다.

- R-026: Popup viewer의 mode/language 선택 상태는 request/response field와 문자열 leaf 식별자별 현재 viewer instance에만 유지해야 한다. 다른 문자열 leaf 선택, traffic 변경, viewer close, 새로고침 시 자동 감지 상태로 초기화하며 URL, 서버, localStorage에 저장하지 않아야 한다. 저장된 각 문자열 값이 1 MiB 이하이면 별도 문자 수·줄 수 truncation 없이 popup에서 전체를 확인할 수 있어야 한다. ← ASR-031; R-009~R-010 of `spec/llm-proxy-turn-management.md`
- R-027: TurnView는 별도 turn 제목 heading 없이 `Turn <turn 제목> summary` heading을 표시하고, TrafficView는 `Turn <turn 제목>/Traffic <traffic 표시값> summary` heading을 표시해야 한다. 두 summary는 `Status`, `Model`, `Provider`, `Cost`, `Input tokens`, `Cached input tokens`, `Output tokens`, `Elapsed time` 순서를 사용하며 cost는 소수점 4자리, token/time은 3자리 콤마로 표시한다. TurnView response는 `ContentViewer`의 plain text Markdown, JSON object/array tree, 긴 문자열 popup 동작을 재사용해야 한다. ← R-020~R-021 of `spec/llm-proxy-turn-management.md`
- R-028: TurnView는 summary, request/response content, traffic table을 traffic view처럼 각각 독립 `card` section으로 렌더링해야 한다. request/response content에는 별도 Request/Response heading을 렌더링하지 않고 `ContentViewer` object만 표시하며, 각 object 안에는 `request:` 또는 `response:` label을 유지해야 한다. request와 response viewer 사이에 divider를 두고, 단순 문자열은 JSON string scalar 형식으로 표시하며, 양쪽의 긴 scalar 문자열은 JSON 형식 축약 preview와 popup viewer 전체 보기 동작을 제공해야 한다. ← R-022 of `spec/llm-proxy-turn-management.md`
- R-029: `TrafficPage`는 sidebar turn tree와 현재 선택된 오른쪽 `TurnView` 또는 `TrafficView`를 기본 2초 간격으로 자동 갱신해야 한다. 각 주기마다 현재 page/filter의 turn projection을 재조회하고, traffic이 선택되어 있으면 선택된 traffic detail도 재조회해야 한다. 갱신 중에도 URL selection, 현재 page/filter, tree의 collapse/expand 같은 presentation state는 유지해야 하며, 한 영역의 fetch 실패가 다른 영역의 표시를 제거하거나 갱신을 중단시키지 않아야 한다.

## Constraints

- C-001: 이 문서는 UI 계약만 소유한다. turn grouping semantic, turn lifecycle, tree projection schema, usage/cost 계산, legacy projection, content 저장·redaction policy의 원본 결정은 각각 `spec/llm-proxy-turn-traffic.md`, `spec/llm-proxy-turn-management.md`, `spec/llm-proxy-server.md`를 따른다. 상위 Spec과 충돌하는 UI 구현은 허용하지 않는다.

- C-002: Tree 응답에는 request/response 본문을 포함하지 않는다. UI는 traffic 선택 이후 기존 detail API로 본문을 지연 조회하며, UI가 SQLite 또는 다른 persistence layer를 직접 조회하지 않는다. ← ASR-025; ASR-014

- C-003: UI는 traffic의 실시간 streaming transcript, stream replay, event-level 영구 저장을 제공하지 않는다. 자동 갱신은 저장된 turn projection과 final/partial aggregate detail을 재조회하는 polling으로만 제공하며, 오른쪽 `TrafficView`는 매 주기 저장된 상태를 표시한다. ← ASR-002; ASR-023

- C-004: UI는 provider가 보고하지 않은 cost를 추정하지 않고 서버가 제공한 null/partial 상태를 그대로 표시한다. summary 계산 규칙을 component에서 재구현하지 않는다. ← ASR-020; ASR-030

- C-005: UI는 API key, secret, raw unredacted header를 직접 보유하거나 표시하지 않는다. content viewer는 저장된 bounded content만 처리하고 저장 한도를 우회해 원본을 재요청하지 않는다. ← ASR-004; C-005 of `spec/llm-proxy-turn-management.md`

- C-006: UI component는 API 호출 책임을 가지지 않는다. API 호출은 `src/ui/data-query/`에 두며, `TrafficPage`는 이를 조합하고 presentational component에는 data와 callback을 전달한다.

- C-007: `TurnView`와 `TrafficView`는 서로의 상세 표시 책임을 중복 구현하지 않는다. TurnView는 turn projection과 child selection을, TrafficView는 lazy traffic detail과 JSON tree/popup string viewer를 소유한다.

- C-008: UI 상태에서 server projection 값과 presentation state를 구분한다. server projection에는 turn/traffic selection, summary, metadata가 포함되고, JSON tree expansion과 popup viewer mode/language 같은 presentation state는 현재 viewer instance 범위에만 둔다. ← ASR-031

- C-009: request/response 전체 content를 Markdown/code/plain-text viewer로 자동 감지하지 않는다. request/response는 JSON tree container가 우선이며, viewer detection은 JSON tree 내부의 선택된 문자열 leaf에 대해서만 수행한다.

- C-010: 문자열 전체 보기 popup은 현재 UI 안의 독립 viewer window/dialog로 제공하며, popup close 시 JSON tree로 복귀할 수 있어야 한다. popup이 브라우저의 새 탭/새 창을 열어야 한다는 계약은 포함하지 않는다.

- C-012: provider와 traffic usage summary는 server projection 값만 표시한다. UI는 provider ID를 routing 설정이나 endpoint에서 추론하지 않고, usage/cost/latency를 child traffic 또는 detail 응답에서 재계산하지 않는다.

- C-011: 화면의 텍스트와 상태 표시는 운영자가 loading/empty/error/completed/failed/in_progress를 식별할 수 있어야 하며, 상태 enum을 임의의 새로운 lifecycle 의미로 변환하지 않는다.

## Current Implementation Baseline

| UI contract | Current implementation | Status |
|---|---|---|
| Sidebar tree | `TurnTree` in `TrafficPage` | implemented |
| Turn collapse/expand icon button | No collapse state or icon action in `TurnTree` | gap from this UI Spec |
| Turn flag icon button | Star flag action in `TurnTree` | implemented |
| `Turns` title with pagination on the right | Pagination is rendered below `TurnTree` | gap from this UI Spec |
| All/Flagged filter and turn pagination | `fetchTurns(page, limit, filter)` | implemented |
| URL selection | `turn` / `traffic` query parameters | implemented |
| Exclusive right-side view | `TurnView` or `TrafficView` | implemented |
| Turn summary and child selection | `TurnView` | partial: summary exists, table projection is not implemented |
| Turn traffic usage summary table | No table; child traffic buttons only | gap from this UI Spec |
| Lazy traffic detail | `TrafficView` → `LogDetail` → `ContentViewer` | implemented |
| Traffic usage summary | `LogDetail` displays model/tokens/cost/latency; provider and dedicated summary layout are absent | partial |
| Request/response JSON object tree | Current `ContentViewer` parses the entire content and renders a JSON tree | partial: string leaf popup behavior is absent |
| String leaf collapsed preview | Current JSON viewer behavior only provides generic tree expansion | partial |
| String leaf popup viewer | No popup viewer window/dialog exists | gap from this UI Spec |
| Request/response whole-content viewer detection | Current implementation detects the entire request/response content | conflict: must be replaced by container-first behavior |
| Request/response dedicated JSON tree layout | `LogDetail` currently uses generic content viewer sections | partial |
| Independent traffic detail loading/error | `TrafficPage` state + `TrafficView` | implemented |
| Turn title/flag/delete actions | `TurnTree` callbacks | implemented |
| Traffic title editing | No traffic rename action is exposed in `TurnTree` | gap against parent management Spec |
| Safe content viewer | `ContentViewer` adapter | implemented |
| Responsive sidebar/content layout | `styles.css` media query | implemented |
| Automated UI-specific exclusive-view assertions | not yet isolated as a dedicated test inventory | follow-up verification |
| Automated collapse/expand, summary-table, and traffic-summary assertions | not yet isolated as a dedicated test inventory | follow-up verification |
| Automated JSON tree string-preview/popup-viewer assertions | not yet isolated as a dedicated test inventory | follow-up verification |

## Out of Scope

- Proxy routing, provider authentication, SSE transport, turn grouping semantic, SQLite schema, migration, and persistence implementation.
- New turn/traffic API contract or server-side summary/usage calculation rules.
- User authentication, RBAC, multi-user sharing, cross-tab preference synchronization.
- Real-time streaming transcript, replay, chart, alert, full-text search, and billing UI. 저장된 turn/traffic projection의 polling 기반 자동 갱신은 R-029 범위에 포함한다.
- UI redesign unrelated to the turn/traffic navigation and content inspection contract.
- Browser end-to-end test framework adoption unless a later implementation sprint explicitly scopes it.

## Open Questions

- 자동 갱신 주기는 2초로 고정한다. 별도 browser E2E framework 도입은 out of scope이며, 현재는 `npm run build`, `npm run verify`, 기존 viewer/turn verification과 source-level acceptance를 사용한다.

## Related

- `spec/PRD.md` — product goals and UI deltas
- `spec/llm-proxy-server.md` — base monitoring UI, API, redaction, SSE aggregate contract
- `spec/llm-proxy-turn-traffic.md` — turn grouping, tree query, legacy projection, selection contract
- `spec/llm-proxy-turn-management.md` — metadata, filter/pagination, summary, safe viewer contract
- `spec/ASR.md` — ASR-006, ASR-009, ASR-011, ASR-014, ASR-023, ASR-025~ASR-031
- `src/ui/pages/TrafficPage.tsx`
- `src/ui/components/TurnTree.tsx`
- `src/ui/components/TurnView.tsx`
- `src/ui/components/TrafficView.tsx`
- `src/ui/components/LogDetail.tsx`
- `src/ui/components/ContentViewer.tsx`

## Notes

- 2026-03-10: 기존 base/turn/grouping/turn-management Spec과 현재 React UI 구현을 근거로 UI 전용 Spec 초안을 작성했다.
- 2026-03-10: 오른쪽 콘텐츠 영역의 exclusive `TurnView`/`TrafficView` 계약과 traffic URL direct-load detail fetch를 현재 구현 기준으로 명시했다.
- 2026-03-10: 상위 Turn 관리 Spec의 traffic title editing 요구와 현재 `TurnTree` 구현 사이의 gap을 baseline에 기록했다. 이 문서는 해당 기능을 구현 완료로 가장하지 않는다.
- 2026-03-10: 사용자 UI 요구사항을 반영해 turn collapse/expand, sidebar header pagination, turn traffic summary table, traffic usage summary, request/response JSON tree view를 R-019~R-024로 추가했다. 현재 구현과의 차이는 Current Implementation Baseline에 기록했다.
- 2026-03-10: request/response 전체 content viewer 감지 방식을 폐기하고, JSON object tree 내부 문자열 leaf만 축약 preview와 popup viewer의 대상으로 변경했다. 관련 요구사항을 R-012~R-016 및 C-009~C-010으로 기록했다.
- 2026-03-10: Turn page 변경 요청을 반영해 Traffic page와 동일한 turn summary, API별 request/response 메시지 추출, turn usage 합계, sidebar와 일치하는 traffic 식별값 및 간소화된 traffic table column을 R-021~R-022에 반영했다.
- 2026-03-10: 사용자 요청에 따라 sidebar와 선택된 TurnView/TrafficView의 저장 상태를 2초 polling으로 자동 갱신하도록 R-029를 추가하고, 자동 갱신 금지 문구를 C-003 및 Out of Scope에서 제거했다.
