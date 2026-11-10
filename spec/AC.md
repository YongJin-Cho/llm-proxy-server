# Architectural Concerns

LLM Proxy Server를 위한 구조적 설계 쟁점의 living registry이다.

## Summary

| ID | Title | Category | Status | Related ADRs | ASR (after ④) |
|----|-------|----------|--------|--------------|---------------|
| AC-001 | 프록시 API 계약과 호환 범위 | Integration & dependencies | designed | adr/proxy-api-compatibility.md | ASR-001 |
| AC-002 | 스트리밍 응답 처리 | Constraints (structural) | designed | adr/streaming-response-handling.md | ASR-002 |
| AC-003 | 트래픽 로그 저장 모델과 저장소 | Structure & organization | designed | adr/traffic-log-storage.md | ASR-003 |
| AC-004 | 민감정보 보호와 로그 보존 | Constraints (structural) | designed | adr/sensitive-data-retention.md | ASR-004 |
| AC-005 | 프록시 및 모니터링 UI 접근 통제 | Quality bar (architectural) | designed | adr/access-control.md | ASR-005 |
| AC-006 | 모니터링 UI의 조회 범위와 운영 기능 | Deliverable form | designed | adr/monitoring-ui-scope.md | ASR-006 |
| AC-007 | 배포 단위와 실행 구성 | Deliverable form | designed | adr/deployment-configuration.md | ASR-007 |
| AC-008 | API framework 선택과 서버 구조 | Structure & organization | designed | adr/api-framework-and-server-structure.md | ASR-010 |
| AC-009 | UI framework 선택과 확장 구조 | Deliverable form | designed | adr/ui-framework-and-monitoring-structure.md | ASR-011 |
| AC-010 | Provider 설정과 model routing 계약 | Integration & dependencies | designed | adr/provider-routing-configuration.md | ASR-012 |
| AC-011 | API adapter 확장 경계 | Structure & organization | designed | — | ASR-013 |
| AC-012 | API log writer와 UI read 경계 | Structure & organization | designed | adr/api-log-write-ui-read-boundary.md | ASR-014 |
| AC-013 | 구조 변경의 migration·회귀·실행 기준 | Quality bar (architectural) | designed | — | ASR-015 |
| AC-014 | 다중 API public contract와 payload 변환 경계 | Integration & dependencies | designed | adr/multi-api-contract-adapter-boundary.md | ASR-016 |
| AC-015 | Claude provider 인증·header 설정 계약 | Integration & dependencies | designed | adr/claude-provider-authentication-headers.md | ASR-017 |
| AC-016 | API별 streaming 종료·오류 계약 | Constraints (structural) | designed | adr/api-streaming-completion-and-error-contract.md | ASR-018 |
| AC-017 | 다중 API traffic log metadata 정규화 | Structure & organization | designed | adr/traffic-log-api-metadata.md | ASR-019 |
| AC-018 | Token usage·cost metadata 추출과 저장 | Integration & dependencies | designed | adr/usage-and-cost-metadata.md | ASR-020 |
| AC-019 | Turn grouping metadata와 저장 lifecycle | Structure & organization | designed | adr/turn-grouping-storage-lifecycle.md (approved) | ASR-021 |
| AC-020 | Turn/traffic 조회 API와 tree projection | Integration & dependencies | designed | adr/turn-traffic-query-tree-projection.md (approved) | ASR-025 |
| AC-021 | Sidebar 선택 상태와 메인 뷰 계약 | Deliverable form | designed | adr/sidebar-selection-main-view-contract.md (approved) | ASR-027 |
| AC-022 | Non-migration legacy traffic 호환 표시 | Constraints (structural) | designed | adr/legacy-traffic-tree-compatibility.md (approved) | ASR-026 |
| AC-023 | Turn grouping 순서·동시성·완료 판정 | Quality bar (architectural) | designed | adr/turn-order-concurrency-completion.md (approved) | ASR-022 |
| AC-024 | SSE 최종 응답 통합 저장 | Structure & organization | designed | adr/sse-final-response-aggregation.md (approved) | ASR-023 |
| AC-025 | Turn·traffic 관리 메타데이터 저장과 삭제 의미 | Structure & organization | reviewing | adr/turn-management-metadata-and-deletion.md (proposed) | — |
| AC-026 | 전체·flagged 필터의 조회 책임과 pagination 계약 | Integration & dependencies | identified | — | — |
| AC-027 | Turn summary와 traffic usage summary 데이터 계약 | Integration & dependencies | identified | adr/usage-and-cost-metadata.md (approved) | — |
| AC-028 | 긴 문자열 형식 표시와 안전한 전체 보기 | Constraints (structural) | identified | — | — |

## Dependency Order (recommended review path)

