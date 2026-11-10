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
│   ├── TurnTree
│   │   ├── Turn node
│   │   └── Child traffic node
│   └── Turn pagination
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

- R-012: Traffic detail의 request, response, error field는 공통 `ContentViewer` adapter를 통해 표시해야 한다. Auto mode는 content hint → JSON parse → 제한된 Markdown 판별 → curated code language 후보 → escaped plain text fallback 순서를 따르고, 사용자가 선택한 mode/language는 자동 감지 결과보다 우선해야 한다. ← ASR-031; R-007~R-012 of `spec/llm-proxy-turn-management.md`

- R-013: Content viewer는 JSON을 read-only JSON tree, 허용된 Markdown을 sanitizer를 거친 Markdown, code/text를 read-only code viewer 또는 plain text로 표시해야 한다. raw HTML 실행, JavaScript 실행, iframe, `eval`, `new Function`, 동적 외부 content fetch를 허용하지 않아야 하며, 감지 실패·지원 불가 형식·viewer 오류는 안전한 plain text로 복구해야 한다. ← ASR-031; C-004~C-005 of `spec/llm-proxy-turn-management.md`

- R-014: Content viewer의 mode/language 선택 상태는 request/response/error field별 현재 viewer instance에만 유지해야 한다. traffic 변경, viewer unmount/close, 새로고침 시 자동 감지 상태로 초기화하며 URL, 서버, localStorage에 저장하지 않아야 한다. 각 field의 저장된 bounded content가 1 MiB 이하이면 별도 문자 수·줄 수 truncation 없이 전체를 확인할 수 있어야 한다. ← ASR-031; R-009~R-010 of `spec/llm-proxy-turn-management.md`

- R-015: UI는 기존 `/api/v1` namespace와 `src/ui/data-query/` 경계를 사용해야 한다. page와 component는 SQLite connection/table 또는 server 내부 module을 import하지 않고, 모든 query/mutation은 browser-side data-query 함수와 API route를 통해 수행해야 한다. ← ASR-014; C-001/C-003 of `spec/llm-proxy-turn-management.md`

- R-016: UI는 localhost monitoring 용도로 제공되며 저장된 redaction 결과만 표시해야 한다. API key, Authorization, cookie 및 기타 알려진 secret이 UI에 평문으로 노출되지 않아야 한다. ← ASR-004; ASR-005; C-004 of `spec/llm-proxy-server.md`

- R-017: UI layout은 desktop에서 sidebar와 right content를 나란히 표시하고, 폭이 좁은 화면에서는 sidebar가 위, right content가 아래로 배치되도록 responsive fallback을 제공해야 한다. 오른쪽 content는 horizontal overflow로 인해 tree와 detail의 식별 가능성을 잃지 않아야 한다.

- R-018: UI 검증은 최소한 다음 동작을 재현해야 한다: turn tree 표시, all/flagged filter, turn pagination, URL turn/traffic selection, browser back/forward, `TurnView`/`TrafficView` exclusive rendering, initial traffic URL detail fetch, independent detail error, turn metadata action, summary null/partial 표시, content viewer mode/fallback/safety/1 MiB bound. `npm run build`와 `npm run verify`를 기본 진입점으로 유지해야 한다. ← ASR-009; ASR-015; ASR-027; ASR-031

## Constraints

- C-001: 이 문서는 UI 계약만 소유한다. turn grouping semantic, turn lifecycle, tree projection schema, usage/cost 계산, legacy projection, content 저장·redaction policy의 원본 결정은 각각 `spec/llm-proxy-turn-traffic.md`, `spec/llm-proxy-turn-management.md`, `spec/llm-proxy-server.md`를 따른다. 상위 Spec과 충돌하는 UI 구현은 허용하지 않는다.

