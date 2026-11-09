# LLM Proxy Server

LLM 클라이언트와 OpenAI Model Provider 사이에서 요청을 중계하고 요청·응답 트래픽을 SQLite에 저장하며, localhost 웹 UI에서 저장 트래픽을 모니터링하는 단일 프로세스 애플리케이션이다. 이 문서는 구현과 검증의 SSOT다.

## Context

- 제품 정의: `spec/PRD.md`
- 승인된 설계 통합: `spec/ASR.md`
- 초기 사용자는 Codex 계열 등 OpenAI Responses API 클라이언트와 localhost 단일 운영자다.
- sprint-02는 구현이 아니라 API·UI·provider·persistence 확장을 위한 설계와 백로그 갱신 범위다.

## Requirements

- R-001: 서버는 단일 프로세스로 프록시 API, 로그 조회 API, 정적 React 모니터링 UI를 제공하고 기본 바인딩 주소는 `127.0.0.1`이어야 한다. `server.ts`는 Fastify instance 생성, configuration loading, listen/shutdown lifecycle을 담당하며 API adapter와 관리 API는 route plugin으로 등록해야 한다. ← ASR-005; ASR-007; ASR-010; adr/access-control.md; adr/api-framework-and-server-structure.md; adr/deployment-configuration.md
- R-002: 프록시는 초기 범위에서 `/api/v1/responses` 엔드포인트를 제공하고 클라이언트 요청을 선택된 provider/model routing 결과의 Provider URL로 전달하며 성공 응답을 클라이언트에 반환해야 한다. 백엔드 API는 `/api/v1` namespace 아래에 둔다. ← ASR-001; ASR-008; ASR-010; ASR-012; adr/proxy-api-compatibility.md; adr/proxy-route-namespace.md
- R-003: 프록시는 Provider 오류와 네트워크 오류를 클라이언트가 식별 가능한 HTTP 오류 응답으로 반환하고 해당 요청의 로그 상태를 `failed`로 기록해야 한다. provider API key, secret reference 값, 내부 credential은 오류 응답이나 로그에 포함하지 않는다. ← ASR-008; ASR-012
- R-004: `stream: true` 요청에서 프록시는 Provider의 SSE 이벤트를 클라이언트에 전달하고 스트림 종료 후 최종 상태와 집계된 요청·응답 로그를 저장해야 한다. 기존 SSE 정상 종료, upstream failure, client disconnect 동작은 migration 회귀 검증 대상이다. ← ASR-002; ASR-010; adr/streaming-response-handling.md; adr/api-framework-and-server-structure.md
- R-005: 스트리밍 전송 오류 또는 연결 종료가 정상 완료 전에 발생하면 프록시는 부분 결과를 보존하고 로그 상태를 `failed`로 기록해야 하며, 실시간 UI 갱신이나 재처리를 수행하지 않는다. ← ASR-002
- R-006: 프록시는 각 요청과 응답을 하나의 추적 가능한 traffic log 레코드로 연결해 저장해야 하며, 레코드는 고유 ID, 시작·종료 시각, 상태, HTTP 상태 코드, client model ID, provider/model 식별자, streaming 여부, 지연시간, 요청 JSON, 응답 JSON 또는 오류 정보를 포함해야 한다. ← ASR-003; ASR-008; ASR-012; adr/traffic-log-storage.md
- R-007: 로그 저장소는 SQLite 파일이어야 하며 SQLite adapter가 schema와 migration을 소유하고 서버 시작 시 필요한 schema를 생성·확인해야 한다. UI/API query는 SQLite table에 직접 접근하지 않고 `TrafficLogReader` port/query service를 사용해야 하며, 조회는 최신순 목록, 상세, 상태·모델·기간 필터, pagination을 지원해야 한다. ← ASR-003; ASR-014; adr/traffic-log-storage.md; adr/api-log-write-ui-read-boundary.md
- R-008: API request path의 application service는 `TrafficLogWriter` port에만 의존하고 UI log API/query service는 `TrafficLogReader` port에만 의존해야 한다. 공통 domain 계층은 traffic log model, status/metadata type, redaction policy, body size limit policy를 소유하며 SQLite adapter가 두 port의 구현을 제공해야 한다. 초기에는 동일 SQLite 파일과 단일 프로세스를 사용해 strong consistency를 유지한다. ← ASR-014; AC-012; adr/api-log-write-ui-read-boundary.md
- R-009: API별 adapter는 route/payload 변환과 Provider 요청·응답 변환만 담당해야 한다. 공통 application service는 client model ID를 routing contract로 전달하고 adapter는 provider client를 직접 선택하지 않아야 하며, log persistence는 `TrafficLogWriter` port를 통해야 한다. Responses·Chat Completions·Messages는 독립 adapter/plugin으로 등록할 수 있어야 한다. ← ASR-013; AC-011
- R-010: UI는 로그 API를 통해서만 데이터를 조회해야 하며 React page/component/data-query 모듈로 로그 목록, 개별 상세, 요청·응답·metadata·오류·저장 content viewer를 제공해야 한다. 향후 분석·report·chart feature는 기존 화면과 독립된 feature/module로 추가할 수 있어야 한다. ← ASR-006; ASR-011; adr/monitoring-ui-scope.md; adr/ui-framework-and-monitoring-structure.md
- R-011: UI 로그 목록은 최신순으로 표시하고 상태·모델·기간 filter와 pagination 입력을 제공해야 하며, UI에는 저장된 redaction 결과만 표시해야 한다. 전문 검색, chart, 자동 refresh, 실시간 streaming 화면은 초기 구현에서 제공하지 않는다. ← ASR-004; ASR-006
- R-012: provider 설정은 기본 `config.json` 파일의 `providers`와 `models` 섹션으로 표현해야 한다. 각 provider는 base URL과 API key 환경변수 참조를 가지며, 각 client model entry는 `provider`와 `providerModel`을 가져야 한다. 예를 들어 `gpt-6-luna`는 `openrouter` provider의 `openai/gpt-6-luna`로 매핑될 수 있다. `.env`, `PROVIDER_URL`, `PROVIDER_API_KEY`는 사용하지 않는다. ← ASR-012; adr/provider-routing-configuration.md
- R-013: 서버 시작 전 기본 `config.json`의 provider URL, model mapping, required secret reference, host, port, SQLite 경로, body size limit 등 필수 설정을 validation해야 하며 잘못된 설정이나 migration 실패 시 listen 전에 종료해야 한다. 등록되지 않은 client model은 Provider 호출 전에 명확한 4xx configuration/model 오류로 거부해야 한다. secret 값은 오류·로그·UI에 노출하지 않는다. ← ASR-012; ASR-015; adr/provider-routing-configuration.md
- R-014: API adapter와 persistence 변경은 기존 MVP 동작을 보존하는 순서로 migration해야 한다: 기존 동작 회귀 테스트 고정 → domain/configuration/persistence 분리 → Fastify bootstrap·adapter 도입 → provider routing 연결 → writer/reader와 SQLite adapter 연결 → React build/static delivery 연결 → schema/data compatibility 검증. ← ASR-015
- R-015: 자동화 검증은 정상·실패 proxy, SSE 정상·중단, provider/model routing, SQLite write/read, redaction·body size limit, logs API, UI list/detail을 재현해야 하며 `npm run build`와 `npm run verify`를 검증 진입점으로 유지해야 한다. ← ASR-009; ASR-015
- R-016: 단일 프로세스 실행 문서는 기본 `config.json` 경로와 schema, API key 환경변수, SQLite 경로, host/port, frontend build, server build/start 절차를 설명해야 한다. `.env`, `PROVIDER_URL`, `PROVIDER_API_KEY` 사용법은 설명하거나 지원하지 않는다. ← ASR-007; ASR-015
- R-017: 프록시는 Responses, OpenAI Chat Completions, Claude Messages에 대해 API별 public route와 provider endpoint 계약을 유지하고, 각 요청·응답 payload를 가능한 한 해당 provider 계약 그대로 전달해야 한다. Proxy는 API 간 canonical payload 변환을 수행하지 않으며 provider 오류는 client가 식별 가능한 오류와 로그 상태로 전달해야 한다. ← ASR-016; AC-014; adr/multi-api-contract-adapter-boundary.md
- R-018: Claude Messages를 사용하는 provider는 기본 upstream 인증으로 `Authorization: Bearer <api-key>`를 사용해야 한다. 공식 Anthropic endpoint처럼 native 인증이 명시적으로 설정된 provider는 `x-api-key`와 설정된 `anthropic-version`을 사용해야 하며, 기존 `apiKeyEnv` 환경변수 secret loading과 redaction 정책을 유지해야 한다. ← ASR-017; AC-015; adr/claude-provider-authentication-headers.md
- R-019: streaming adapter는 API kind별 정상 종료를 감지하면서 provider의 원본 SSE bytes를 client에 투명하게 전달해야 한다. Responses는 `response.completed` 또는 `[DONE]`, Chat Completions는 `[DONE]`, Claude Messages는 `message_stop`을 정상 종료 기준으로 사용해야 한다. sentinel/event 이전 종료, upstream 오류, client disconnect는 `failed`로 기록하고 부분 결과를 보존해야 한다. ← ASR-018; AC-016; adr/api-streaming-completion-and-error-contract.md
- R-020: traffic log domain model과 SQLite table은 first-class `api_kind` 값을 저장해야 하며 최소 `responses`, `chat_completions`, `messages`를 구분해야 한다. 기존 Responses row와 legacy 호출 경로는 migration compatibility를 위해 `responses` 기본값을 사용해야 하고, API별 raw request/response body는 기존 bounded JSON/text 정책으로 보존해야 한다. ← ASR-019; AC-017; adr/traffic-log-api-metadata.md
- R-021: traffic log는 API별 usage 응답을 `input_tokens`, `cached_input_tokens`, `output_tokens`로 정규화해 저장해야 하며 `total_tokens`는 `input_tokens + output_tokens`로 계산해야 한다. usage가 없거나 일부 값이 누락되면 해당 값을 `NULL`로 저장하고, cached input tokens는 total에 별도로 가산하지 않아야 한다. ← ASR-020; AC-018; adr/usage-and-cost-metadata.md
- R-022: `cost_usd`는 provider 응답이 명시한 USD 비용만 저장해야 하며 provider가 비용을 제공하지 않거나 통화가 불명확하면 `NULL`이어야 한다. Proxy는 provider/model별 pricing table로 비용을 추정하거나 실제 비용처럼 표시해서는 안 된다. Cost source는 기존 bounded raw response/redaction 정책으로 추적 가능해야 한다. ← ASR-020; AC-018; adr/usage-and-cost-metadata.md