1. AC-001 → AC-002 → AC-003 → AC-004 → AC-005 → AC-006 → AC-007
2. AC-008 → AC-009 → AC-010 → AC-011 → AC-012 → AC-013
3. AC-014 → AC-015 → AC-016 → AC-017 → AC-018
4. AC-019 → AC-023 → AC-024 → AC-020 → AC-022 → AC-021
5. AC-025 → AC-026 → AC-027 → AC-028

## AC Detail

### AC-001 — 프록시 API 계약과 호환 범위

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** 프록시가 어떤 OpenAI 호환 엔드포인트, 요청 형식, 응답 형식, 오류 형식, 헤더 전달 규칙을 지원해야 하는가?
- **Why it matters:** 계약 범위를 잘못 정하면 클라이언트 호환성이 깨지거나 필요 이상의 API를 구현하게 된다.
- **Depends on:** —
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option A를 채택한다. 초기 deliverable은 `/v1/responses` 중심의 최소 OpenAI 호환 계약을 지원하며, 요청·응답·오류 형식과 필요한 헤더 전달 규칙을 Spec에 명시한다. Chat Completions와 Claude Messages API는 후속 확장 범위로 deferred한다.

### AC-002 — 스트리밍 응답 처리

- **Category:** Constraints (structural)
- **Status:** designed
- **Statement:** 제공자의 스트리밍 응답을 프록시가 지원할 것인지, 지원한다면 클라이언트까지 어떤 방식으로 전달하고 로그에 어떻게 기록할 것인가?
- **Why it matters:** 스트리밍은 연결 수명, 오류 처리, 로그 완결성, UI 표시 방식에 직접 영향을 준다.
- **Depends on:** AC-001
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option A를 채택한다. Provider의 SSE 이벤트를 클라이언트에 전달하고, 스트림 종료 시 최종 상태와 집계된 요청·응답 로그를 저장한다. 전송 오류나 연결 종료 시 부분 결과를 `failed` 상태의 집계 로그로 저장하며, 실시간 UI 갱신과 재처리는 후속 범위로 둔다.

### AC-003 — 트래픽 로그 저장 모델과 저장소

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** 요청·응답 쌍, 메타데이터, 오류, 스트리밍 청크를 어떤 데이터 모델과 저장소에 기록하고 조회할 것인가?
- **Why it matters:** 저장소 선택은 검색성, 설치 복잡도, 데이터 일관성, 향후 확장 비용을 결정한다.
- **Depends on:** AC-001, AC-002
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option A를 채택한다. SQLite 파일에 로그 메타데이터와 JSON 요청·응답 본문을 저장하며, 목록·상세·시간순 정렬·페이지네이션 조회를 SQL로 제공한다. 민감정보 마스킹과 본문 크기 제한은 AC-004 결정에 따른다.

### AC-004 — 민감정보 보호와 로그 보존

- **Category:** Constraints (structural)
- **Status:** designed
- **Statement:** API 키·Authorization 헤더·프롬프트 등 민감할 수 있는 데이터를 무엇을 마스킹·암호화·제외하고 얼마 동안 보존할 것인가?
- **Why it matters:** 로그가 운영 가치를 가지면서도 인증정보 유출과 불필요한 민감정보 저장을 막아야 한다.
- **Depends on:** AC-003
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option A를 채택한다. Authorization, API 키, 쿠키 등 알려진 비밀 헤더를 저장 전에 마스킹하고, 요청·응답 JSON 본문은 설정 가능한 최대 크기까지 저장하며 초과분은 잘라낸다. UI에는 마스킹된 저장 결과만 표시한다. 초기에는 자동 TTL 삭제를 제공하지 않는다.

### AC-005 — 프록시 및 모니터링 UI 접근 통제

- **Category:** Quality bar (architectural)
- **Status:** designed
- **Statement:** 프록시 엔드포인트와 모니터링 UI에 어떤 최소 인증·접근 통제를 적용할 것인가?
- **Why it matters:** 인증 없는 프록시는 비용·오용 위험을 만들고, 로그 UI는 저장된 트래픽을 노출할 수 있다.
- **Depends on:** AC-004
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option B를 채택한다. 초기 제품은 프록시와 모니터링 UI를 localhost에만 바인딩하고 별도 인증을 적용하지 않는다. 외부 네트워크 노출과 사용자별 RBAC는 초기 범위에서 제외한다.

### AC-006 — 모니터링 UI의 조회 범위와 운영 기능

- **Category:** Deliverable form
- **Status:** designed
- **Statement:** UI에서 목록·상세 외에 어떤 필터, 검색, 상태·지연시간 표시, 새로고침 방식을 초기 범위에 포함할 것인가?
- **Why it matters:** UI 범위를 정하지 않으면 구현량과 운영 효용 사이의 균형이 흔들린다.
- **Depends on:** AC-003, AC-004, AC-005
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option A를 채택한다. UI는 로그 목록, 시간순 정렬, 상태·모델·기간 필터, 페이지네이션, 개별 로그 상세를 제공한다. 전문 검색, 차트, 자동 새로고침, 실시간 스트리밍 화면은 후속 범위로 둔다.

