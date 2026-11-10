# Verification: Turn 관리·분석 UI — Sprint 14

**Spec:** `spec/llm-proxy-turn-management.md` §R-007–R-019, `spec/llm-proxy-ui.md` §R-021–R-022, Constraints C-004–C-008
**Scope:** PB-028 안전한 형식별 traffic content viewer 및 PB-029 통합 검증·실행 문서, sidebar 관리 delta
**Verified:** 2026-03-10
**Commands:** `npm run build`; `npm run verify`; `npm run native:check`; `npm run dev`/`npm start` native binding ensure hooks
**Result:** pass

## Evidence

- `src/ui/data-query/content-viewer.ts` implements the required detection order: content hint, JSON parse, constrained Markdown detection, curated `highlight.js` language candidate, and plain-text fallback. JSON object/array values are normalized without losing nested request/response fields.
- `src/ui/components/ContentViewer.tsx` routes all content through one adapter and provides `Auto`, `JSON`, `Markdown`, `Code`, and `Plain text` controls. The adapter normalizes both JSON strings and already-parsed object/array API values before rendering, preserving request `headers`/`body` and response object fields.
- JSON is rendered through `@uiw/react-json-view` with clipboard disabled; Markdown uses `react-markdown` + `remark-gfm` + `rehype-sanitize` without `rehype-raw`; code uses local `monaco-editor` workers through `@monaco-editor/react` with `readOnly`, `domReadOnly`, disabled context menu, and curated languages.
- `ContentViewer` does not use `dangerouslySetInnerHTML`, `eval`, `new Function`, or iframe rendering. Raw content is passed only to the selected safe viewer or escaped React `<pre>` output.
- `LogDetail` uses a separate keyed viewer for request, response, and error fields. The key includes traffic ID and field name, so mode/language state resets on traffic change and is not stored in URL, server, or localStorage.
- Full content is retained in the viewer; the `<details>` control only changes visibility. `utf8ByteLength` and the fixture verify the 1,048,576 UTF-8 byte boundary without character/line truncation.
- `scripts/verify-viewer.ts` covers JSON precedence, invalid JSON fallback, Markdown detection, plain-text fallback, curated language override, unsupported language fallback, UTF-8 size boundary, object-valued request/response normalization, sanitization/read-only static safety checks, and field-scoped reset.
- `package.json` exposes `dev:watch`, which runs `tsx watch src/server.ts` and `vite build --watch` together through `scripts/dev-watch.mjs`; `native:ensure` runs the approval/rebuild path only when `better-sqlite3` cannot be loaded.
- `scripts/verify-turn.mjs` verifies the sidebar interaction contract: turn action order, backgroundless compact pagination controls, All/Stored filter labels and active-state wiring, page trash action, turn-only `rename`/`delete` menu, absence of traffic management actions, initial expansion/selection logic, per-turn traffic numbering with custom-title precedence, and transactional unflagged-page deletion with flagged preservation.
- `TurnView` renders the requested turn summary without a separate turn heading, labels it `Turn <turn title> summary`, formats cost to four decimal places and token/time values with thousands separators, and orders fields as status/model/provider/cost/input/cached input/output/elapsed time. Its traffic table uses (`Traffic`, `Input tokens`, `Cached input tokens`, `Output tokens`, `Elapsed time`, `Cost`) and the same title-or-parent-index rule as the sidebar.
- TurnView now separates summary, request/response content, and traffic table sections. Request/Response headings are removed; request and response use the traffic detail `ContentViewer` object path, are separated by a divider, and long scalar request strings use a shortened preview with popup full view.
- `TrafficView` labels its summary `Turn <turn title>/Traffic <traffic display value> summary` and uses the same field order and number formatting. Turn response content reuses `ContentViewer` with Markdown hint for plain text while preserving JSON object/array tree and long-string popup behavior; JSON content itself is not number-formatted.
- `SqliteTrafficLogStore` extracts turn request/response messages from the first/last traffic using the Responses, Chat Completions, and Messages API-specific role/content rules while retaining legacy simple `input`/`output_text` compatibility.
- `SqliteTrafficLogStore.deleteUnflaggedTurnsOnPage` selects the same server-side page ordering as the tree query, deletes only flag=0 rows in one transaction, cascades child traffic, and includes displayed legacy nodes.
- `ProxyService` keeps the request body receive limit and error-string bound, but no longer applies `bounded()` to persisted request JSON or aggregated response JSON. `scripts/verify.mjs` stores a 3,500-character request field and 5,000-character response field with `maxBodyBytes: 4096`, then parses and checks their complete lengths.

