# AGENTS.md — LLM Proxy Server

## Repository structure

LLM 클라이언트와 Provider 사이의 요청을 중계하고 SQLite traffic log와 React monitoring UI를 제공하는 단일 프로세스 localhost 애플리케이션이다.

```text
llm-proxy-server/
├── src/             # server bootstrap, domain, application, API, persistence, and UI source
├── ui/              # Vite entry document
├── scripts/         # integration verification
├── spec/            # requirements and feature specs
├── scrum/           # backlog and sprint records
├── adr/             # architecture decisions
└── verification/    # verification records against the Spec
```

`src/server.ts`가 `config.json` 기반 configuration, persistence, application, API route를 조립하며 UI는 `src/ui/`에서 빌드되어 Fastify static delivery로 제공된다.

## Working principles

1. 구현과 검증의 SSOT는 관련 승인 Spec이며, 구조 변경은 현재 승인된 sprint Scope 안에서 수행한다.
2. API key와 secret은 `config.json`에 저장하지 않고 `apiKeyEnv`가 지정한 process environment에서만 읽는다. 로그·오류 응답·UI에 평문으로 기록하지 않는다.
3. `maxBodyBytes`는 request body 수신 한도다. 저장 request/response JSON은 헤더 마스킹 및 response aggregate 후 잘라내지 않고 전체 보존한다. 오류 문자열은 별도 bounded 정책을 따른다.
4. 변경 후 빌드와 영향 범위에 맞는 통합 검증을 실행하고 결과는 `verification/`에 기록한다.

## Implementation guide

### Module design and structure

- `config.json`: host, port, database path, body limit, provider endpoint, model routing, provider auth mode runtime 설정
- `src/server.ts`: Fastify bootstrap, configuration loading, dependency assembly, listen/shutdown lifecycle
- `src/configuration.ts`: config.json loading, validation, apiKeyEnv secret resolution, and provider auth mode validation
- `src/domain/`: traffic log types, turn grouping lifecycle and semantic contract, turn note contract, writer/reader ports, redaction and size policies
- `src/application/proxy-service.ts`: common routing, auth, provider I/O, logging, and SSE orchestration; depends on `TrafficLogWriter`
- `src/application/proxy-adapters/`: API-specific route path, traffic-log kind, provider endpoint mapping, streaming completion detectors, and usage/cost parsing; `ProxyAdapter` is the shared base for Responses, Chat Completions, and Messages
- `src/application/turn-analysis-adapters/`: API-specific completed-turn analysis adapters; these consume turn data and return note analysis without direct SQLite access
- `src/application/turn-analysis-service.ts`: completion-triggered asynchronous analysis orchestration, adapter selection, pending recovery, idempotency, and note result persistence
- `src/application/log-query-service.ts`: UI/API log and turn-tree query use cases; depends on `TrafficLogReader`
- `src/api/routes.ts`: HTTP route and payload adapter, including `/api/v1/turns`, turn/traffic metadata mutation, and turn deletion; depends on application services, not SQLite
- `src/persistence/sqlite-traffic-log.ts`: SQLite schema, traffic turn metadata, `turn_notes` projection, turn store, and writer/reader adapter
- `src/ui/data-query/`: browser-side HTTP query functions only; log and turn-tree API URL, query parameters, metadata mutation, deletion, and response/error mapping live here
- `src/ui/pages/`: page-level state and use-case composition; `TrafficPage` coordinates filters, turn selection, URL state, data-query, and presentational components
- `src/ui/components/`: reusable presentation and user-input components, including `TurnTree` and the safe Markdown `NoteCard`; components do not call the API directly
- `src/ui/types.ts`: shared UI view-model and filter types
- `src/ui/main.tsx`: React bootstrap only
- `src/ui/styles.css`: shared UI styling

The current Traffic page is split into `pages/TrafficPage.tsx`, `components/Filters.tsx`, `components/LogTable.tsx`, `components/LogDetail.tsx`, `components/TurnTree.tsx`, and `data-query/log-api.ts`. `ui/index.html` is the Vite entry document and loads `src/ui/main.tsx`; it is not a second UI implementation. Add future analysis/report/chart features as separate page or feature modules; do not place their data fetching or state into `TrafficPage` or `main.tsx`.

Application code depends on domain ports; the SQLite adapter is the concrete persistence implementation. The proxy application service depends on `TrafficLogWriter`, `TurnStore`, and the generic `ProxyAdapter` contract; turn grouping lifecycle and the `TurnSemantic` contract live in `src/domain/turn.ts`, while API-specific semantic implementations and SSE aggregation remain isolated in `src/application/proxy-adapters/`. Traffic rows carry turn ID, observation sequence, and fallback metadata; the turn table carries lifecycle state and traffic count. `TrafficLogQueryService` depends only on `TrafficLogReader`. Route handlers contain no SQL statements or SQLite imports.

### How to implement

