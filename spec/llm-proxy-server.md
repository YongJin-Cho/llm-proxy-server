# LLM Proxy Server

LLM 클라이언트와 OpenAI Model Provider 사이에서 `/v1/responses` 요청을 중계하고 요청·응답 쌍을 SQLite에 저장하며, localhost 웹 UI에서 저장 트래픽을 모니터링하는 단일 프로세스 애플리케이션이다.

## Context

- 제품 정의: `spec/PRD.md`
- 설계 결정 통합: `spec/ASR.md`
- 초기 사용자는 Codex 계열 등 OpenAI Responses API 클라이언트와 localhost 단일 운영자다.

## Requirements

- R-001: 서버는 단일 프로세스로 프록시 API, 로그 조회 API, 정적 모니터링 UI를 제공해야 한다. 기본 바인딩 주소는 `127.0.0.1`이어야 한다. ← ASR-005; ASR-007; adr/access-control.md; adr/deployment-configuration.md
- R-002: 프록시는 초기 범위에서 OpenAI 호환 `/v1/responses` 엔드포인트를 제공해야 하며, 클라이언트 요청을 설정된 Provider URL로 전달하고 Provider의 성공 응답을 클라이언트에 반환해야 한다. ← ASR-001; ASR-008; adr/proxy-api-compatibility.md
- R-003: 프록시는 Provider 오류와 네트워크 오류를 클라이언트가 식별 가능한 HTTP 오류 응답으로 반환하고, 해당 요청의 로그 상태를 `failed`로 기록해야 한다. ← ASR-008
- R-004: `stream: true` 요청에서 프록시는 Provider의 SSE 이벤트를 클라이언트에 전달해야 하며, 스트림 종료 후 최종 상태와 집계된 요청·응답 로그를 저장해야 한다. ← ASR-002; adr/streaming-response-handling.md
- R-005: 스트리밍 전송 오류 또는 연결 종료가 정상 완료 전에 발생하면 프록시는 부분 결과를 보존하고 로그 상태를 `failed`로 기록해야 한다. ← ASR-002; adr/streaming-response-handling.md
- R-006: 프록시는 각 요청과 응답을 하나의 추적 가능한 트래픽 로그 레코드로 연결해 저장해야 하며, 레코드는 최소한 고유 ID, 시작·종료 시각, 상태, HTTP 상태 코드, 모델, 스트리밍 여부, 지연시간, 요청 JSON, 응답 JSON 또는 오류 정보를 포함해야 한다. ← ASR-003; ASR-008; adr/traffic-log-storage.md
- R-007: 로그 저장소는 SQLite 파일이어야 하며, 서버 시작 시 필요한 스키마를 생성·확인해야 한다. 로그 조회는 최신순 목록, 상세 조회, 상태·모델·기간 필터, 페이지네이션을 지원해야 한다. ← ASR-003; adr/traffic-log-storage.md
- R-008: 서버는 로그 조회 API를 제공하고, 정적 웹 UI는 해당 API를 사용해 로그 목록과 개별 로그 상세(요청·응답·메타데이터·오류)를 표시해야 한다. ← ASR-006; ASR-007; adr/monitoring-ui-scope.md
- R-009: UI 로그 목록은 최신순으로 표시하고 상태·모델·기간 필터와 페이지네이션 입력을 제공해야 한다. UI는 저장된 마스킹 결과만 표시해야 한다. ← ASR-004; ASR-006
- R-010: 자동화된 검증은 정상 Provider 전달, Provider·네트워크 오류, SSE 전달, 요청·응답 로그 저장·조회, 민감정보 마스킹, UI 목록·상세를 재현해야 한다. ← ASR-009
- R-011: 서버 설정은 Provider URL, Provider API 키, 수신 포트, SQLite 데이터 경로, 요청·응답 본문 최대 저장 크기를 환경변수 또는 `.env` 예시로 설정할 수 있어야 한다. ← ASR-007; adr/deployment-configuration.md

## Constraints

- C-001: 초기 API 호환 범위는 `/v1/responses`이며 Chat Completions API와 Claude Messages API는 후속 확장이다. 지원하지 않는 API·필드는 명확한 오류로 거절해야 한다. ← ASR-001; adr/proxy-api-compatibility.md
- C-002: 스트리밍 전달은 SSE 방식이어야 하며, 초기 로그는 스트림 종료 후 집계한다. 스트리밍 중 실시간 UI 갱신과 재처리는 초기 범위가 아니다. ← ASR-002; adr/streaming-response-handling.md
- C-003: 저장소는 외부 DB 서버가 아닌 로컬 SQLite 파일이어야 하고, 자동 TTL 삭제는 제공하지 않는다. ← ASR-003; ASR-004; adr/traffic-log-storage.md; adr/sensitive-data-retention.md
- C-004: Authorization, API 키, 쿠키 등 알려진 비밀 헤더는 저장 전에 마스킹해야 한다. 요청·응답 JSON 본문은 설정 가능한 최대 크기까지만 저장하며 초과분은 잘라내야 한다. ← ASR-004; adr/sensitive-data-retention.md
- C-005: 프록시와 모니터링 UI는 localhost에만 바인딩하고 초기에는 인증, 외부 네트워크 노출, 사용자별 RBAC를 지원하지 않는다. ← ASR-005; adr/access-control.md
- C-006: UI 초기 범위에는 전문 검색, 차트, 자동 새로고침, 실시간 스트리밍 화면을 포함하지 않는다. ← ASR-006; adr/monitoring-ui-scope.md
- C-007: 애플리케이션은 단일 프로세스로 실행해야 하며, 코드 내부 모듈은 프록시·로그 저장/조회·UI 제공 책임을 분리해야 한다. 컨테이너 배포와 수평 확장은 초기 범위가 아니다. ← ASR-007; adr/deployment-configuration.md
- C-008: Provider API 키는 설정에서 읽어야 하며 트래픽 로그와 UI에 평문으로 기록·표시해서는 안 된다. ← ASR-004; ASR-005

## Out of Scope

- Chat Completions API 지원
- Claude Messages API 지원
- 모델 학습·호스팅·추론 엔진
- 외부 OIDC/JWT, 사용자별 인증·권한·RBAC
- 외부 네트워크 노출, 리버스 프록시 인증 구성, 수평 확장
- 실시간 스트리밍 로그 UI, 자동 새로고침, 차트, 전문 검색, 알림, 과금
- 자동 TTL 삭제, 스트림 재처리, 암호화 저장·외부 비밀관리 시스템

## Open Questions

- 없음. 위 후속 확장 항목은 구현을 차단하지 않는 deferred 범위다.

## Related

- `spec/PRD.md`
- `spec/AC.md`
- `spec/ASR.md`
- `adr/proxy-api-compatibility.md`
- `adr/streaming-response-handling.md`
- `adr/traffic-log-storage.md`
- `adr/sensitive-data-retention.md`
- `adr/access-control.md`
- `adr/monitoring-ui-scope.md`
- `adr/deployment-configuration.md`