### AC-007 — 배포 단위와 실행 구성

- **Category:** Deliverable form
- **Status:** designed
- **Statement:** 프록시 API, 로그 저장소, 모니터링 UI를 하나의 실행 단위로 제공할지 분리할지, 로컬 실행에 필요한 의존성을 어떻게 구성할 것인가?
- **Why it matters:** 배포 형태는 개발·검증 난이도와 사용자가 실제로 실행할 수 있는지에 영향을 준다.
- **Depends on:** AC-003, AC-005, AC-006
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** Option A를 채택한다. 하나의 서버 프로세스가 프록시 API, 로그 API, 정적 UI를 제공하고 SQLite 파일을 로컬 데이터 디렉터리에 저장한다. 코드 내부 기능 모듈은 분리해 후속 확장 경로를 유지한다.

### AC-008 — API framework 선택과 서버 구조

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** 직접 Node HTTP 라우팅을 유지할지 Fastify·Hono 등 framework를 도입할지, 선택한 경우 bootstrap·middleware·routing·plugin/module 경계를 어떻게 나눌 것인가?
- **Why it matters:** framework 선택과 서버 구조는 route 확장성, TypeScript·테스트성, streaming/SSE 제어, 의존성 비용 및 기존 MVP migration 난이도를 결정한다.
- **Depends on:** AC-001, AC-002
- **Related ADRs:**
  - `adr/api-framework-and-server-structure.md` — approved
- **Resolution path:** adr
- **Resolution:** Option B — Fastify를 도입한다. Fastify instance를 bootstrap에서 생성하고 route plugin 단위로 API adapter와 관리 API를 등록한다. TypeScript route schema·plugin 구조·테스트 지원을 활용하며, 기존 SSE 정상 종료·client disconnect·upstream failure 회귀 검증을 migration DoD에 포함한다.

  ### AC-009 — UI framework 선택과 확장 구조

- **Category:** Deliverable form
- **Status:** designed
- **Statement:** 정적 HTML을 유지할지 React·Vue·Svelte 등 component framework를 도입할지, 선택한 UI의 page·component·data-query 경계를 어떻게 구성할 것인가?
- **Why it matters:** log list/detail과 content 표시를 넘어 분석·report·chart를 추가할 때 확장성, 번들 크기, 운영 복잡도, 기존 UI migration 비용이 달라진다.
- **Depends on:** AC-006, AC-007
- **Related ADRs:**
  - `adr/ui-framework-and-monitoring-structure.md` — approved
- **Resolution path:** adr
- **Resolution:** Option B — React를 도입한다. page/component/data-query 모듈로 로그 목록·상세·content viewer를 구성하고 향후 분석·report·chart를 독립 feature로 확장한다. UI는 로그 API로만 조회하며 DB driver를 bundle하지 않는다.

  ### AC-010 — Provider 설정과 model routing 계약

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** provider의 base URL·API key와 client model ID → provider·provider model ID 매핑을 어떤 설정 스키마와 secret loading 방식으로 표현하고, 미등록 model·잘못된 설정을 어떻게 처리할 것인가?
- **Why it matters:** routing 계약은 복수 provider 지원의 호환성, 설정 오류의 검출 시점, 인증정보 보호 및 향후 provider 추가 비용을 결정한다.
- **Depends on:** AC-001, AC-004
- **Related ADRs:**
  - `adr/provider-routing-configuration.md` — approved
  - **Resolution path:** adr
  - **Resolution:** Option B — 설정 파일의 `providers`·`models` 섹션에 provider URL과 client model ID → `{ provider, providerModel }` 매핑을 정의하고 API key는 환경변수 참조로 로드한다. 서버 시작 전에 설정을 검증하고 미등록 model은 4xx로 거부하며 secret은 오류·로그·UI에 노출하지 않는다.

  ### AC-011 — API adapter 확장 경계

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** Responses·Chat Completions·Messages 및 향후 API를 별도 adapter/route contract로 추가하면서 provider routing·log persistence와 직접 결합되지 않도록 어떤 경계를 둘 것인가?
- **Why it matters:** adapter 경계가 불명확하면 API별 payload·streaming 차이가 핵심 서버와 저장소로 새고, 새 API 추가 때 회귀 범위와 결합도가 커진다.
- **Depends on:** AC-008, AC-010
- **Related ADRs:** 없음
- **Resolution path:** direct-input
- **Resolution:** API별 adapter는 route/payload 변환과 provider 요청·응답 변환만 담당한다. 공통 application service는 client model ID를 routing contract로 전달하고 adapter는 provider client를 직접 선택하지 않는다. 로그 저장은 공통 `TrafficLogWriter` port를 통해 수행한다. Responses·Chat Completions·Messages는 독립 adapter/plugin으로 등록하며, 향후 API 추가는 새 adapter와 route contract를 추가하는 방식으로 진행한다. 실제 Chat Completions·Messages 구현은 후속 구현 스프린트 범위로 둔다.

