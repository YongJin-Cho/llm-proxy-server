# Sprint 05 — Provider 라우팅과 로그 access 경계 완성

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)
> **Sprint kind:** Backlog→Implementation

## Sprint Goal

현재 단일 provider 전달 구조를 설정 기반 provider/model routing으로 확장하고, API write path와 UI read path의 access 경계를 실제 코드와 검증에 반영한다. 기존 Responses/SSE/log/UI 동작을 보존하면서 잘못된 model·설정·secret 노출을 명확히 처리한다.

## Scope

| ID | Story |
|----|-------|
| PB-008 | 복수 LLM provider 및 model ID 라우팅 |
| PB-009 | API 로그 기록과 UI 조회를 분리하는 DB access 구조 |
| PB-011 | 구조 변경 마이그레이션·검증·실행 문서 |

**Out of sprint:** PB-010의 추가 UI feature 및 chart/report 확장. 기존 UI는 PB-009 read boundary 검증에 필요한 범위만 유지한다.

## Definition of Done

1. 설정 파일에서 provider endpoint·secret 참조와 client model → provider/model 매핑을 읽고 요청을 올바른 provider로 전달한다.
2. 미등록 model, 잘못된 routing 설정, provider 오류 및 secret 노출 방지가 명확한 오류·로그 동작으로 검증된다.
3. API request path는 `TrafficLogWriter`, UI query path는 `TrafficLogReader`/query boundary를 통해 접근하며 SQLite adapter와의 책임 경계가 문서화된다.
4. 정상·실패 proxy, SSE, routing, persistence/query, masking, UI 회귀 시나리오가 자동화 검증으로 재현된다.
5. migration 순서, 설정 schema, secret handling, build/start 절차가 현재 module map과 일치하도록 문서화된다.
6. `npm run build`와 `npm run verify`가 통과하고 verification report에 결과가 기록된다.

## Demo Checklist

- 두 provider 설정과 model routing이 각각 올바른 endpoint로 전달되는지 확인
- 미등록 model·잘못된 설정·provider 오류의 응답과 secret redaction 확인
- writer/read boundary 및 SQLite adapter 책임 확인
- 기존 Responses/SSE/log/UI 회귀 검증
- migration·설정·실행 문서와 실제 구조 비교
- `npm run build`, `npm run verify`, verification report 확인

## Approval

- 승인 대기: 위 Goal, Scope, DoD, Demo Checklist를 검토한 뒤 Execute를 승인한다.
