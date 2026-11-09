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

`src/server.ts`가 configuration, persistence, application, API route를 조립하며 UI는 `src/ui/`에서 빌드되어 Fastify static delivery로 제공된다.

## Working principles

1. 구현과 검증의 SSOT는 `spec/llm-proxy-server.md`이며, 구조 변경은 현재 승인된 sprint Scope 안에서 수행한다.
2. API key와 secret은 로그·오류 응답·UI에 평문으로 기록하지 않는다.
3. 변경 후 빌드와 영향 범위에 맞는 통합 검증을 실행하고 결과는 `verification/`에 기록한다.

## Implementation guide

### Module design and structure

- `src/server.ts`: Fastify bootstrap, dependency assembly, listen/shutdown lifecycle
- `src/configuration.ts`: environment configuration and validation
- `src/domain/`: traffic log types, writer/reader ports, redaction and size policies
- `src/application/proxy-service.ts`: provider request/response and SSE orchestration
- `src/api/routes.ts`: HTTP route and payload adapter
- `src/persistence/sqlite-traffic-log.ts`: SQLite schema and writer/reader adapter
- `src/delivery/ui.ts`: UI delivery utility; Fastify static plugin serves built assets
- `src/ui/`: React page, component, data-query, and styles

Application code depends on domain ports; the SQLite adapter is the concrete persistence implementation. Route handlers depend on the proxy application service and reader/writer interfaces rather than SQL statements.

### How to implement

1. Keep API namespace under `/api/v1` and preserve raw hijacked response handling for SSE.
2. Keep source TypeScript/TSX/CSS under `src/`; `ui/` contains only Vite's entry HTML.
3. Run `npm run build` after structural changes and `npm run verify` for proxy, SSE, persistence, redaction, or UI changes.

## Verification guide

`npm run build` validates the Vite UI build and TypeScript server compilation. `npm run verify` starts a mock Provider and a temporary proxy/SQLite instance to validate request forwarding, persistence, masking, filters, pagination, and detail lookup. Verification records map evidence to `spec/llm-proxy-server.md` requirement IDs.

## Notes

- `@fastify/static` serves `dist/ui`; the Vite output currently contains the `ui/index.html` entry path, so the SPA fallback uses `ui/index.html`.
- `better-sqlite3` may require the repository's npm install-script approval/rebuild step in restricted npm environments.