### AC-012 — API log writer와 UI read 경계

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** API request path의 log writer와 UI query path의 read repository/query service를 어떤 port·repository·공통 domain model로 분리하고, SQLite schema·migration·redaction·본문 크기 제한 책임을 어디에 둘 것인가?
- **Why it matters:** 쓰기 경로와 조회 경로를 직접 결합하면 API 처리와 UI 요구사항이 서로의 변경을 강제하고, 민감정보 보호·migration 책임이 분산된다.
- **Depends on:** AC-003, AC-004, AC-009
- **Related ADRs:**
  - `adr/api-log-write-ui-read-boundary.md` — approved
  - **Resolution path:** adr
  - **Resolution:** Option B — 공통 domain 계층에 traffic log model과 redaction·size limit policy를 두고, API application service는 `TrafficLogWriter`, UI query service는 `TrafficLogReader` port에만 의존한다. SQLite adapter가 schema·migration과 두 port 구현을 소유하며, API/UI는 DB connection/table에 직접 접근하지 않는다. 초기에는 동일 SQLite 파일과 프로세스로 strong consistency를 유지한다.

  ### AC-013 — 구조 변경의 migration·회귀·실행 기준

- **Category:** Quality bar (architectural)
- **Status:** designed
- **Statement:** 모듈 분리와 schema 변경이 기존 MVP 동작을 보존했음을 어떤 migration 순서, 자동화 회귀 검증, 단일 프로세스 실행 문서로 입증할 것인가?
- **Why it matters:** 설계 변경은 기능 회귀와 실행 불능 위험을 만들 수 있으므로 구현 전에 검증 범위와 실행 계약을 고정해야 한다.
- **Depends on:** AC-008, AC-009, AC-010, AC-011, AC-012
- **Related ADRs:** 없음
- **Resolution path:** direct-input
- **Resolution:** migration은 기존 동작 회귀 테스트 고정, domain/configuration/persistence 분리, Fastify bootstrap·adapter 도입, provider routing 연결, writer/reader와 SQLite adapter 연결, React build/static delivery 연결, schema/data compatibility 검증 순서로 진행한다. 자동화 검증은 정상·실패 proxy, SSE 정상·중단, provider/model routing, SQLite write/read, redaction·size limit, 로그 API, UI list/detail을 포함한다. `npm run build`와 `npm run verify`를 단일 검증 진입점으로 유지하고, 설정·SQLite 경로·host/port·build/start 절차를 문서화한다. schema migration 실패나 필수 설정 누락 시 listen 전에 종료한다. 실제 구현은 다음 implementation sprint에서 수행한다.

### AC-014 — 다중 API public contract와 payload 변환 경계

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** Responses, OpenAI Chat Completions, Claude Messages를 어떤 public route와 provider endpoint 계약으로 노출하며, 요청·응답 payload를 투명 전달할지 API별 adapter에서 변환할지 결정해야 하는가?
- **Why it matters:** API 계약을 잘못 정하면 기존 클라이언트 호환성이 깨지고, API별 차이가 공통 application service와 로그 저장 계층으로 새어 향후 provider/API 추가 비용이 커진다.
- **Depends on:** AC-011
- **Related ADRs:**
  - `adr/multi-api-contract-adapter-boundary.md` — approved
- **Resolution path:** adr
- **Resolution:** Option A — Transparent pass-through. 각 public API 요청과 provider 응답은 가능한 한 해당 provider 계약 그대로 전달한다. Provider가 해당 API를 지원하지 않거나 endpoint가 실패하면 provider의 오류를 client가 식별 가능한 오류로 반환하며, proxy가 API 간 canonical payload 변환을 수행하지 않는다.

### AC-015 — Claude provider 인증·header 설정 계약

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** Claude Messages provider에 API key, `anthropic-version` 등 API별 필수 header를 어떤 provider configuration schema와 secret loading 방식으로 표현하고 전달할 것인가?
- **Why it matters:** OpenAI Bearer 인증과 Claude 인증 방식은 다르며, 설정을 잘못 추상화하면 인증 실패·secret 노출·provider별 예외 코드 확산이 발생한다.
- **Depends on:** AC-010
- **Related ADRs:**
  - `adr/claude-provider-authentication-headers.md` — approved
- **Resolution path:** adr
- **Resolution:** Bearer를 기본 upstream 인증으로 사용한다. Claude Messages payload를 지원하더라도 기본적으로 `Authorization: Bearer <api-key>`를 구성한다. 공식 Anthropic endpoint처럼 native 인증이 필요한 provider는 설정에서 `anthropic` 인증 모드를 선택해 `x-api-key`와 provider가 지정한 `anthropic-version`을 사용한다. 기존 `apiKeyEnv` process environment secret loading과 redaction 정책은 유지한다.

