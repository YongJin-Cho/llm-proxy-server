# Sprint 13 — Turn 관리 메타데이터·탐색·요약 구현

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
승인된 Turn 관리·분석 Spec의 첫 구현 slice로 turn 제목·flag·cascade 삭제, 전체/flagged 탐색과 pagination, turn summary 및 usage/cost projection을 제품 코드에 구현·검증한다.

## Scope

| ID | Story |
|----|-------|
| PB-025 | Turn 관리 메타데이터와 turn cascade 삭제 구현 |
| PB-026 | Turn filter·pagination·mutation refresh 구현 |
| PB-027 | Turn summary·usage/cost projection 구현 |

**Out of sprint:** PB-028 안전한 형식별 traffic content viewer, PB-029 전체 통합 검증·실행 문서 갱신, viewer dependency 설치·검증을 포함한 code viewer 구현.

## Definition of Done
1. PB-025~PB-027의 Spec R-001~R-006과 관련 Constraints가 제품 코드에 구현된다.
2. 제목·flag 저장, turn 단위 물리 삭제와 child cascade transaction, traffic 단독 삭제 금지 동작이 자동 검증된다.
3. all/flagged 서버 필터, turn 단위 pagination, mutation 후 재조회와 빈 page 보정이 자동 검증된다.
4. turn summary의 시작/종료 메시지 선택, usage/cost 합산, null/partial 표현이 자동 검증된다.
5. 기존 turn tree·legacy projection·URL selection·traffic detail 및 기존 API 회귀가 유지된다.
6. `npm run build`와 관련 `npm run verify` 검증이 통과하고 구현 acceptance evidence가 기록된다.

## Demo Checklist
- [ ] Turn 제목·flag를 편집하고 새로고침 후 유지되는 것을 확인한다.
- [ ] Turn 삭제가 child traffic과 함께 transaction으로 물리 삭제되고 traffic 단독 삭제 경로가 없음을 확인한다.
- [ ] All/flagged filter와 page 이동, 마지막 유효 page 보정을 확인한다.
- [ ] Turn summary 및 usage/cost의 completed·null·partial 상태를 확인한다.
- [ ] 기존 tree·URL selection·traffic detail 회귀 검증을 확인한다.
- [ ] `npm run build`와 관련 자동 검증 결과를 확인한다.

## Approval
- Drafted 2026-03-10 after Sprint 12 Boundary; user go-ahead("좋아") approved the Sprint 13 plan. Live `TODO.md` was seeded and product Execute started.
