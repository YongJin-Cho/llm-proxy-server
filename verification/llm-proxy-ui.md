# Verification: LLM Proxy Monitoring UI

**Spec:** `spec/llm-proxy-ui.md` (with `spec/llm-proxy-server.md`, `spec/llm-proxy-turn-traffic.md`, and `spec/llm-proxy-turn-management.md` UI contracts)
**Artifact(s):** `src/ui/`, `scripts/verify.mjs`, `scripts/verify-turn.mjs`, `scripts/verify-viewer.ts`
**Verified:** 2026-03-10
**Commands:** `npm run verify`; TypeScript/TSX diagnostics for the reviewed UI modules
**Summary:** 32 pass, 4 partial, 1 fail, 0 not-verifiable

## Scope

This audit covers the complete UI Spec (`spec/llm-proxy-ui.md`) and the UI-facing requirements from the turn-traffic and turn-management Specs. Server/API regression was also run through the project's required `npm run verify` entrypoint; this report does not replace the separate server and turn-traffic verification records.

## Inventory & Results

| # | Spec item | Status | Evidence / Notes |
|---|---|---|---|
| 1 | UI R-001 | pass | `src/ui/main.tsx`, `TrafficPage.tsx`, `components/`, and `data-query/` preserve bootstrap → page → component/query boundaries; no SQLite import in UI. |
| 2 | UI R-002 | pass | `TrafficPage.tsx` consumes `fetchTurns`; `TurnTree.tsx` renders turn/child nodes and does not receive bodies from the tree projection. |
| 3 | UI R-003 | pass | `fetchTurns(page, limit, filter)` sends server filter/pagination; mutation handlers reload the current query and `loadTurns` backs an empty page down. |
| 4 | UI R-004 | pass | `TrafficPage.tsx` stores `turn`/`traffic` in URL query parameters, initializes from URL, and handles `popstate`; content is not stored in URL. |
| 5 | UI R-005 | pass | `TrafficPage.tsx` renders exactly `TrafficView` for traffic selection and `TurnView` otherwise. |
| 6 | UI R-006 | partial | `TurnView.tsx` displays title, status, count, model, duration, usage/cost, partial, input, and output from server projection, but does not display `execution_environment` or model provider in the turn summary. |
| 7 | UI R-007 | pass | `TurnView.tsx` renders child traffic summary rows and routes selection with both turn and traffic IDs. |
| 8 | UI R-008 | pass | `TrafficPage.tsx` lazily calls `fetchLog` only for traffic selection; `TrafficView` delegates request/response/error display to `LogDetail`. |
| 9 | UI R-009 | pass | Detail loading/error/back states are local to `TrafficView`; tree state remains rendered by the page. |
| 10 | UI R-010 | pass | Tree loading/error/empty and turn/traffic loading/empty/error states have explicit UI branches and labels. |
| 11 | UI R-011 | pass | `TurnTree.tsx` provides turn title, flag, confirmation-backed turn deletion, and suppresses deletion for legacy nodes. |
| 12 | UI R-012 | pass | `ContentViewer.tsx` uses a container-first JSON tree for request/response objects/arrays and a safe fallback for invalid JSON. |
| 13 | UI R-013 | pass | `JsonContainerNode` gives string leaves a bounded preview and opens only the selected string in `PopupViewer`. |
| 14 | UI R-014 | pass | `content-viewer.ts` implements hint → JSON → constrained Markdown → curated language → plain-text detection; popup controls provide Auto/JSON/Markdown/Code/Plain text. |
| 15 | UI R-015 | pass | Browser calls are in `src/ui/data-query/log-api.ts`; UI components do not import server or SQLite modules. |
| 16 | UI R-016 | pass | UI consumes persisted API fields; no secret header or credential display path is present. Existing integration verification covers redaction. |
| 17 | UI R-017 | pass | `styles.css` uses a two-column desktop layout and one-column narrow-screen fallback with overflow handling. |
| 18 | UI R-018 | partial | `npm run verify` and `verify-viewer.ts` pass, but the required UI interactions are not browser-level reproduced: no automated assertion covers browser back/forward, exclusive rendered view, collapse/expand, popup open/close, or live mutation refresh. |
| 19 | UI R-019 | pass | `TurnTree.tsx` maintains per-node collapse state and independent collapse/flag buttons. |
| 20 | UI R-020 | pass | `TurnTree.tsx` places `Turns` and pagination in the same header row; CSS provides narrow-screen wrapping behavior. |
| 21 | UI R-021 | pass | `TurnView.tsx` table displays sequence/title fallback, model, provider, input/cached/output tokens, cost, and latency with null fallback. |
| 22 | UI R-022 | partial | `TurnView.tsx` uses server-projected start/end messages and summary usage/cost/duration, but omits provider and `execution_environment` from the displayed summary. |
| 23 | UI R-023 | pass | `TrafficView.tsx` shows stable provider, model, normalized token fields, cost, and latency before `LogDetail`, preserving null display. |
| 24 | UI R-024 | pass | Request/response JSON object trees are read-only and independently rendered; invalid/non-container content uses the safe viewer fallback. |
| 25 | UI R-025 | pass | String leaf popup is read-only, closes back to the tree, and does not mutate source content. |
| 26 | UI R-026 | fail | `PopupViewer` owns `selection` state, but changing `target` to another string leaf does not reset that state because the popup component remains mounted. This violates reset-on-different-leaf and can leak mode/language between string viewers. |
| 27 | Turn-management R-001 (UI surface) | partial | Server/API/persistence support title and flag metadata for both turn and traffic, but `TurnTree.tsx` exposes only turn rename; `updateTrafficMetadata()` is defined in `log-api.ts` but is not called by any UI component. |
| 28 | Turn-management R-003/R-004 | pass | Server filter/pagination is consumed by `TrafficPage`; flag/delete actions reload the current filter/page and empty-page correction is implemented. |
| 29 | Turn-management R-005/R-006 | pass | `TurnView.tsx` consumes server summary/usage/partial projection without recomputing it; current server verification covers summary and normalized values. |
| 30 | Turn-management R-007/R-011/R-012 | pass | `ContentViewer.tsx` uses the selected safe adapters, sanitized Markdown, read-only Monaco, disabled clipboard, and escaped plain text; `verify-viewer.ts` static safety checks pass. |
| 31 | Turn-management R-008/R-009/R-010 | pass | Detection fallback, mode controls, curated languages, field-keyed reset across traffic/field changes, and UTF-8 1 MiB boundary are implemented and fixture-verified. |
| 32 | Turn-management R-013 | pass | `listTurns` and detail projection expose provider/model/normalized usage/cost/latency fields; `TurnView` and `TrafficView` consume them without estimation. |
| 33 | UI C-001–C-007, C-009–C-012 | pass | Module boundaries, no direct persistence access, no raw SSE UI, server-projected values, safe renderers, and provider ID display rules are preserved. |
| 34 | UI C-008 | partial | Server projection and presentation state are separate, but popup mode/language state is not reset when the selected string leaf changes within the same popup instance. |
| 35 | Turn-management C-003–C-006 | pass | Metadata changes route through API/data-query, viewer does not bypass bounded API content, and provider is displayed as a stable ID rather than URL/secret. |
| 36 | Server/turn regression entrypoints | pass | `npm run verify` passed UI entrypoint, three API routes, routing, usage/cost, redaction, turn grouping, metadata/filter/cascade, and viewer checks. Reviewed UI module diagnostics reported no errors. |