### AC-016 — API별 streaming 종료·오류 계약

- **Category:** Constraints (structural)
- **Status:** designed
- **Statement:** Chat Completions와 Claude Messages의 SSE event, 정상 종료 sentinel, upstream 오류, client disconnect를 어떻게 전달하고 완료/실패 로그로 판정할 것인가?
- **Why it matters:** 현재 Responses 전용 종료 판정은 API별 event schema와 맞지 않을 수 있으며, 잘못된 판정은 부분 응답을 completed로 저장하거나 정상 stream을 failed로 기록할 수 있다.
- **Depends on:** AC-014
- **Related ADRs:**
  - `adr/api-streaming-completion-and-error-contract.md` — approved
- **Resolution path:** adr
- **Resolution:** Option A — API-specific completion detectors with transparent streaming. API kind별 정상 종료 event/sentinel을 감지하고 원본 SSE bytes는 그대로 client에 전달한다. Chat Completions는 `data: [DONE]`, Claude Messages는 `message_stop`, Responses는 기존 `response.completed` 또는 `[DONE]`를 정상 종료 기준으로 사용한다. Sentinel/event 이전 종료, upstream 오류, client disconnect는 `failed`로 기록하고 부분 결과를 보존한다.

### AC-017 — 다중 API traffic log metadata 정규화

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** 서로 다른 API 계약의 요청·응답·streaming traffic을 기존 SQLite log model에 어떤 API kind, provider, model, status 및 raw content metadata로 기록할 것인가?
- **Why it matters:** API 종류를 잃으면 운영자가 traffic을 구분할 수 없고, API별 raw payload를 보존하지 않으면 디버깅·회귀 검증이 어려워진다.
- **Depends on:** AC-014, AC-016
- **Related ADRs:**
  - `adr/traffic-log-api-metadata.md` — approved
- **Resolution path:** adr
- **Resolution:** Option B — Add first-class `api_kind` column. Traffic log table과 domain model에 `api_kind`를 추가하고 Responses, Chat Completions, Messages를 구분한다. 기존 Responses row와 기존 호출 경로에는 `responses` 기본값을 사용해 migration compatibility를 유지한다. API별 raw request/response body는 기존 bounded JSON/text 정책으로 보존하며 API 간 변환하지 않는다.

### AC-018 — Token usage·cost metadata 추출과 저장

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** Responses, Chat Completions, Claude Messages의 서로 다른 usage 응답에서 input tokens, cached input tokens, output tokens, total tokens 및 dollar cost를 어떻게 추출·정규화·저장할 것인가?
- **Why it matters:** API별 usage 필드명이 다르고 cost는 provider가 직접 제공하지 않거나 모델별 가격표가 필요할 수 있어, 잘못된 계산은 운영·비용 판단을 왜곡한다.
- **Depends on:** AC-014, AC-017
- **Related ADRs:**
  - `adr/usage-and-cost-metadata.md` — approved
  - **Resolution path:** adr
  - **Resolution:** Option A — provider-reported cost only. API별 usage를 `input_tokens`, `cached_input_tokens`, `output_tokens`로 정규화하고 `total_tokens = input_tokens + output_tokens`로 계산한다. `cost_usd`는 provider가 명시한 USD 비용만 저장하며, 비용이 없거나 통화가 불명확하면 `NULL`로 둔다. Proxy-owned pricing table은 도입하지 않는다.

### AC-019 — Turn grouping metadata와 저장 lifecycle

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** client/harness 변경 없이 proxy가 traffic request/response를 분석해 turn의 부모 관계를 어떤 domain model, writer contract, SQLite schema로 저장하며 turn은 언제 생성·갱신·완료되는가?
- **Why it matters:** turn 경계와 저장 lifecycle이 불명확하면 하나의 사용자 요청이 여러 turn으로 분리되거나 서로 다른 요청이 잘못 묶인다.
- **Depends on:** AC-003, AC-012
- **Related ADRs:**
  - `adr/turn-grouping-storage-lifecycle.md` — approved
- **Resolution path:** adr
- **Resolution:** Client와 harness는 변경하지 않는다. Proxy가 API별 semantic adapter로 traffic request/response를 분석해 tool call과 대응하는 tool message를 식별한다. response에 tool call이 있으면 turn은 진행 중이고, tool call이 없는 response면 turn을 종료한다. 다음 request에 이전 response의 tool call들에 대한 tool message가 있으면 같은 turn의 다음 traffic으로 연결한다. 복수 tool call/tool message는 tool call ID 기준으로 매칭하며 응답 순서는 보장하지 않는다. 표준 adapter contract는 request의 tool result identities, response의 tool call identities/`hasToolCalls`, stream aggregator factory를 제공하고 API별 최종 response JSON은 adapter가 생성한다. turn grouping과 상태는 proxy가 저장·조회 가능한 traffic metadata/projection으로 관리한다.

