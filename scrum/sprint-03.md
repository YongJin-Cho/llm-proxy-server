# Sprint 03 — 승인된 구조 기반 UI 구현과 검증 기반 구축

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)
> **Sprint kind:** Backlog→Implementation

## Sprint Goal

승인된 `spec/llm-proxy-server.md`를 기준으로 React 모니터링 UI의 첫 구현을 만들고, 다음 단계의 provider/model routing 및 자동화 검증을 연결할 수 있는 기반을 구축한다. 이번 sprint는 실제 제품 구현 sprint이며, 설계 재논의는 범위에 포함하지 않는다.

## Scope

| ID | Story |
|----|-------|
| PB-005 | 확장 가능한 트래픽 모니터링 웹 UI 구현 |

**Out of sprint:** PB-006 자동화된 핵심 동작 검증과 실행 문서, PB-007~PB-011의 나머지 실제 구조 구현은 다음 구현 slice로 둔다.

## Definition of Done

1. 승인된 Spec의 R-001, R-007, R-010, R-011 및 C-005, C-006, C-008에 맞는 React UI가 단일 서버 프로세스에서 제공된다.
2. 로그 목록·최신순 정렬·상태/모델/기간 필터·페이지네이션·개별 상세·content viewer가 동작한다.
3. UI는 로그 API를 통해서만 조회하고 DB driver를 bundle하지 않는다.
4. page/component/data-query 구조가 향후 분석·report·chart feature를 독립적으로 추가할 수 있도록 분리된다.
5. 기존 MVP proxy/log API 동작이 회귀하지 않으며 `npm run build`가 통과한다.

## Demo Checklist

- React UI build output이 단일 서버 프로세스에서 제공되는지 확인
- 로그 목록·필터·페이지네이션·상세·content viewer 확인
- UI가 `/api/v1/logs` API를 통해서만 조회하는지 확인
- localhost binding과 기존 proxy/log API 회귀 확인
- `npm run build` 및 sprint 범위 검증 결과 확인

## Approval

- 2026-03-10: 사용자 go-ahead(“ok”)로 sprint-03 계획 승인. 실행 보드를 seed하고 PB-005 구현을 시작한다.
