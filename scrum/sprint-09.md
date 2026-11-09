# Sprint 09 — Turn 기반 traffic 그룹핑·탐색 요구사항 확정

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
하나의 사용자 요청에서 발생한 복수 LLM traffic을 turn으로 그룹핑해 저장하고, sidebar tree 탐색과 메인 뷰 선택 동작을 제공하기 위한 사용자 승인 요구사항·설계 결정·Spec·후속 구현 backlog를 확정한다.

## Scope

| ID | Story |
|----|-------|
| PB-019 | Turn 기반 traffic 저장·탐색 UI 요구사항 확정 |

**Out of sprint:** 승인 Spec 이전의 제품 코드 구현, 실시간 streaming UI, 별도 사용자 인증·권한, 고급 분석·차트, 기존과 무관한 log retention 정책

## Definition of Done
1. turn과 traffic의 관계, 식별자, 순서, lifecycle 및 저장/query API 계약이 승인 PRD/AC/ADR/Spec에 명시된다.
2. 기존 traffic 데이터에 대한 migration 및 호환 표시 정책이 명시된다.
3. sidebar tree의 turn/traffic 표시, 정렬·pagination/loading 범위, 선택 상태 및 메인 뷰 렌더링 계약이 명시된다.
4. 구현·검증 가능한 `R-NNN`/`C-NNN` Spec과 review record가 작성·승인된다.
5. 승인 Spec을 기준으로 후속 Backlog→Implementation sprint에서 실행할 `PB-*` stories가 product backlog에 append된다.
6. 제품 코드 구현은 이 Spec→backlog sprint 범위를 벗어나지 않는다.

## Demo Checklist
- [ ] turn grouping 저장 모델과 기존 traffic migration 정책을 설명할 수 있다.
- [ ] turn/traffic tree의 API·정렬·pagination/loading 및 선택 동작을 설명할 수 있다.
- [ ] turn 선택과 traffic 선택 시 메인 뷰의 표시 계약을 확인할 수 있다.
- [ ] 승인 Spec의 요구사항과 후속 구현 backlog story가 서로 추적된다.

## Approval
- 승인 대기: 사용자의 Sprint 09 계획 go-ahead 필요.
