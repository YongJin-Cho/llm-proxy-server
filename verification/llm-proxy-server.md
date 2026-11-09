# Verification: LLM Proxy Server

**Spec:** `spec/llm-proxy-server.md`
**Scope:** Sprint 08 multi-API routes, provider auth mode, api_kind/usage/cost persistence, and regression; prior Sprint 05–06 behavior remains covered
**Verified:** 2026-03-10
**Commands:** `npm run build`; `npm run verify`
**Summary:** Sprint 08 implementation slice currently passes build and expanded non-streaming integration verification. Streaming demo and final Sprint completion evidence remain open on the live board.

## Sprint 08 Evidence

- `npm run build`: pass.
- `npm run verify`: pass.
- Expanded verification covers `/api/v1/responses`, `/api/v1/chat/completions`, `/api/v1/messages`, provider path mapping, `api_kind`, normalized usage, provider-reported `cost_usd`, redaction, unknown model rejection, and existing Responses regression.
- Streaming completion/error demo passed in `TODO.md` T-007 using API-specific sentinel fixtures and transparent SSE response checks.
- T-010 refactoring preserves the same verification evidence while isolating API-specific behavior in `src/application/proxy-adapters/`.

## Inventory & Results

| Spec item | Status | Evidence / Notes |
|---|---|---|
| R-001 | pass | `src/server.ts` owns Fastify bootstrap/lifecycle; `config.json` supplies host/port; APIs and static UI run in one process. |
| R-017–R-018 | pass | `src/api/routes.ts` registers three public routes; route suffix maps to provider baseUrl; auth mode verification covers Bearer and Anthropic native headers. |
| R-019 | pass | `src/application/proxy-service.ts` applies API-specific completion detectors; verify covers Responses/[DONE], Chat Completions/[DONE], and Messages/message_stop with transparent SSE body. |
| R-020–R-022 | pass | SQLite migration adds `api_kind` and nullable normalized usage/cost columns; verify covers legacy-compatible defaults, API kind, usage normalization, provider USD cost, and absent cost as NULL. |
| R-002–R-005 | pass | `src/application/proxy-service.ts` forwards Responses requests through resolved provider/model routes and preserves provider/network error and SSE failure handling. |
| R-006–R-008 | pass | `src/domain/traffic-log.ts` defines shared model and writer/reader ports; proxy depends on writer, query service on reader, and `src/persistence/sqlite-traffic-log.ts` owns schema and adapter. |
| R-009 | pass | `src/api/routes.ts` adapts HTTP routes; provider routing remains in the application service and persistence is reached through ports. |
| R-010–R-011 | pass | React UI remains API-backed and supports log list/detail/filter/pagination; stored redaction is displayed. `src/ui` separates `data-query`, `pages`, and reusable `components`; the UI entrypoint is served by the single process. |
| R-012 | pass | `config.json` contains `providers` and `models`; `src/configuration.ts` loads base URLs and provider/model mapping. No `.env`, `PROVIDER_URL`, or `PROVIDER_API_KEY` path remains. |
| R-013 | pass | `src/configuration.ts` validates host, port, databasePath, maxBodyBytes, providers, models, provider references, and required `apiKeyEnv` secrets before bootstrap. Unknown models are rejected before provider fetch. |
| R-014 | pass | Configuration, domain, application, API, persistence, and delivery boundaries remain explicit while preserving the existing proxy flow. |
| R-015 | pass | `npm run verify` passed two-provider routing, provider model mapping, unknown model rejection, secret handling, SQLite persistence, masking, and read/write boundary checks. |
| R-016 | pass | `README.md` and `AGENTS.md` document root `config.json`, `apiKeyEnv` secret loading, SQLite path, host/port, build/start, and verification procedures. |
| C-004 | pass | Authorization and other known secret headers are redacted before persistence; body limits come from `config.json`. |
| C-006 | pass | Single-process Fastify/React structure and internal module boundaries are preserved. |
| C-007 | pass | Provider API key values are read only from the process environment variable named by `apiKeyEnv`; they are not stored in `config.json` and are not logged or returned. |
| C-008/C-009 | pass | Fastify/React remain the approved frameworks; invalid configuration prevents server listen, and SQLite initialization remains in bootstrap before listen. |

## Sprint 06 UI Structure Review

- `src/ui/data-query/log-api.ts` owns browser HTTP calls and API error mapping.
- `src/ui/pages/TrafficPage.tsx` owns traffic-page state, filtering, pagination, and detail navigation.
- `src/ui/components/Filters.tsx`, `LogTable.tsx`, and `LogDetail.tsx` own presentation and user input; they do not call the API.
- `src/ui/main.tsx` is a bootstrap-only entrypoint.
- Future analysis/report/chart features should use separate feature/page modules rather than adding state and data fetching to `TrafficPage`.
- `npm run build` passed after extraction. `npm run verify` passed with an explicit `/` UI entrypoint assertion plus existing routing, masking, and persistence checks.

## Design Review Notes

- Verification uses a temporary `config.json` while keeping secret values in process environment variables. The script restores the repository's default `config.json` in `finally`.
- Runtime configuration is intentionally file-based. Environment variables are not used for host, port, database path, body limit, or provider URL.

## Deviations (Non-compliance)

None found for the Sprint 05 implementation slice.

## Undocumented ASRs (Specification Gaps)

None identified. The temporary verification configuration and restoration strategy is test harness behavior and does not change the runtime contract.

## Evidence

- `npm run build`: Vite production build and TypeScript compilation passed.
- `npm run verify`: `Routing verification passed: two providers, provider model mapping, unknown model rejection, secret handling, and read/write boundaries.`
- `config.json`: default runtime configuration with `host`, `port`, `databasePath`, `maxBodyBytes`, provider `baseUrl`/`apiKeyEnv`, and model mappings.
- `src/configuration.ts`: file loading and startup validation implementation.
- `README.md` / `AGENTS.md`: configuration and execution documentation aligned with the Spec.
