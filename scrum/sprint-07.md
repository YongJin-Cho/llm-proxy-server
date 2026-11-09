# Sprint 07 — Chat Completions·Claude Messages 지원 요구사항 확정

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
OpenAI Chat Completions API와 Claude Messages API를 기존 Responses 프록시에 추가하기 위한 사용자 승인 PRD·AC·설계 결정·ASR·Spec을 확정하고, 구현 가능한 product backlog를 만든다.

## Scope

| ID | Story |
|----|-------|
| PB-012 | Chat Completions와 Claude Messages API 지원 요구사항 및 구현 backlog 확정 |

**Out of sprint:** 제품 코드 구현·리팩터링, provider 실제 호출 adapter 구현, UI 기능 추가, 배포·인증 제품화

## Definition of Done
1. 기존 승인 Spec을 보존하면서 두 API 추가 delta를 반영한 PRD가 사용자 승인된다.
2. blocking AC가 식별되고 dependency order가 정해진다.
3. API 경로·계약, Claude 인증/헤더, streaming/error 변환, provider routing 및 로그 정규화에 대한 모든 blocking 결정이 ADR 또는 Direct Input으로 정리되고 승인된다.
4. 승인된 결정이 ASR와 Spec의 R/C 항목에 반영된다.
5. 구현·검증 기준을 포함한 Spec review 기록이 존재한다.
6. PB-012를 구현 가능한 세부 product backlog story로 분해하고 다음 Backlog→Implementation sprint의 후보로 남긴다.
7. 제품 코드는 이 스프린트에서 변경하지 않는다.

## Approval
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 07 계획 승인. `TODO.md`를 seed하고 Execute를 시작했다.

## Demo Checklist
- [ ] Delta PRD와 변경 범위를 설명할 수 있다.
- [ ] Chat Completions·Claude Messages의 endpoint 및 계약 결정이 기록되어 있다.
- [ ] Claude 인증과 provider 설정 결정이 기록되어 있다.
- [ ] 정상·오류·비스트리밍·스트리밍 및 기존 Responses 회귀 검증 기준이 Spec에 있다.
- [ ] 승인된 Spec에서 PB-012 구현 backlog가 생성되어 있다.
