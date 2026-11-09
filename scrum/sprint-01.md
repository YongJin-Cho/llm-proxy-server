# Sprint 01 — LLM Proxy MVP 구현

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal

승인된 Spec을 기준으로 localhost에서 실행 가능한 단일 프로세스 LLM Proxy MVP를 구현한다. `/v1/responses` 중계, SSE 전달, SQLite 트래픽 로그, 기본 웹 모니터링 UI와 핵심 자동화 검증을 시연한다.

## Scope

| ID | Story |
|----|-------|
| PB-002 | Responses API 프록시와 오류 전달 |
| PB-003 | SSE 스트리밍 프록시와 집계 로그 |
| PB-004 | SQLite 요청·응답 로그 저장 및 조회 API |

**Out of sprint:** PB-005 트래픽 모니터링 웹 UI, PB-006 자동화된 핵심 동작 검증과 실행 문서, Chat Completions, Claude Messages API, 외부 인증, 외부 네트워크 노출, 고급 분석·알림·자동 보존 삭제

## Definition of Done

1. 서버가 단일 프로세스로 `127.0.0.1`에 실행된다.
2. `/v1/responses` 비스트리밍·SSE 요청이 설정된 Provider로 전달되고 응답·오류가 반환된다.
3. 요청·응답 쌍이 마스킹·본문 크기 제한 후 SQLite에 저장된다.
4. 로그 조회 API가 최신순 목록, 상태·모델·기간 필터, 페이지네이션, 상세 조회를 제공한다.
5. 로그 조회 API가 최신순 목록·필터·페이지네이션·상세 조회를 제공하고, 이를 시연할 수 있다.

## Demo Checklist

- 로컬 서버 시작 및 Provider 설정 확인
- 정상 `/v1/responses` 전달과 응답 확인
- Provider/네트워크 오류와 `failed` 로그 확인
- SSE 이벤트 전달과 완료·실패 집계 로그 확인
- SQLite 로그 목록·필터·페이지네이션·상세 API 확인
- 인증 헤더 마스킹과 본문 크기 제한 확인
