# Sprint 15 — Turn note 분석 기능 요구사항·구현 backlog 확정

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
Turn 종료 후 API별 request/response 분석으로 도구 사용 이력을 note로 남기고 Turn view에서 확인하는 기능의 사용자 승인 요구사항, 설계 결정, 구현·검증 backlog를 확정한다.

## Scope

| ID | Story |
|----|-------|
| PB-030 | Turn 완료 후 API별 분석 note 파이프라인 요구사항 및 구현 backlog 확정 |

**Out of sprint:** 제품 코드 구현, note 분석 LLM 호출 자체, 기존 turn grouping·summary·viewer 동작의 비관련 변경

## Definition of Done
1. PRD delta, blocking AC, 필요한 ADR 또는 Direct Input, ASR, Spec을 사용자 승인 상태로 확정한다.
2. Responses, Chat Completions, Messages별 request/response 분석 adapter 경계와 도구 사용 이력의 note 데이터 계약을 명시한다.
3. turn 완료 lifecycle, 분석 실행 방식, 중복·재시도·분석 실패 처리와 기존 turn completion 저장 일관성을 명시한다.
4. note 저장·조회 API와 Turn view의 traffic summary table 다음 note card 표시 계약을 명시한다.
5. 구현·검증 가능한 하위 PB story와 acceptance-oriented DoD를 product backlog에 append한다.
6. Sprint 15는 제품 구현 없이 Spec→backlog Boundary에서 종료하고, 후속 Backlog→Implementation sprint의 후보를 남긴다.

## Demo Checklist
- [ ] turn 완료 후 note가 언제 생성되는지와 분석 실패가 turn 상태에 미치는 영향을 설명한다.
- [ ] Responses, Chat Completions, Messages 각각의 분석 입력·출력과 tool 사용 이력 추출 규칙을 확인한다.
- [ ] note 저장/조회 계약과 Turn view의 note card 위치·표시·empty/error 상태를 확인한다.
- [ ] 승인 Spec에서 구현 sprint로 가져갈 PB stories와 검증 시나리오를 확인한다.

## Approval
- Drafted 2026-03-10; Sprint 15 plan approval pending.
