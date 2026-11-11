# Verification: Turn 완료 후 API별 분석 Note

**Spec:** `llm-proxy-server/spec/llm-proxy-turn-notes.md` (aligned with `spec/PRD.md`)
**Artifact(s):** `src/application/proxy-service.ts`, `src/application/turn-analysis-service.ts`, `src/application/turn-analysis-adapters/`, `src/domain/turn-notes.ts`, `src/persistence/sqlite-traffic-log.ts`, `src/ui/components/NoteCard.tsx`, `src/ui/components/TurnView.tsx`, `scripts/verify-turn-notes.mjs`
**Verified:** 2026-03-10 (재검증)
**Summary:** 18 pass, 1 fail, 0 partial, 0 not-verifiable

## Inventory & Results

| # | Spec item | Status | Evidence / Notes |
|---|-----------|--------|------------------|
| 1 | R-001 | pass | `src/application/proxy-service.ts`가 completed turn 저장 후 분석을 enqueue한다. `npm run verify`의 build 및 기존 proxy/turn 검증 단계 통과. |
| 2 | R-002 | pass | `TurnAnalysisService`가 `TurnAnalysisPersistence.getTurnForAnalysis`를 통해 분석 입력을 읽고 service orchestration으로 실행한다. |
| 3 | R-003 | pass | `src/application/turn-analysis-adapters/`에 Responses, Chat Completions, Messages 독립 adapter가 있고 `api_kind`로 선택한다. |
| 4 | R-004 | pass | `src/domain/turn-notes.ts`와 세 adapter가 API별 tool call/use/result 구조를 해석한다. |
| 5 | R-005 | **fail** | `scripts/verify-turn-notes.mjs:40`의 Chat Completions 오류 interaction assertion이 실패했다. `npm run verify` 출력의 assertion: `The input did not match ...`, actual 값은 빈 문자열이었다. 따라서 오류 interaction의 deterministic Markdown/실패 상태 fixture가 현재 실행 환경에서 기대값을 만족한다고 판정할 수 없다. |
| 6 | R-006 | pass | `turn_notes` schema가 status, notes JSON, version, error/retry metadata, timestamp를 저장한다. |
| 7 | R-007 | pass | `turn_id + analysis_version` composite key와 `INSERT OR IGNORE` 기반 pending 생성으로 중복 projection을 방지한다. |
| 8 | R-008 | pass | canonical status가 `pending`, `ready`, `empty`, `failed`로 정의되고 empty fixture가 empty projection을 검증한다. |
| 9 | R-009 | pass | failed result의 error message bound, `note_unavailable`, startup pending/retryable recovery 경로가 구현되어 있다. 단, 전체 `npm run verify`가 R-005에서 중단되어 이번 실행에서 후속 자동 검증 결과는 독립적으로 재확인되지 않았다. |
| 10 | R-010 | pass | `listTurns`가 note projection을 기존 turn aggregate에 결합하고 tree traffic summary에서 request/response body를 제거한다. |
| 11 | R-011 | pass | `NoteCard`가 usage table 뒤에 note별 독립 card를 렌더링하고 빈 notes는 렌더링하지 않으며 공통 status/header를 표시하지 않는다. |
| 12 | R-012 | pass | note content는 sanitized Markdown으로 표시되고 수동 retry UI는 없다. |
| 13 | R-013 | fail | 통합 검증 진입점 `npm run verify`가 turn-note fixture assertion에서 실패했다. build, `verify.mjs`, `verify-turn.mjs`는 통과했으나 전체 통합 검증은 통과하지 않았다. |
| 14 | C-001 | pass | 분석 adapter가 SQLite를 직접 import하지 않고 service/persistence contract를 통해 입력을 받는다. |
| 15 | C-002 | pass | 기존 proxy adapter, grouping, SSE aggregate, traffic lifecycle 관련 검증 단계가 통과했다. |
| 16 | C-003 | pass | API별 extraction은 analysis adapter 계층에 있고 provider 호출이나 canonical payload 변환을 추가하지 않았다. |
| 17 | C-004 | pass | analysis version은 1로 명시되고 composite key가 동일 turn/version 결과를 하나로 제한한다. |
| 18 | C-005 | pass | error message는 bound되고 Markdown은 sanitize된다. |
| 19 | C-006 | pass | LLM 요약 호출, note 편집/search, streaming 중간 note, 수동 retry UI는 추가되지 않았다. |

## Design Review Notes

- 구현은 외부 queue 대신 단일 프로세스의 microtask 기반 worker와 SQLite projection을 사용한다. 이는 승인 Spec이 외부 queue 기술을 고정하지 않고 pending/recovery의 관찰 가능한 계약을 요구한다는 점과 일치한다.
- API별 adapter는 공통 semantic/Markdown helper를 공유하지만 API kind별 adapter 등록 경계는 유지한다.
- 이번 재검증에서는 UI source의 note card/request-response viewer wiring도 확인했으나, 자동 검증 실패 때문에 전체 결과를 pass로 종결하지 않는다.

## Deviations (Non-compliance)

### R-005 / R-013 — Major

- **Actual behavior:** `npm run verify`가 `scripts/verify-turn-notes.mjs`의 Chat Completions 오류 interaction assertion에서 종료되었다. 로그에는 `AssertionError [ERR_ASSERTION]`과 `actual: ''`가 기록되었다.
- **Expected behavior:** 오류 tool interaction은 첫 history note의 `Status` 열에 `Failed`를 표시하고, 오류별 독립 note와 원본 call/result payload를 제공해야 하며, 세 API 통합 검증이 성공해야 한다.
- **Impact:** 승인 Spec의 필수 오류 note 검증과 전체 자동 검증 DoD를 현재 실행 결과로 입증할 수 없다.
- **Required closure:** fixture와 실제 adapter/persistence 출력의 불일치를 재현·수정한 뒤 `npm run verify`를 다시 실행하고 이 보고서를 scoped re-verify로 갱신해야 한다.

## Undocumented ASRs (Specification Gaps)

- 없음. 이번 실패는 새 아키텍처 선택을 요구하는 사양 공백이 아니라 기존 승인된 오류 note 계약의 구현/검증 불일치로 분류한다.

## Recommended Next Steps

- `scripts/verify-turn-notes.mjs`의 실패 assertion과 Chat Completions adapter의 실제 interaction 결과를 함께 재현한다.
- fixture가 의도한 tool result 형태와 `ChatCompletionsTurnAnalysisAdapter`의 결과 매칭을 일치시킨다.
- `npm run verify` 전체 통과 후 R-005 및 R-013을 scoped re-verify하고, 그때 Sprint completion review로 이동한다.

## User Review

- Status: pending
- Decision: 재검증 결과 및 결함 closure 대기
