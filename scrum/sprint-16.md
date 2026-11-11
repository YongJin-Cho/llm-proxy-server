# Sprint 16 — Turn analysis foundation implementation

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
승인된 turn note Spec의 기반 구현을 완료한다. 완료 turn을 조회하고 API별 `TurnAnalysisAdapter`를 선택해 deterministic `TurnNote[]`를 생성하며, 비동기 analysis lifecycle과 idempotent `turn_notes` persistence를 검증 가능한 상태로 만든다.

## Scope

| ID | Story |
|----|-------|
| PB-031 | TurnAnalysisService와 API별 TurnAnalysisAdapter 구현 |
| PB-032 | 비동기 note lifecycle·idempotent persistence 구현 |

**Out of sprint:** PB-033 query projection API, PB-034 UI note card, PB-035 전체 통합 검증 및 실행 문서 갱신

## Definition of Done
1. `TurnAnalysisService`가 완료 turn을 `TurnReader`로 읽고 `api_kind`별 `TurnAnalysisAdapter`를 선택한다.
2. Responses, Chat Completions, Claude Messages의 representative tool call/tool result fixture가 공통 semantic result와 deterministic Markdown `TurnNote[]`로 변환된다.
3. completion 후 비동기 analysis job과 `turn_id + analysis_version` idempotency가 구현된다.
4. 별도 `turn_notes` projection이 `pending/ready/empty/failed` 상태와 error/retry metadata를 저장하고 중복 completion·재시작·retry를 안전하게 처리한다.
5. 기존 completed turn·traffic 저장과 proxy/turn grouping 회귀 검증이 통과한다.

## Demo Checklist
- [ ] 각 API fixture에서 `TurnAnalysisAdapter`가 `title`과 Markdown `content`를 가진 `TurnNote[]`를 생성한다.
- [ ] 완료 turn이 먼저 보존된 뒤 analysis job이 pending에서 결과 상태로 전이된다.
- [ ] 동일 completion event를 반복해도 동일 `turn_id + analysis_version`에 중복 note가 생기지 않는다.
- [ ] 분석 실패·retryable failure가 turn completion을 실패시키지 않고 재시작 후 복구된다.
- [ ] `npm run build`와 관련 자동 검증이 통과한다.

## Approval
- Drafted 2026-03-10; Sprint 16 plan approval pending.