### AC-020 — Turn/traffic 조회 API와 tree projection

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** UI가 sidebar tree를 구성할 수 있도록 turn과 traffic을 어떤 조회 API 응답 모델, 정렬, pagination 및 계층 projection으로 제공할 것인가?
- **Why it matters:** flat traffic API를 그대로 재사용할지 별도 tree endpoint를 둘지에 따라 query 복잡도, 성능, UI 결합도가 달라진다.
- **Depends on:** AC-019
- **Related ADRs:**
  - `adr/turn-traffic-query-tree-projection.md` — approved
- **Resolution path:** adr
- **Resolution:** `GET /api/v1/turns` tree 전용 aggregate endpoint를 제공한다. turn 단위 pagination과 child traffic summary를 sequence 순으로 반환하며 request/response 본문은 포함하지 않는다. traffic 본문은 선택 시 기존 detail API로 지연 조회하고 turn 선택은 tree 응답의 summary/child 관계를 사용한다.


### AC-021 — Sidebar 선택 상태와 메인 뷰 계약

- **Category:** Deliverable form
- **Status:** designed
- **Statement:** sidebar에서 turn 또는 traffic을 선택했을 때 URL/state를 어떻게 표현하고 메인 뷰에 각각 어떤 요약·상세 내용을 표시할 것인가?
- **Why it matters:** 선택 상태와 표시 계약이 없으면 새로고침·뒤로가기·직접 링크 동작이 흔들리고 turn 선택과 traffic 선택의 UX가 일관되지 않는다.
- **Depends on:** AC-020
- **Related ADRs:**
  - `adr/sidebar-selection-main-view-contract.md` — approved
- **Resolution path:** adr
- **Resolution:** 선택 상태를 URL query/route로 표현하고 turn 선택과 traffic 선택을 구분한다. turn 선택 시 turn summary, 상태, traffic 개수/순서와 child 목록을 표시한다. traffic 선택 시 기존 `LogDetail`로 request/response/error/metadata를 조회한다. URL state로 새로고침과 browser back/forward를 지원하며 stable turn/traffic ID를 사용한다.


### AC-022 — Non-migration legacy traffic 호환 표시

- **Category:** Constraints (structural)
- **Status:** designed
- **Statement:** 기존 schema/data를 migration하지 않고 turn metadata가 없는 traffic을 tree에서 어떻게 표현하며 기존 flat 목록·상세 조회와 어떤 호환성을 유지할 것인가?
- **Why it matters:** migration을 하지 않기로 한 결정이 기존 데이터의 유실·중복 표시·조회 불능으로 이어지지 않도록 명시적 fallback이 필요하다.
- **Depends on:** AC-019, AC-020
- **Related ADRs:**
  - `adr/legacy-traffic-tree-compatibility.md` — approved
- **Resolution path:** adr
- **Resolution:** turn metadata가 없는 각 traffic을 `/api/v1/turns`에서 `kind: "legacy"`인 synthetic single-traffic turn으로 표시한다. child traffic 하나를 연결하고 실제 grouping 결과가 아님을 표시한다. 기존 flat logs list/detail API는 유지하며 legacy traffic 간의 과거 turn 관계는 추론하지 않는다.


### AC-023 — Turn grouping 순서·동시성·완료 판정

- **Category:** Quality bar (architectural)
- **Status:** designed
- **Statement:** 같은 turn 안의 traffic 순서를 어떤 기준으로 보장하고, tool call에 대한 harness 재요청이 진행 중인 turn을 어떻게 조회·표시하며, 최종 답변 traffic 이후 turn 완료를 어떻게 판정·검증할 것인가?
- **Why it matters:** 순서·진행 상태·완료 판정이 불안정하면 tree가 실제 LLM interaction 흐름을 잘못 보여준다.
- **Depends on:** AC-019
- **Related ADRs:**
  - `adr/turn-order-concurrency-completion.md` — approved
  - `adr/ambiguous-missing-tool-id-fallback.md` — approved
  - **Resolution path:** adr
  - **Resolution:** Proxy는 여러 미완료 turn을 동시에 유지하고 각 turn의 미해결 tool call ID를 역색인한다. incoming request의 tool message ID가 하나의 미완료 turn에 유일하게 일치하면 해당 turn에 traffic을 연결하며, 복수 tool message의 도착 순서는 tool call 순서와 무관하게 ID 기준으로 처리한다. identity가 없거나 어떤 turn에도 매칭되지 않거나 여러 미완료 turn에 모호하게 매칭되면 기존 turn에 연결하지 않고 새 standalone turn의 첫 traffic으로 저장하며 `missing_tool_identity`, `unmatched_tool_identity`, `ambiguous_tool_identity` 중 하나의 fallback reason을 기록한다. 이 경우에도 request는 upstream으로 전달하고 traffic을 저장한다. response에 tool call이 없으면 해당 turn을 완료하고 이후 traffic에 연결하지 않는다. traffic sequence는 proxy가 관찰한 저장 순서를 사용한다.