1. Keep API namespace under `/api/v1`, preserve raw hijacked response handling for SSE, and keep turn tree payloads body-free so traffic detail remains lazy.
2. Keep application TypeScript/TSX/CSS under `src/`; root `ui/` contains only Vite's entry HTML and is required by `vite.config.ts` as the build input.
3. Runtime settings belong in root `config.json`; only secret values may come from environment variables named by `apiKeyEnv`. Provider auth defaults to Bearer; native Anthropic mode requires `anthropicVersion` and sends `x-api-key` plus `anthropic-version`.
4. Run `npm run build` after structural changes and `npm run verify` for proxy, SSE, persistence, redaction, or UI changes.
5. Keep UI imports directed inward: pages may import data-query and components; components must remain API-agnostic; `main.tsx` only bootstraps the selected page.

## Verification guide

`npm run build` validates the Vite UI build and TypeScript server compilation. `npm run verify` creates a temporary config.json and secret environment values, starts mock Providers and a temporary proxy/SQLite instance, validates the UI entrypoint, routing, persistence, masking, model rejection, turn grouping/fallback fixtures, tree query projection, SSE aggregate persistence, detail lookup, the standalone turn metadata/filter/cascade fixture in `verify-turn.mjs`, the API-specific turn note adapter/projection/idempotency fixture in `verify-turn-notes.mjs`, and the safe content viewer fixture in `verify-viewer.ts`. Verification records map evidence to `spec/llm-proxy-server.md`, `spec/llm-proxy-turn-traffic.md`, `spec/llm-proxy-turn-management.md`, and the current approved feature Spec requirement IDs.

## Notes

- `TurnGroupingService` creates a new turn for the first traffic, keeps open turns indexed by unresolved tool identity, and stores global observation sequence on each traffic row.
- `SqliteTrafficLogStore.listTurns` projects stored turns plus metadata-free legacy traffic into deterministic, paginated tree nodes; request/response bodies remain available only through the existing log detail API. Turn and traffic title/flag metadata are stored separately, and turn deletion cascades child traffic in one SQLite transaction.
- `TrafficPage` stores turn and traffic selection in `turn`/`traffic` URL query parameters and listens for browser history changes; tree loading errors are surfaced without removing the existing flat log path.
- `@fastify/static` serves `dist/ui`; the Vite input is root `ui/index.html`, which loads `src/ui/main.tsx`, and the SPA fallback uses the generated `ui/index.html` path.
- `better-sqlite3` is a native dependency. `npm run dev` and `npm start` check whether the binding loads and only run the approval/rebuild path when it is unavailable; `npm install` alone may still require approval/rebuild in restricted npm environments. `npm run dev:watch` watches the server through `tsx` and rebuilds the Vite UI with `vite build --watch`; stop either watcher with Ctrl+C.
- Sprint 13 PB-025 added title/flag metadata migration, turn/traffic PATCH routes, turn DELETE cascade, and basic TurnTree metadata actions. PB-026 now adds server-side all/flagged turn filtering, turn pagination, and UI mutation refresh/page correction. PB-027 now projects server-side turn summary, usage/cost totals, null/partial state, and UI summary display; execution environment remains null when no stored source field exists.
- Sprint 14 PB-028 adds the shared safe content viewer adapter, JSON/Markdown/Monaco/plain-text viewers, curated mode/language override, local Monaco workers, and field-scoped presentation state. PB-029 adds `verify-viewer.ts` and `verification/llm-proxy-turn-management.md`; `npm run verify` now covers the viewer and the existing regression suite.
- Sprint 14 sidebar refinement keeps TurnTree text-first like a file explorer: turn rows expose collapse/expand, flag, title, and a turn-only overflow menu; traffic rows are selectable text without metadata actions. The initial loaded page selects the first turn and expands only that turn.
- Sprint 16 adds `turn_notes` as a derived projection. Completed turns enqueue analysis after lifecycle completion; `TurnAnalysisService` recovers pending rows at startup and uses version 1 for the `turn_id + analysis_version` idempotency key. The current adapter renderer emits deterministic Markdown and does not call an LLM. `scripts/verify-turn-notes.mjs` covers Responses, Chat Completions, Messages, empty notes, projection persistence, and duplicate enqueue idempotency.
- Content viewer inputs are normalized at the UI boundary: request/response fields may arrive as JSON strings or already-parsed object/array values, and both forms must render through the same JSON tree path so `headers`/`body` and nested values are not lost.
- Turn/Traffic summary presentation uses title-qualified headings, status/model/provider/cost/input/cached input/output/elapsed ordering, four-decimal costs, and comma-separated token/time values. TurnView renders summary, request/response, and traffic table as independent cards. Turn request/response content has no separate Request/Response headings; viewer objects retain `request:`/`response:` labels, simple strings render as JSON string scalars, and long scalar values on either side use JSON preview plus the same safe popup viewer as traffic detail.