## Results

| Requirement | Status | Evidence |
|---|---|---|
| R-007 | pass | `ContentViewer.tsx`, dependency lockfile, and production build |
| R-008 | pass | `content-viewer.ts`, `verify-viewer.ts` |
| R-009 | pass | mode/language controls, curated list, keyed field instances |
| R-010 | pass | untruncated source rendering, complete request/response persistence beyond `maxBodyBytes`, `<details>` visibility only, UTF-8 fixture |
| R-011 | pass | sanitizer plugin, no raw HTML renderer, Monaco read-only options, static safety assertions |
| R-012 | pass | adapter returns detected mode, selected mode, language, and fallback reason |
| C-004 | pass with noted cost | React 19-compatible build succeeds; local Monaco worker assets are emitted. Production output includes a large Monaco bundle and emits the existing npm audit warning of 5 vulnerabilities; no dependency was force-upgraded blindly. |
| C-005 | pass | no external content fetch or re-save path; viewer consumes only bounded API fields |
| R-014 | pass | `TurnTree.tsx` renders text-first rows, ordered turn controls, turn-only overflow menu, and traffic rows without management actions |
| R-015 | pass | `TrafficPage.tsx` selects the first loaded turn when URL selection is absent; `TurnTree.tsx` expands only the first initial node and preserves later local state |
| R-016 | pass | `TurnTree.tsx` uses compact icon/title columns, left-aligned titles, right-aligned menu, backgroundless left/right triangle pagination, reduced page label, backgroundless trash icon, smaller flag icon, English `rename`/`delete` menu labels, and `TrafficPage.tsx` exposes All/Stored with `aria-selected` |
| R-017 | pass | Page trash calls the server-side bulk endpoint; persistence re-evaluates the page in one transaction, preserves flagged rows, cascades unflagged turn traffic, and reloads the current query |
| R-018 | pass | `TurnTree.tsx` uses each parent turn's child array index for the fallback display number, keeps custom traffic titles first, and leaves persisted global sequence values unchanged |
| Turn page delta | pass | `TurnView` matches sidebar traffic labels, displays the Traffic summary fields with turn-wide usage totals, renders the requested summary title/order/number formatting, reuses the safe response viewer, and renders the requested six-column traffic table. API-specific summary extraction is implemented in `SqliteTrafficLogStore`. |
| Summary presentation delta | pass | `TrafficView` and `TurnView` use the requested title formats, status/model/provider/cost/input/cached input/output/elapsed order, four-decimal cost, and comma-separated token/time values. `npm run build` and `npm run verify` pass. |
| Turn request/response section delta | pass | `TurnView` has independent summary/content/table sections, no Request/Response headings, a divider between viewer objects, and compact-string request preview with popup full view. Source-level checks and `npm run verify` pass. |
| C-007 | pass | traffic title/delete controls and traffic metadata mutation wiring are absent from the sidebar |
| C-008 | pass | bulk deletion uses the application service and persistence transaction rather than repeated UI-level deletes |
| PB-029 regression | pass | existing `verify.mjs`, `verify-turn.mjs`, and `verify-viewer.ts` all pass |

## Build output note

The local-worker Monaco configuration avoids a runtime CDN dependency, but increases the production output to approximately 4.76 MB minified (approximately 1.27 MB gzip) plus worker assets. This is a documented performance trade-off of the approved Monaco viewer choice, not a correctness or safety failure. Further code-splitting can be planned separately if bundle budget becomes a product requirement.

## Verification command output

- `npm run build`: pass; Vite production build and TypeScript compilation completed.
- `npm run verify`: pass; native binding approval/rebuild, complete request/response JSON persistence checks beyond `maxBodyBytes`, existing proxy regression, turn grouping/metadata/filter/summary regression, viewer-specific checks, and unflagged current-page deletion checks completed.
- `npm run dev` and `npm start`: `predev`/`prestart` invoke the same native binding approval/rebuild before loading the server.