### AC-024 — SSE 최종 응답 통합 저장

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** SSE streaming traffic을 client에는 원본 event 흐름으로 전달하면서, 저장 시에는 개별 `data` event를 나열하지 않고 API별 규칙에 따라 최종 응답 하나로 통합하려면 어떤 누적·병합·완료 시점 계약을 사용할 것인가?
- **Why it matters:** event stream을 그대로 저장하면 기존 traffic 상세가 최종 응답으로 재사용되지 않고 저장량과 조회 복잡도가 증가하며, API별 content/tool call/usage 결과가 누락되거나 중복될 수 있다.
- **Depends on:** AC-002, AC-016, AC-019
- **Related ADRs:**
  - `adr/streaming-response-handling.md` — approved
  - `adr/sse-final-response-aggregation.md` — approved
- **Resolution path:** adr
- **Resolution:** API별 adapter가 SSE event를 API별 규칙으로 누적한다. content delta는 순서대로 병합하고 복수 tool call delta는 tool call ID 기준으로 병합하며 usage와 finish metadata를 반영한다. 표준 adapter contract의 stream aggregator가 이 lifecycle을 제공한다. 정상 종료 시 provider API 계약에 맞는 최종 response JSON 하나를 저장하고 개별 `data` event 배열은 저장하지 않는다. client에는 원본 SSE bytes를 투명하게 전달한다. 정상 종료 전 upstream failure 또는 client disconnect가 발생하면 중단 시점의 partial aggregate를 `response_json`에 저장하고 status를 `failed`로 기록하며 원인은 `error`에 저장한다.

### AC-025 — Turn·traffic 관리 메타데이터 저장과 삭제 의미

- **Category:** Structure & organization
- **Status:** designed
- **Statement:** 사용자가 편집한 turn·traffic 제목과 flag 상태를 기존 traffic 본문·lifecycle 원본과 분리해 어떤 저장 모델로 영구화하고, turn 삭제를 어떤 물리 삭제와 cascade 규칙으로 처리할 것인가?
- **Why it matters:** 관리 메타데이터를 원본에 덮어쓰거나 turn 삭제 범위를 암묵적으로 정하면 조회·검색·저장 공간·turn 관계의 일관성이 깨질 수 있다.
- **Depends on:** AC-019, AC-020
- **Related ADRs:**
  - `adr/turn-management-metadata-and-deletion.md` — approved
- **Resolution path:** adr + direct-input
- **Resolution:** ADR Option B를 채택한다. `turns`와 `traffic_logs`에 제목·flag 같은 관리 컬럼을 추가하되 request/response JSON과 lifecycle 원본은 변경하지 않는다. 삭제 단위는 turn만 제공하며, turn 삭제 시 해당 turn의 모든 child traffic과 turn row를 하나의 transaction에서 물리 삭제한다. traffic 단독 삭제, 논리 삭제, 복원, 삭제 이력은 제공하지 않는다.

### AC-026 — 전체·flagged 필터의 조회 책임과 pagination 계약

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** 전체·flagged 등 sidebar 필터를 서버 query가 책임질지 UI가 현재 page에서 필터링할지, flag 변경·삭제와 pagination 경계에서 어떤 일관성·정렬·page size 계약을 제공할 것인가?
- **Why it matters:** UI 임의 필터링은 전체 결과를 누락할 수 있고, 서버 필터링의 계약이 없으면 flagged 탐색·페이지 이동·변경 직후 결과가 재현되지 않는다.
- **Depends on:** AC-020, AC-025
- **Related ADRs:**
  - `adr/turn-filter-pagination-contract.md` — approved
- **Resolution path:** adr
- **Resolution:** ADR Option A를 채택한다. `GET /api/v1/turns`가 전체와 flagged 필터를 서버에서 적용하고, 필터 적용 후 top-level turn node를 기준으로 `total`, `page`, `limit`, `has_next`를 계산한다. child traffic은 parent turn 내부에 반환하며 child 자체는 pagination하지 않는다. flag 변경 또는 turn 삭제 성공 후 UI는 현재 query를 재조회하고, 빈 page는 마지막 유효 page로 보정한다.

### AC-027 — Turn summary와 traffic usage summary 데이터 계약

- **Category:** Integration & dependencies
- **Status:** designed
- **Statement:** turn summary의 시작 user input·종료 AI output·모델·실행 환경·처리 시간과 전체/traffic별 usage·cost를 어떤 query projection과 null/partial 데이터 규칙으로 제공하고 표시할 것인가?
- **Why it matters:** 여러 traffic의 값 선택·집계·누락 처리가 정해지지 않으면 summary가 서로 다른 화면에서 다르게 계산되거나 partial/in-progress turn을 오해하게 만든다.
- **Depends on:** AC-018, AC-020, AC-023
- **Related ADRs:**
  - `adr/usage-and-cost-metadata.md` — approved
  - `adr/turn-summary-usage-projection.md` — approved
