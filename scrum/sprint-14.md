# Sprint 14 — 안전한 traffic content viewer 구현·검증

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
승인된 Turn 관리·분석 Spec의 남은 viewer slice로 traffic content를 형식별로 안전하게 표시하고, mode override·fallback·보안 경계를 자동 검증한다.

## Scope

| ID | Story |
|----|-------|
| PB-028 | 안전한 형식별 traffic content viewer 구현 |
| PB-029 | Turn 관리·분석 통합 검증과 실행 문서 |

**Out of sprint:** —

## Definition of Done
1. PB-028~PB-029의 Spec R-007~R-012와 관련 Constraints가 제품 코드에 구현된다.
2. JSON tree, sanitized Markdown, read-only Monaco viewer와 `Auto`/사용자 mode override가 제공된다.
3. detection 실패·지원 불가 형식은 plain text로 fallback하며 content가 실행되지 않는다.
4. 1 MiB field 전문 표시와 viewer 인스턴스 범위 state가 검증된다.
5. 제목·flag·삭제 cascade, filter/pagination, summary/partial 및 기존 turn tree·URL·traffic API 회귀가 통합 검증된다.
6. `npm run build`와 `npm run verify`가 통과하고 검증·실행 문서가 갱신된다.

## Demo Checklist
- [ ] JSON·Markdown·plain text·code content가 Auto mode에서 기대한 viewer로 표시된다.
- [ ] 사용자 mode override와 detection 실패/지원 불가 형식의 plain text fallback을 확인한다.
- [ ] content가 실행되지 않고, 1 MiB field가 잘리지 않으며, viewer state가 다른 traffic으로 누출되지 않음을 확인한다.
- [ ] Sprint 13의 metadata/filter/pagination/summary와 기존 turn tree·URL selection·traffic detail 회귀를 확인한다.
- [ ] `npm run build`와 `npm run verify` 및 실행 문서 갱신을 확인한다.

## Approval
- Drafted 2026-03-10 after Sprint 13 Boundary; user go-ahead("ok") approved the Sprint 14 plan. Live `TODO.md` was seeded and Execute started.