- C-002: Tree 응답에는 request/response 본문을 포함하지 않는다. UI는 traffic 선택 이후 기존 detail API로 본문을 지연 조회하며, UI가 SQLite 또는 다른 persistence layer를 직접 조회하지 않는다. ← ASR-025; ASR-014

- C-003: UI는 traffic의 실시간 streaming transcript, 자동 refresh, stream replay, event-level 영구 저장을 제공하지 않는다. 오른쪽 `TrafficView`는 저장된 final/partial aggregate를 표시한다. ← ASR-002; ASR-023

- C-004: UI는 provider가 보고하지 않은 cost를 추정하지 않고 서버가 제공한 null/partial 상태를 그대로 표시한다. summary 계산 규칙을 component에서 재구현하지 않는다. ← ASR-020; ASR-030

- C-005: UI는 API key, secret, raw unredacted header를 직접 보유하거나 표시하지 않는다. content viewer는 저장된 bounded content만 처리하고 저장 한도를 우회해 원본을 재요청하지 않는다. ← ASR-004; C-005 of `spec/llm-proxy-turn-management.md`

- C-006: UI component는 API 호출 책임을 가지지 않는다. API 호출은 `src/ui/data-query/`에 두며, `TrafficPage`는 이를 조합하고 presentational component에는 data와 callback을 전달한다.

- C-007: `TurnView`와 `TrafficView`는 서로의 상세 표시 책임을 중복 구현하지 않는다. TurnView는 turn projection과 child selection을, TrafficView는 lazy traffic detail과 content viewer를 소유한다.

- C-008: UI 상태에서 server projection 값과 presentation state를 구분한다. server projection에는 turn/traffic selection, summary, metadata가 포함되고, viewer mode/language 같은 presentation state는 현재 viewer instance 범위에만 둔다. ← ASR-031

- C-009: 화면의 텍스트와 상태 표시는 운영자가 loading/empty/error/completed/failed/in_progress를 식별할 수 있어야 하며, 상태 enum을 임의의 새로운 lifecycle 의미로 변환하지 않는다.

## Current Implementation Baseline

| UI contract | Current implementation | Status |
|---|---|---|
| Sidebar tree | `TurnTree` in `TrafficPage` | implemented |
| All/Flagged filter and turn pagination | `fetchTurns(page, limit, filter)` | implemented |
| URL selection | `turn` / `traffic` query parameters | implemented |
| Exclusive right-side view | `TurnView` or `TrafficView` | implemented |
| Turn summary and child selection | `TurnView` | implemented |
| Lazy traffic detail | `TrafficView` → `LogDetail` → `ContentViewer` | implemented |
| Independent traffic detail loading/error | `TrafficPage` state + `TrafficView` | implemented |
| Turn title/flag/delete actions | `TurnTree` callbacks | implemented |
| Traffic title editing | No traffic rename action is exposed in `TurnTree` | gap against parent management Spec |
| Safe content viewer | `ContentViewer` adapter | implemented |
| Responsive sidebar/content layout | `styles.css` media query | implemented |
| Automated UI-specific exclusive-view assertions | not yet isolated as a dedicated test inventory | follow-up verification |

## Out of Scope

- Proxy routing, provider authentication, SSE transport, turn grouping semantic, SQLite schema, migration, and persistence implementation.
- New turn/traffic API contract or server-side summary/usage calculation rules.
- User authentication, RBAC, multi-user sharing, cross-tab preference synchronization.
- Real-time streaming transcript, automatic refresh, replay, chart, alert, full-text search, and billing UI.
- UI redesign unrelated to the turn/traffic navigation and content inspection contract.
- Browser end-to-end test framework adoption unless a later implementation sprint explicitly scopes it.

## Open Questions

- 없음. UI의 현재 view 분리와 state contract는 본 문서에서 고정한다. 별도 browser E2E framework 도입은 out of scope이며, 현재는 `npm run build`, `npm run verify`, 기존 viewer/turn verification과 source-level acceptance를 사용한다.

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