- **Resolution path:** adr
- **Resolution:** ADR Option A를 채택한다. 서버 query service가 turn과 child traffic에서 summary DTO를 생성한다. 시작 user input은 첫 traffic에서, 종료 AI output은 마지막 completed traffic에서 선택한다. usage·cost는 child traffic의 non-null 값을 합산하고 값이 하나도 없으면 `null`, 일부 traffic에만 값이 있으면 partial 상태와 함께 반환한다. UI는 계산 규칙을 재구현하지 않으며 provider가 보고하지 않은 cost를 추정하지 않는다.

### AC-028 — 긴 문자열 형식 표시와 안전한 전체 보기

- **Category:** Constraints (structural)
- **Status:** reviewing
- **Statement:** request/response의 긴 문자열을 언제 축약하고 어떤 기준으로 Markdown·JSON·JavaScript 등을 표시하며, 전체 보기와 불확실·지원 불가 형식의 fallback을 XSS·임의 실행 없이 어떻게 제공할 것인가?
- **Why it matters:** renderer 선택은 읽기 편의성과 보안에 동시에 영향을 주며, 형식 오인식이나 실행 가능한 표시가 저장된 provider/client 데이터의 위험을 높일 수 있다.
- **Depends on:** AC-004, AC-021, AC-025
- **Related ADRs:**
  - `adr/long-string-safe-rendering.md` — proposed
- **Resolution path:** adr
- **Resolution:** 아직 미정.


## Notes

- 2026-03-10: 승인된 PRD를 바탕으로 초기 blocking AC 7개를 식별했다.
- 2026-03-10: 승인된 PRD delta를 바탕으로 AC-008~AC-013을 추가 식별했다. 기존 AC-003(저장 모델)과 구분하여 AC-012는 API write/UI read의 access boundary에 집중한다.
- 2026-03-10: Turn grouping·tree UI delta에 대해 AC-019~AC-023을 추가 식별했다.
- 2026-03-10: SSE streaming 저장 응답을 최종 통합 응답 하나로 제한하기 위해 AC-024를 추가 식별했다.
- 2026-03-10: 사용자 결정으로 AC-019를 designed 처리했다. client/harness 변경 없이 proxy semantic grouping을 사용하며, 복수 tool call/tool message는 ID 기준으로 매칭하고 순서는 보장하지 않는다.
- 2026-03-10: Turn 관리·분석 UI PRD delta 승인에 따라 AC-025~AC-028을 identified로 추가했다. 관리 메타데이터 저장·삭제, 서버 필터·페이지네이션, summary/usage projection, 안전한 형식별 renderer가 이번 review의 blocking concern이다.
- 2026-03-10: AC 목록 승인 후 AC-025를 reviewing으로 전환하고 `adr/turn-management-metadata-and-deletion.md`를 proposed 상태로 연결했다.
- 2026-03-10: 사용자 입력으로 AC-025의 삭제 의미를 확정했다. traffic 단독 삭제는 지원하지 않고, turn 삭제는 모든 child traffic을 포함한 물리 삭제로 처리하며 논리 삭제·복원·삭제 이력은 제공하지 않는다. 제목·flag 저장 위치는 ADR Option A/B의 잔여 쟁점으로 남겼다.
- 2026-03-10: 사용자 go-ahead("B로 해줘")로 AC-025를 designed 처리하고 Option B를 채택했다. AC-026을 reviewing으로 전환하고 `adr/turn-filter-pagination-contract.md`를 proposed 상태로 연결했다.
- 2026-03-10: 사용자 go-ahead("ok")로 AC-026의 Option A를 승인하고 designed 처리했다. filter query shape은 downstream ADR 후보로 남겼다. AC-027을 reviewing으로 전환하고 `adr/turn-summary-usage-projection.md`를 proposed 상태로 연결했다.
- 2026-03-10: 사용자 go-ahead("ok")로 AC-027의 Option A를 승인하고 designed 처리했다. summary extraction과 partial representation은 downstream ADR 후보로 남겼다. AC-028을 reviewing으로 전환하고 `adr/long-string-safe-rendering.md`를 proposed 상태로 연결했다.
- 2026-03-10: 사용자 go-ahead("ok")로 AC-023의 Option B를 승인했다. 미완료 turn pool, tool-call ID 역색인, 관찰 순서 기반 traffic sequence를 사용한다.
- 2026-03-10: 사용자 go-ahead("ok")로 후속 ADR `ambiguous-missing-tool-id-fallback.md`를 승인했다. 매칭 불가 traffic은 fallback reason과 함께 새 standalone turn으로 격리한다.
