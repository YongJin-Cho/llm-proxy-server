# Architecturally Significant Requirements

LLM Proxy Server의 PRD와 승인된 AC 설계를 통합한 registry이다.

## Summary

| ID | Title | Source | Related AC | Related ADRs |
|----|-------|--------|------------|--------------|
| ASR-001 | Responses API 프록시 계약 | AC-001 | AC-001 | adr/proxy-api-compatibility.md |
| ASR-002 | SSE 스트리밍 전달과 집계 로그 | AC-002 | AC-002 | adr/streaming-response-handling.md |
| ASR-003 | SQLite 트래픽 로그 저장 | AC-003 | AC-003 | adr/traffic-log-storage.md |
| ASR-004 | 민감정보 마스킹과 본문 제한 | AC-004 | AC-004 | adr/sensitive-data-retention.md |
| ASR-005 | localhost 접근 경계 | AC-005 | AC-005 | adr/access-control.md |
| ASR-006 | 기본 트래픽 모니터링 UI | AC-006 | AC-006 | adr/monitoring-ui-scope.md |
| ASR-007 | 단일 프로세스 실행 구성 | AC-007 | AC-007 | adr/deployment-configuration.md |
| ASR-008 | 요청·응답 전달과 오류 투명성 | PRD | — | — |
| ASR-009 | 자동화된 핵심 동작 검증 | PRD | — | — |

## Dependency Order (recommended Spec encoding path)

1. ASR-001 → ASR-002 → ASR-003 → ASR-004 → ASR-005 → ASR-006 → ASR-007 → ASR-008 → ASR-009

## ASR Detail

### ASR-001 — Responses API 프록시 계약

- **Source:** AC-001 — 프록시 API 계약과 호환 범위
- **Statement:** 프록시는 초기 범위에서 `/v1/responses` 중심의 OpenAI 호환 계약을 제공하고, 요청·응답·오류 형식과 필요한 헤더 전달 규칙을 명시적으로 처리해야 한다. Chat Completions와 Claude Messages API는 후속 확장 범위다.
- **Decision summary:** Option A를 채택한다.
- **Related AC:** AC-001
- **Related ADRs:**
  - `adr/proxy-api-compatibility.md` — approved

### ASR-002 — SSE 스트리밍 전달과 집계 로그

- **Source:** AC-002 — 스트리밍 응답 처리
- **Statement:** 프록시는 Provider의 SSE 이벤트를 클라이언트에 전달하고, 스트림 종료 시 최종 상태와 집계된 요청·응답 로그를 저장해야 한다. 전송 오류나 연결 종료 시 부분 결과를 `failed` 상태로 저장해야 한다.
- **Decision summary:** Option A를 채택한다. 실시간 UI 갱신과 스트림 재처리는 후속 범위다.
- **Depends on:** ASR-001
- **Related AC:** AC-002
- **Related ADRs:**
  - `adr/streaming-response-handling.md` — approved

### ASR-003 — SQLite 트래픽 로그 저장

- **Source:** AC-003 — 트래픽 로그 저장 모델과 저장소
- **Statement:** 프록시는 SQLite 파일에 로그 메타데이터와 JSON 요청·응답 본문을 저장하고, 목록·상세·시간순 정렬·페이지네이션 조회를 제공해야 한다.
- **Decision summary:** Option A를 채택한다. 본문 크기 제한과 마스킹은 ASR-004를 따른다.
- **Depends on:** ASR-001, ASR-002
- **Related AC:** AC-003
- **Related ADRs:**
  - `adr/traffic-log-storage.md` — approved

### ASR-004 — 민감정보 마스킹과 본문 제한

- **Source:** AC-004 — 민감정보 보호와 로그 보존
- **Statement:** Authorization, API 키, 쿠키 등 알려진 비밀 헤더는 저장 전에 마스킹해야 하며, 요청·응답 JSON 본문은 설정 가능한 최대 크기까지 저장하고 초과분은 잘라내야 한다. UI에는 마스킹된 저장 결과만 표시한다.
- **Decision summary:** Option A를 채택한다. 초기에는 자동 TTL 삭제를 제공하지 않는다.
- **Depends on:** ASR-003
- **Related AC:** AC-004
- **Related ADRs:**
  - `adr/sensitive-data-retention.md` — approved

### ASR-005 — localhost 접근 경계

- **Source:** AC-005 — 프록시 및 모니터링 UI 접근 통제
- **Statement:** 프록시와 모니터링 UI는 localhost에만 바인딩하고 별도 인증을 적용하지 않아야 한다. 외부 네트워크 노출과 사용자별 RBAC는 초기 범위에서 제외한다.
- **Decision summary:** Option B를 채택한다.
- **Depends on:** ASR-004
- **Related AC:** AC-005
- **Related ADRs:**
  - `adr/access-control.md` — approved

### ASR-006 — 기본 트래픽 모니터링 UI

- **Source:** AC-006 — 모니터링 UI의 조회 범위와 운영 기능
- **Statement:** UI는 저장 로그의 목록, 시간순 정렬, 상태·모델·기간 필터, 페이지네이션, 개별 로그 상세를 제공해야 한다. 전문 검색, 차트, 자동 새로고침, 실시간 스트리밍 화면은 후속 범위다.
- **Decision summary:** Option A를 채택한다.
- **Depends on:** ASR-003, ASR-004, ASR-005
- **Related AC:** AC-006
- **Related ADRs:**
  - `adr/monitoring-ui-scope.md` — approved

### ASR-007 — 단일 프로세스 실행 구성

- **Source:** AC-007 — 배포 단위와 실행 구성
- **Statement:** 하나의 서버 프로세스가 프록시 API, 로그 API, 정적 UI를 제공하고 SQLite 파일을 로컬 데이터 디렉터리에 저장해야 한다. 코드 내부 기능 모듈은 분리해야 한다.
- **Decision summary:** Option A를 채택한다.
- **Depends on:** ASR-003, ASR-005, ASR-006
- **Related AC:** AC-007
- **Related ADRs:**
  - `adr/deployment-configuration.md` — approved

### ASR-008 — 요청·응답 전달과 오류 투명성

- **Source:** PRD — Goals, Scope, Success Criteria
- **Statement:** 구성된 클라이언트 요청은 프록시를 통해 Provider에 도달해야 하며, 성공 응답은 클라이언트에 반환되고 실패·Provider 오류는 추적 가능한 오류 응답과 로그 상태로 반환되어야 한다.
- **Depends on:** ASR-001, ASR-002, ASR-003

### ASR-009 — 자동화된 핵심 동작 검증

- **Source:** PRD — Success Criteria
- **Statement:** 자동화된 검증 절차로 정상·실패 프록시 전달, 스트리밍 전달, 로그 저장·조회, 민감정보 마스킹, UI 목록·상세 동작을 재현할 수 있어야 한다.
- **Depends on:** ASR-001 through ASR-008

## Approval

- 2026-03-10: 사용자 go-ahead(“ok”)로 ASR 승인. 다음 단계에서 `spec/llm-proxy-server.md`를 구현·검증 SSOT로 작성한다.

## Notes

- 2026-03-10: 모든 blocking AC와 승인된 ADR을 PRD의 제품 요구사항과 함께 통합했다.