## Design Review Notes

- The production build succeeds, but Vite reports a large Monaco-related bundle (`index` approximately 4.64 MB minified / 1.23 MB gzip plus worker assets). This is a documented performance trade-off in `verification/llm-proxy-turn-management.md`, not a functional pass for a bundle-budget requirement because no such budget is specified.
- The current automated verification is primarily integration, source-level, and adapter-level. It does not prove actual browser event wiring or visual responsive behavior; those remain test-coverage limitations rather than an assertion that the interactions are broken.
- The existing UI Spec Current Implementation Baseline is stale for collapse/expand, header pagination, summary table, and popup viewer: the reviewed source now implements those items. The baseline should be updated in a later documentation sync, but it was not used as the pass/fail authority.

## Deviations (Non-compliance)

1. **UI R-026 / UI C-008 — Critical/Major:** popup viewer mode/language state can carry from one JSON string leaf to another. `PopupViewer` should reset its local selection when `target.path` or the target value changes, or be keyed by the selected leaf at the call site.
2. **Turn-management R-001 and PRD Delta UI scope — Major:** traffic title editing is not exposed in the UI. The API/data-query function exists, but `TurnTree` only exposes turn rename and no traffic rename action.
3. **UI R-006/R-022 — Major:** turn summary omits provider and execution environment display required by the approved UI contract. The server currently projects `execution_environment: null`; the UI should still display the defined null value rather than omit the field.
4. **UI R-018 — Major test-coverage gap:** required browser interactions are not automatically reproduced. `npm run verify` passing is insufficient evidence for those interaction-level acceptance criteria.

## Undocumented ASRs (Specification Gaps)

None identified. The findings are implementation/test-coverage deviations from explicit Spec requirements, not new architectural decisions.

## Recommended Next Steps

- Route the listed deviations through the feedback loop before declaring the UI Spec fully compliant.
- First fix popup leaf state isolation and add a focused regression assertion.
- Then add traffic title editing and turn summary provider/environment fields.
- Add browser-level UI tests only if the user chooses to close the R-018 verification-coverage gap; the UI Spec does not currently mandate a specific browser test framework.
