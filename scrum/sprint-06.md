# Sprint 06 — 확장 가능한 모니터링 UI 구조 완성

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)
> **Sprint kind:** Backlog→Implementation

## Sprint Goal

기존 로그 목록·상세 UI를 확장 가능한 page/component/data-query 구조로 정리하고, 향후 분석·report·chart 기능을 기존 화면과 독립적으로 추가할 수 있는 기반을 완성한다. 현재 동작하는 provider routing, logging, persistence 및 runtime 설정 계약은 유지한다.

## Scope

| ID | Story |
|----|-------|
| PB-010 | 확장 가능한 모니터링 UI 구조 |

**Out of sprint:** 새로운 분석·report·chart 기능 자체, provider 기능 추가, 대규모 API/DB schema 변경.

## Definition of Done

1. 승인된 UI framework와 page/component/data-query 구조가 실제 소스 구조와 실행 경로에 반영된다.
2. 로그 목록·상세·content viewer가 기존 API contract와 masking/pagination 동작을 보존한다.
3. UI feature를 기존 화면과 독립적으로 추가할 수 있도록 책임 경계와 확장 지점을 문서화한다.
4. 기존 proxy, SSE, log persistence/query, provider routing 및 UI 회귀 시나리오가 자동 검증으로 유지됨을 확인한다.
5. `npm run build`와 `npm run verify`가 통과하고 verification report에 결과가 기록된다.

## Demo Checklist

- 로그 목록·상세·content viewer의 기존 동작 확인
- page/component/data-query 책임 분리와 실제 import 경계 확인
- 향후 분석·report·chart 확장 지점과 기존 화면 독립성 확인
- provider routing·SSE·log persistence/query 회귀 확인
- `npm run build`, `npm run verify`, verification report 확인

## Approval

- 승인 대기: 위 Goal, Scope, DoD, Demo Checklist를 검토한 뒤 Execute를 승인한다.
