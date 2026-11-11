# Verification: Turn 완료 후 API별 분석 Note

**Spec:** `llm-proxy-server/spec/llm-proxy-turn-notes.md` (aligned with `spec/PRD.md`)
**Artifact(s):** `src/domain/turn-notes.ts`, `src/application/turn-analysis-service.ts`, `src/application/turn-analysis-adapters/`, `src/persistence/sqlite-traffic-log.ts`, `src/ui/components/NoteCard.tsx`, `src/ui/components/TurnView.tsx`, `scripts/verify-turn-notes.mjs`
**Verified:** 2026-03-10
**Summary:** 22 pass, 0 fail, 0 partial, 0 not-verifiable

## Inventory & Results

| # | Spec item | Status | Evidence / Notes |
|---|-----------|--------|------------------|
| 1 | R-001 | pass | `src/application/proxy-service.ts` enqueues analysis only after completed turn persistence; `scripts/verify-turn-notes.mjs`; `npm run verify` passed. |
| 2 | R-002 | pass | `TurnAnalysisService` uses `TurnAnalysisPersistence.getTurnForAnalysis`; SQLite store builds input from stored turn traffic. |
| 3 | R-003 | pass | `src/application/turn-analysis-adapters/` has independent Responses, Chat Completions, and Messages adapters selected by `api_kind`. |
| 4 | R-004 | pass | `src/domain/turn-notes.ts` extracts tool call/use/call/result structures from API response/request aggregates; three API fixtures pass. |
| 5 | R-005 | pass | Adapter output is `TurnNote[]` with title and deterministic Markdown content; no LLM call exists in the analysis path. |
| 6 | R-006 | pass | `turn_notes` schema stores status, JSON notes, version, error/retry metadata and timestamps. |
| 7 | R-007 | pass | `turn_id + analysis_version` composite key and `INSERT OR IGNORE`/update path prevent duplicate projection results. |
| 8 | R-008 | pass | Projection uses canonical `pending`, `ready`, `empty`, `failed`; empty fixture returns empty status. |
| 9 | R-009 | pass | Failed results are bounded and redacted at projection write; `note_unavailable` is represented; startup recovers pending and retryable failed rows. |
| 10 | R-010 | pass | `listTurns` joins note projection into existing turn aggregate without adding request/response bodies to tree traffic summaries. |
| 11 | R-011 | pass | `NoteCard` is rendered after the traffic summary table; each note is an independent card, common title/status are omitted, and an empty note array renders no card. |
| 12 | R-012 | pass | Note content uses `react-markdown` with `rehype-sanitize`; no manual retry control is rendered. |
| 13 | R-013 | pass | `scripts/verify-turn-notes.mjs` covers all three API fixtures, empty state, projection persistence, idempotency, independent note cards, omitted status/header, and full-width layout; existing `verify`, turn, and viewer suites pass. |
| 14 | C-001 | pass | Analysis adapters receive turn data through service/persistence contract and do not import SQLite. |
| 15 | C-002 | pass | Existing proxy adapter, grouping, SSE aggregate, and traffic lifecycle paths remain in place; existing regression suites pass. |
| 16 | C-003 | pass | API-specific extraction is contained in the analysis adapter layer; no provider call or API canonical payload conversion is introduced. |
| 17 | C-004 | pass | Analysis version is explicit and initialized to version 1; composite key enforces one result per turn/version. |
| 18 | C-005 | pass | Error messages are bounded; note content is rendered through sanitized Markdown and no secret source is used. |
| 19 | C-006 | pass | No LLM summary call, note editing/search, streaming intermediate notes, or manual retry UI was added. |

## Design Review Notes

- The implementation uses the existing SQLite process and a microtask-backed service worker rather than introducing an external queue. This satisfies the Spec's observable pending/recovery contract while keeping the current single-process deployment model.
- `TurnAnalysisAdapter` implementations share the deterministic semantic/Markdown helper but remain independently registered by API kind.

## Deviations (Non-compliance)

- None.

## Undocumented ASRs (Specification Gaps)

- None identified. Queue technology and retry backoff remain explicitly deferred implementation details in the approved Spec and do not change the observable contract verified here.

## UI Change Notes

- The note projection retains lifecycle status for API/persistence purposes, but the Turn view renders only actual note cards. It does not render `Turn notes`, `ready`, `pending`, `empty`, or `failed` labels.
- `main` now uses the full available viewport width, so Turn and Traffic view cards expand with the window while preserving responsive sidebar/content layout.

## Recommended Next Steps

- All in-scope items pass. Await user approval of this verification result, then proceed to Sprint 16 completion review and Boundary.

## User Review

- Status: pending
- Decision: Verification result approval 대기