## Constraints

- C-001: 초기 API 호환 범위는 `/api/v1/responses`이며 로그 API도 `/api/v1` 아래에 둔다. Chat Completions와 Claude Messages API의 실제 구현은 후속 범위다. `/v1/responses` 별칭은 제공하지 않는다. ← ASR-001; adr/proxy-api-compatibility.md; adr/proxy-route-namespace.md
- C-002: streaming 전달은 SSE 방식이어야 하며 초기 로그는 stream 종료 후 집계한다. streaming 중 실시간 UI 갱신과 재처리는 초기 범위가 아니다. ← ASR-002
- C-003: 저장소는 외부 DB 서버가 아닌 local SQLite file이어야 하고 자동 TTL 삭제, 별도 read database, async projection, event bus는 제공하지 않는다. ← ASR-003; ASR-014
- C-004: Authorization, API key, cookie 등 알려진 secret header는 저장 전에 mask해야 한다. 요청·응답 JSON 본문은 설정 가능한 maximum size까지만 저장하고 초과분은 truncate한다. UI는 저장된 mask 결과만 표시한다. ← ASR-004; ASR-014
- C-005: proxy와 monitoring UI는 localhost에만 bind하고 초기에는 authentication, external network exposure, user-specific RBAC를 지원하지 않는다. ← ASR-005
- C-006: 애플리케이션은 single process로 실행해야 하며, bootstrap, configuration, API routing/adapter, provider/routing, logging/domain, persistence, UI delivery/query 책임을 내부 module로 분리해야 한다. container deployment와 horizontal scaling은 초기 범위가 아니다. ← ASR-007; ASR-010
- C-007: API key는 기본 `config.json`에 평문으로 저장하지 않고 provider별 `apiKeyEnv`가 지정한 process environment에서 로드해야 하며, `.env`, `PROVIDER_URL`, `PROVIDER_API_KEY`는 사용하지 않는다. 설정 오류·traffic log·UI에 API key를 평문으로 기록·표시해서는 안 된다. 외부 secret/config service와 실행 중 자동 secret rotation은 초기 범위가 아니다. ← ASR-012; adr/provider-routing-configuration.md
- C-008: 승인된 API framework는 Fastify이며, 승인된 UI framework는 React다. Fastify static delivery는 React build output을 제공해야 하고 UI bundle에는 DB driver를 포함하지 않아야 한다. ← ASR-010; ASR-011; adr/api-framework-and-server-structure.md; adr/ui-framework-and-monitoring-structure.md
- C-009: schema migration 및 module migration은 기존 MVP 회귀 검증을 통과해야 하며 필수 설정 누락이나 migration 실패 시 server가 listen해서는 안 된다. ← ASR-015
- C-010: API adapter는 route/payload 변환과 Provider 요청·응답 변환만 소유해야 하며 provider client 선택이나 log persistence를 직접 소유해서는 안 된다. Responses·Chat Completions·Messages는 독립 adapter/plugin으로 등록 가능해야 한다. ← ASR-016; ASR-013
- C-011: `api_kind` migration은 기존 traffic log 데이터를 삭제하지 않고 legacy row를 `responses`로 해석해야 한다. Streaming completion detector는 API kind별 계약을 사용해야 하며 detector가 정상 종료를 확인하기 전 connection close를 completed로 판정해서는 안 된다. ← ASR-018; ASR-019
- C-012: `cost_usd`에는 provider가 USD로 명시한 값만 허용한다. Proxy-owned pricing table, proxy 추정 비용, 불명확한 통화의 비용 저장은 초기 범위에서 금지한다. ← ASR-020

