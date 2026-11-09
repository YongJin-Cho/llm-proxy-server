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

- `config.json`: host, port, database path, body limit, provider endpoint, model routing runtime 설정
- `src/server.ts`: Fastify bootstrap, configuration loading, dependency assembly, listen/shutdown lifecycle
- `src/configuration.ts`: config.json loading, validation, and apiKeyEnv secret resolution
- `src/domain/`: traffic log types, writer/reader ports, redaction and size policies
- `src/application/proxy-service.ts`: provider request/response and SSE orchestration; depends on `TrafficLogWriter`
- `src/application/log-query-service.ts`: UI/API log query use case; depends on `TrafficLogReader`
- `src/api/routes.ts`: HTTP route and payload adapter; depends on application services, not SQLite
- `src/persistence/sqlite-traffic-log.ts`: SQLite schema and writer/reader adapter
- `src/ui/`: React page, component, data-query, and styles

Application code depends on domain ports; the SQLite adapter is the concrete persistence implementation. The proxy application service depends only on `TrafficLogWriter`, while `TrafficLogQueryService` depends only on `TrafficLogReader`. Route handlers contain no SQL statements or SQLite imports.

### How to implement

1. Keep API namespace under `/api/v1` and preserve raw hijacked response handling for SSE.
2. Keep source TypeScript/TSX/CSS under `src/`; `ui/` contains only Vite's entry HTML.
3. Runtime settings belong in root `config.json`; only secret values may come from environment variables named by `apiKeyEnv`.
4. Run `npm run build` after structural changes and `npm run verify` for proxy, SSE, persistence, redaction, or UI changes.

## Verification guide

`npm run build` validates the Vite UI build and TypeScript server compilation. `npm run verify` creates a temporary config.json and secret environment values, starts mock Providers and a temporary proxy/SQLite instance, and validates routing, persistence, masking, model rejection, and detail lookup. Verification records map evidence to `spec/llm-proxy-server.md` requirement IDs.

## Notes

- `@fastify/static` serves `dist/ui`; the Vite output currently contains the `ui/index.html` entry path, so the SPA fallback uses `ui/index.html`.
- `better-sqlite3` may require the repository's npm install-script approval/rebuild step in restricted npm environments.
