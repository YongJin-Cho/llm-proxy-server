# AGENTS.md — LLM Proxy Server

## Repository structure

LLM 클라이언트와 Provider 사이의 요청을 중계하고 SQLite traffic log와 React monitoring UI를 제공하는 단일 프로세스 localhost 애플리케이션이다.

```text
llm-proxy-server/
├── src/             # server bootstrap, domain, application, API, persistence, delivery, UI source
├── ui/              # Vite entry document
├── scripts/         # integration verification
├── spec/            # requirements and feature specs
├── scrum/           # backlog and sprint records
├── adr/             # architecture decisions
└── verification/    # verification records against the Spec
```

`src/server.ts`가 `config.json` 기반 configuration, persistence, application, API route를 조립하며 UI는 `src/ui/`에서 빌드되어 Fastify static delivery로 제공된다.

## Working principles

1. 구현과 검증의 SSOT는 `spec/llm-proxy-server.md`이며, 구조 변경은 현재 승인된 sprint Scope 안에서 수행한다.
2. API key와 secret은 `config.json`에 저장하지 않고 `apiKeyEnv`가 지정한 process environment에서만 읽는다. 로그·오류 응답·UI에 평문으로 기록하지 않는다.
3. 변경 후 빌드와 영향 범위에 맞는 통합 검증을 실행하고 결과는 `verification/`에 기록한다.

## Implementation guide

### Module design and structure

- `config.json`: host, port, database path, body limit, provider endpoint, model routing, provider auth mode runtime 설정
- `src/server.ts`: Fastify bootstrap, configuration loading, dependency assembly, listen/shutdown lifecycle
- `src/delivery/ui.ts`: legacy UI static-serving helper retained for the non-Fastify delivery path; current `src/server.ts` uses `@fastify/static`
- `src/configuration.ts`: config.json loading, validation, apiKeyEnv secret resolution, and provider auth mode validation
- `src/domain/`: traffic log types, turn grouping lifecycle, writer/reader ports, redaction and size policies
- `src/application/proxy-service.ts`: common routing, auth, provider I/O, logging, and SSE orchestration; depends on `TrafficLogWriter`
- `src/application/proxy-adapters/`: API-specific route path, traffic-log kind, provider endpoint mapping, streaming completion detectors, and usage/cost parsing; `ProxyAdapter` is the shared base for Responses, Chat Completions, and Messages
- `src/application/log-query-service.ts`: UI/API log and turn-tree query use cases; depends on `TrafficLogReader`
- `src/api/routes.ts`: HTTP route and payload adapter, including `/api/v1/turns`; depends on application services, not SQLite
- `src/persistence/sqlite-traffic-log.ts`: SQLite schema, traffic turn metadata, turn store, and writer/reader adapter
- `src/ui/data-query/`: browser-side HTTP query functions only; log and turn-tree API URL, query parameters, and response/error mapping live here
- `src/ui/pages/`: page-level state and use-case composition; `TrafficPage` coordinates filters, turn selection, URL state, data-query, and presentational components
- `src/ui/components/`: reusable presentation and user-input components, including `TurnTree`; components do not call the API directly
- `src/ui/types.ts`: shared UI view-model and filter types
- `src/ui/main.tsx`: React bootstrap only
- `src/ui/styles.css`: shared UI styling

The current Traffic page is split into `pages/TrafficPage.tsx`, `components/Filters.tsx`, `components/LogTable.tsx`, `components/LogDetail.tsx`, `components/TurnTree.tsx`, and `data-query/log-api.ts`. `ui/index.html` is the Vite entry document and loads `src/ui/main.tsx`; it is not a second UI implementation. Add future analysis/report/chart features as separate page or feature modules; do not place their data fetching or state into `TrafficPage` or `main.tsx`.

Application code depends on domain ports; the SQLite adapter is the concrete persistence implementation. The proxy application service depends on `TrafficLogWriter`, `TurnStore`, and the generic `ProxyAdapter` contract; turn grouping lifecycle and tool identity extraction live in `src/domain/turn.ts`, while API-specific request/response interpretation remains isolated in `src/application/proxy-adapters/`. Traffic rows carry turn ID, observation sequence, and fallback metadata; the turn table carries lifecycle state and traffic count. `TrafficLogQueryService` depends only on `TrafficLogReader`. Route handlers contain no SQL statements or SQLite imports.

### How to implement

1. Keep API namespace under `/api/v1`, preserve raw hijacked response handling for SSE, and keep turn tree payloads body-free so traffic detail remains lazy.
2. Keep source TypeScript/TSX/CSS under `src/`; `ui/` contains only Vite's entry HTML.
3. Runtime settings belong in root `config.json`; only secret values may come from environment variables named by `apiKeyEnv`. Provider auth defaults to Bearer; native Anthropic mode requires `anthropicVersion` and sends `x-api-key` plus `anthropic-version`.
4. Run `npm run build` after structural changes and `npm run verify` for proxy, SSE, persistence, redaction, or UI changes.
5. Keep UI imports directed inward: pages may import data-query and components; components must remain API-agnostic; `main.tsx` only bootstraps the selected page.

## Verification guide

`npm run build` validates the Vite UI build and TypeScript server compilation. `npm run verify` creates a temporary config.json and secret environment values, starts mock Providers and a temporary proxy/SQLite instance, validates the UI entrypoint, routing, persistence, masking, model rejection, turn grouping/fallback fixtures, tree query projection, SSE aggregate persistence, and detail lookup. Verification records map evidence to `spec/llm-proxy-server.md` and `spec/llm-proxy-turn-traffic.md` requirement IDs.

## Notes

- `TurnGroupingService` creates a new turn for the first traffic, keeps open turns indexed by unresolved tool identity, and stores global observation sequence on each traffic row.
- `SqliteTrafficLogStore.listTurns` projects stored turns plus metadata-free legacy traffic into deterministic, paginated tree nodes; request/response bodies remain available only through the existing log detail API.
- `TrafficPage` stores turn and traffic selection in `turn`/`traffic` URL query parameters and listens for browser history changes; tree loading errors are surfaced without removing the existing flat log path.
- `@fastify/static` serves `dist/ui`; the Vite output currently contains the `ui/index.html` entry path, so the SPA fallback uses `ui/index.html`.
- `better-sqlite3` may require the repository's npm install-script approval/rebuild step in restricted npm environments.