## Out of Scope

- Chat Completions API와 Claude Messages API의 실제 provider 연동 구현
- 모델 학습·호스팅·추론 엔진
- 외부 OIDC/JWT, 사용자별 인증·권한·RBAC
- 외부 네트워크 노출, reverse proxy 인증, horizontal scaling, container deployment
- 실시간 streaming log UI, automatic refresh, chart, 전문 검색, 알림, proxy-owned pricing table 기반 비용 추정·과금
- automatic TTL deletion, stream reprocessing, encrypted storage, external secret/config service, runtime secret rotation
- sprint-02 범위에서의 제품 코드 구현

## Open Questions

- 없음. 후속 API·chart·보안·확장 항목은 구현을 차단하지 않는 deferred 범위다.

## Related

- `spec/PRD.md`
- `spec/AC.md`
- `spec/ASR.md`
- `adr/api-framework-and-server-structure.md`
- `adr/ui-framework-and-monitoring-structure.md`
- `adr/provider-routing-configuration.md`
- `adr/api-log-write-ui-read-boundary.md`
- `adr/proxy-api-compatibility.md`
- `adr/proxy-route-namespace.md`
- `adr/streaming-response-handling.md`
- `adr/traffic-log-storage.md`
- `adr/sensitive-data-retention.md`
- `adr/access-control.md`
- `adr/monitoring-ui-scope.md`
- `adr/deployment-configuration.md`
- `adr/multi-api-contract-adapter-boundary.md`
- `adr/claude-provider-authentication-headers.md`
- `adr/api-streaming-completion-and-error-contract.md`
- `adr/traffic-log-api-metadata.md`
- `adr/usage-and-cost-metadata.md`
