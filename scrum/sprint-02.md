# Sprint 02 — 트래픽 모니터링과 자동화 검증

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal

sprint-01에서 완성한 프록시·SQLite 로그를 기반으로 localhost 트래픽 모니터링 UI를 제공하고, 핵심 동작을 자동화된 검증과 실행 문서로 재현 가능하게 만든다.

## Scope

| ID | Story |
|----|-------|
| PB-005 | 트래픽 모니터링 웹 UI |
| PB-006 | 자동화된 핵심 동작 검증과 실행 문서 |

**Out of sprint:** Chat Completions, Claude Messages API, 외부 인증, 외부 네트워크 노출, 고급 분석·알림·자동 보존 삭제

## Definition of Done

1. localhost 웹 UI에서 저장 로그를 최신순으로 확인하고 상태·모델·기간 필터와 페이지네이션을 사용할 수 있다.
2. UI에서 요청·응답·메타데이터·오류 상세를 확인할 수 있다.
3. 정상·실패 프록시, SSE, 저장·조회, 마스킹 동작을 자동화된 검증으로 재현할 수 있다.
4. 단일 프로세스 실행 설정과 검증 절차가 문서화되어 있다.
5. PB-005와 PB-006의 acceptance 기준을 시연하고 검증 결과를 기록한다.

## Demo Checklist

- localhost 웹 UI 시작 및 로그 목록 확인
- 상태·모델·기간 필터와 페이지네이션 확인
- 요청·응답·메타데이터·오류 상세 확인
- 정상·실패 프록시 및 SSE 자동 검증 실행
- SQLite 저장·조회·마스킹 자동 검증 실행
- 단일 프로세스 실행 및 검증 절차 문서 확인
