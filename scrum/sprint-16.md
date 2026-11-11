# Sprint 16 — Turn analysis pipeline implementation and verification

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
승인된 turn note Spec의 전체 구현을 완료한다. 완료 turn을 분석·저장·조회하고 Turn view에 note card를 표시하며, 세 API의 lifecycle·persistence·query·UI·통합 검증을 하나의 implementation sprint에서 완료한다.

## Scope

| ID | Story |
|----|-------|
| PB-031 | TurnAnalysisService와 API별 TurnAnalysisAdapter 구현 |
| PB-032 | 비동기 note lifecycle·idempotent persistence 구현 |
| PB-033 | Turn note query projection API 구현 |
| PB-034 | Turn view note card UI 구현 |
| PB-035 | API별 turn note 통합·회귀 검증과 실행 문서 |
| PB-036 | Tool history table·오류 note·note별 card 표시 개선 |

**Out of sprint:** —

## Definition of Done
1. `TurnAnalysisService`가 완료 turn을 `TurnReader`로 읽고 `api_kind`별 `TurnAnalysisAdapter`를 선택한다.
2. Responses, Chat Completions, Claude Messages의 representative tool call/tool result fixture가 공통 semantic result와 deterministic Markdown `TurnNote[]`로 변환된다.
3. completion 후 비동기 analysis job과 `turn_id + analysis_version` idempotency가 구현된다.
4. 별도 `turn_notes` projection이 `pending/ready/empty/failed` 상태와 error/retry metadata를 저장하고 중복 completion·재시작·retry를 안전하게 처리한다.
5. 기존 completed turn·traffic 저장과 proxy/turn grouping 회귀 검증이 통과한다.
6. Turn query가 note status·notes·error/retry metadata를 기존 turn aggregate와 함께 반환하고 note read failure가 기존 turn 조회를 차단하지 않는다.
7. Traffic usage summary table 다음 note card가 pending/ready/empty/failed를 구분해 안전하게 표시하고 기존 summary·traffic table을 차단하지 않는다.
8. 세 API fixture, duplicate completion, retry/restart recovery, query projection, UI card 및 기존 proxy/turn/traffic 회귀를 자동 검증하고 `npm run build`와 `npm run verify`가 통과한다.
9. tool history가 `Sequence / Function / Parameters / Status` table로 표시되고 API별 error result만 `Failed`로 표시되며 오류 interaction이 별도 note로 분리된다.
10. Turn View는 note별 독립 card만 표시하고 공통 `Turn notes` title/status와 빈 note card를 표시하지 않는다.

## Demo Checklist
- [x] 각 API fixture에서 `TurnAnalysisAdapter`가 `title`과 Markdown `content`를 가진 `TurnNote[]`를 생성한다.
- [x] 완료 turn이 먼저 보존된 뒤 analysis job이 pending에서 결과 상태로 전이된다.
- [x] 동일 completion event를 반복해도 동일 `turn_id + analysis_version`에 중복 note가 생기지 않는다.
- [x] 분석 실패·retryable failure가 turn completion을 실패시키지 않고 재시작 후 복구된다.
- [x] Turn query가 note projection을 기존 turn aggregate와 함께 반환하고 note read failure가 non-blocking으로 처리된다.
- [x] usage table 다음 note card가 네 가지 상태와 안전한 Markdown을 표시한다.
- [x] `npm run build`와 `npm run verify`가 통과한다.
- [ ] `tmp/api-ref.md`의 세 API tool call/result fixture와 error 판정이 table 및 오류 note에 반영된다.
- [ ] note가 note별 독립 card로 표시되고 빈 note projection에서는 card가 표시되지 않는다.

## Approval
- Drafted 2026-03-10; revised 2026-03-10 per user request to include PB-031~PB-035; approved by user go-ahead("ok") on 2026-03-10.
- Implementation evidence: `npm run verify` passed, including `scripts/verify-turn-notes.mjs`.
- 2026-03-10: 사용자 요청으로 PB-036을 Sprint 16 Scope에 추가하고, 승인된 `tmp/api-ref.md` 기반 tool history/error note/card 표시 변경을 반영했다.
