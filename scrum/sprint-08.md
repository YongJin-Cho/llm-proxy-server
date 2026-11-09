# Sprint 08 — 다중 API 프록시 구현

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
승인된 Spec에 따라 OpenAI Chat Completions와 Claude Messages API를 기존 Responses 프록시에 통합하고, API별 인증·streaming·로그 정규화·provider cost metadata를 구현·검증한다.

## Scope

| ID | Story |
|----|-------|
| PB-013 | 다중 API public route와 transparent adapter contract 구현 |
| PB-014 | Claude 인증 mode와 provider header 설정 |
| PB-015 | API별 streaming completion/error 처리 |
| PB-016 | `api_kind` traffic log schema migration |
| PB-017 | Token usage normalization과 provider cost metadata |
| PB-018 | 다중 API 회귀·통합 검증과 실행 문서 |

**Out of sprint:** 승인 Spec에 없는 API 계약 변경, proxy-owned pricing table, UI 분석 기능, 배포·인증 제품화

## Definition of Done
1. `/api/v1/responses`, `/api/v1/chat/completions`, `/api/v1/messages`가 승인 Spec의 transparent adapter contract에 따라 동작한다.
2. Claude 인증 mode와 provider header가 설정·secret loading·redaction 기준을 충족한다.
3. 세 API의 non-streaming 및 streaming 성공·실패 처리가 API별 detector와 부분 결과 로그 정책을 충족한다.
4. `api_kind` migration과 legacy row 보존이 검증된다.
5. API별 usage normalization과 provider-reported USD cost 정책이 검증된다.
6. 기존 Responses 동작의 회귀 검증과 실행 문서 갱신이 완료된다.
7. 제품 코드는 승인 Spec과 이 Sprint Scope를 벗어나지 않는다.

## Demo Checklist
- [ ] 세 public route의 non-streaming 성공·오류를 provider 계약 그대로 확인할 수 있다.
- [ ] Claude Bearer/native 인증 mode와 secret redaction을 확인할 수 있다.
- [ ] 세 API의 streaming 정상 종료·조기 종료·upstream failure 결과를 확인할 수 있다.
- [ ] `api_kind` migration 및 legacy Responses row 보존을 확인할 수 있다.
- [ ] normalized usage와 provider-reported `cost_usd`/`NULL` 결과를 확인할 수 있다.
- [ ] 기존 Responses 회귀 테스트와 실행 문서가 통과한다.

## Approval
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 08 계획을 승인하고 구현을 시작했다.
