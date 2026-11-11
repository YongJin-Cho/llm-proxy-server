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
| ASR-010 | Fastify 기반 API 모듈 구조 | AC-008 | AC-008 | adr/api-framework-and-server-structure.md |
| ASR-011 | React 기반 UI 확장 구조 | AC-009 | AC-009 | adr/ui-framework-and-monitoring-structure.md |
| ASR-012 | Provider 설정과 model routing | AC-010 | AC-010 | adr/provider-routing-configuration.md |
| ASR-013 | 독립 API adapter contract | AC-011 | AC-011 | — |
| ASR-014 | API write와 UI read port 분리 | AC-012 | AC-012 | adr/api-log-write-ui-read-boundary.md |
| ASR-015 | Migration·회귀·실행 검증 기준 | AC-013 | AC-013 | — |
| ASR-016 | 다중 API public contract와 payload 변환 경계 | AC-014 | AC-014 | adr/multi-api-contract-adapter-boundary.md |
| ASR-017 | Claude provider 인증·header 설정 계약 | AC-015 | AC-015 | adr/claude-provider-authentication-headers.md |
| ASR-018 | API별 streaming 종료·오류 계약 | AC-016 | AC-016 | adr/api-streaming-completion-and-error-contract.md |
| ASR-019 | 다중 API traffic log metadata 정규화 | AC-017 | AC-017 | adr/traffic-log-api-metadata.md |
| ASR-020 | Token usage·cost metadata 추출과 저장 | AC-018 | AC-018 | adr/usage-and-cost-metadata.md |
| ASR-021 | Proxy semantic turn grouping | AC-019 | AC-019 | adr/turn-grouping-storage-lifecycle.md |
| ASR-022 | Turn 동시성·순서·완료 판정 | AC-023 | AC-023 | adr/turn-order-concurrency-completion.md; adr/ambiguous-missing-tool-id-fallback.md |
| ASR-023 | SSE 최종·partial aggregate 저장 | AC-024 | AC-024 | adr/sse-final-response-aggregation.md; adr/partial-stream-aggregate-failure.md |
| ASR-024 | 표준 semantic·stream adapter contract | AC-019, AC-024 | AC-019, AC-024 | adr/standard-semantic-stream-adapter-interface.md |
| ASR-025 | Turn tree aggregate query API | AC-020 | AC-020 | adr/turn-traffic-query-tree-projection.md |
| ASR-026 | Legacy traffic non-migration compatibility | AC-022 | AC-022 | adr/legacy-traffic-tree-compatibility.md |
| ASR-027 | Sidebar selection and main-view contract | AC-021 | AC-021 | adr/sidebar-selection-main-view-contract.md |
| ASR-028 | Turn 관리 메타데이터와 삭제 계약 | AC-025 | AC-025 | adr/turn-management-metadata-and-deletion.md |
| ASR-029 | Turn 필터와 pagination query 계약 | AC-026 | AC-026 | adr/turn-filter-pagination-contract.md |
| ASR-030 | Turn summary와 usage projection | AC-027 | AC-027 | adr/usage-and-cost-metadata.md; adr/turn-summary-usage-projection.md |
| ASR-031 | 안전한 긴 문자열 viewer 계약 | AC-028 | AC-028 | adr/long-string-safe-rendering.md; adr/viewer-dependency-selection.md; adr/format-mode-contract.md |
| ASR-032 | Traffic summary provider·usage projection | Direct Input | — | — |
| ASR-033 | Turn note semantic contract | AC-029 | AC-029 | adr/turn-note-semantic-contract.md |
| ASR-034 | Turn analysis adapter boundary | AC-030 | AC-030 | adr/turn-note-adapter-boundary.md |
| ASR-035 | Completion 후 비동기 turn analysis lifecycle | AC-031 | AC-031 | adr/turn-note-analysis-lifecycle.md |
| ASR-036 | Turn note persistence projection | AC-032 | AC-032 | adr/turn-note-persistence-projection.md |
| ASR-037 | Note 실패 관찰성과 turn 완료 독립성 | AC-033 | AC-033 | adr/turn-note-failure-observability.md |
| ASR-038 | Turn view note card contract | AC-034 | AC-034 | — |
| ASR-039 | Tool history table and note card split | AC-035 | AC-035 | — |

## Dependency Order (recommended Spec encoding path)

1. ASR-001 → ASR-002 → ASR-003 → ASR-004 → ASR-005 → ASR-006 → ASR-007 → ASR-008 → ASR-009
2. ASR-010 → ASR-011 → ASR-012 → ASR-013 → ASR-014 → ASR-015
3. ASR-016 → ASR-017 → ASR-018 → ASR-019 → ASR-020
4. ASR-021 → ASR-022 → ASR-023 → ASR-024 → ASR-025 → ASR-026 → ASR-027
5. ASR-028 → ASR-029 → ASR-030 → ASR-031
6. ASR-033 → ASR-034 → ASR-035 → ASR-036 → ASR-037 → ASR-038

## ASR Detail

### ASR-001 — Responses API 프록시 계약
- **Source:** AC-001 — 프록시 API 계약과 호환 범위
- **Statement:** 프록시는 초기 범위에서 `/v1/responses` 중심의 OpenAI 호환 계약을 제공하고 요청·응답·오류 형식과 필요한 헤더 전달 규칙을 명시적으로 처리해야 한다. Chat Completions와 Claude Messages API는 후속 확장 범위다.
- **Decision summary:** Option A를 채택한다.
- **Related AC:** AC-001
- **Related ADRs:** `adr/proxy-api-compatibility.md` — approved

### ASR-002 — SSE 스트리밍 전달과 집계 로그
- **Source:** AC-002 — 스트리밍 응답 처리
- **Statement:** Provider SSE 이벤트를 클라이언트에 전달하고 스트림 종료 시 최종 상태와 집계 로그를 저장한다. 전송 오류나 연결 종료 시 부분 결과를 `failed`로 저장한다.
- **Decision summary:** Option A를 채택한다. 실시간 UI 갱신과 스트림 재처리는 후속 범위다.
- **Depends on:** ASR-001
- **Related AC:** AC-002
- **Related ADRs:** `adr/streaming-response-handling.md` — approved

### ASR-003 — SQLite 트래픽 로그 저장
- **Source:** AC-003 — 트래픽 로그 저장 모델과 저장소
- **Statement:** SQLite에 로그 메타데이터와 JSON 요청·응답 본문을 저장하고 목록·상세·시간순 정렬·페이지네이션 조회를 제공한다.
- **Decision summary:** Option A를 채택한다. request 수신 한도와 마스킹은 ASR-004를 따른다. 저장 request/response JSON은 전체 보존한다.
- **Depends on:** ASR-001, ASR-002
- **Related AC:** AC-003
- **Related ADRs:** `adr/traffic-log-storage.md` — approved

### ASR-004 — 민감정보 마스킹과 request/response 전체 보존
- **Source:** AC-004 — 민감정보 보호와 로그 보존
- **Statement:** Authorization, API key, cookie 등 비밀 헤더를 저장 전에 마스킹한다. `maxBodyBytes`는 request body 수신 한도로 적용하고, request/response JSON은 저장 시 잘라내지 않고 SQLite `TEXT`에 전체 보존한다. UI에는 마스킹된 결과만 표시한다.
- **Decision summary:** 사용자 Direct Input으로 저장 truncation을 제거한다. 초기에는 자동 TTL 삭제를 제공하지 않는다.
- **Depends on:** ASR-003
- **Related AC:** AC-004
- **Related ADRs:** `adr/sensitive-data-retention.md` — approved

### ASR-005 — localhost 접근 경계
- **Source:** AC-005 — 프록시 및 모니터링 UI 접근 통제
- **Statement:** 프록시와 모니터링 UI는 localhost에만 바인딩하고 별도 인증을 적용하지 않는다. 외부 노출과 RBAC는 초기 범위에서 제외한다.
- **Decision summary:** Option B를 채택한다.
- **Depends on:** ASR-004
- **Related AC:** AC-005
- **Related ADRs:** `adr/access-control.md` — approved

### ASR-006 — 기본 트래픽 모니터링 UI
- **Source:** AC-006 — 모니터링 UI의 조회 범위와 운영 기능
- **Statement:** UI는 로그 목록, 시간순 정렬, 상태·모델·기간 필터, 페이지네이션, 개별 상세를 제공한다. 전문 검색·차트·자동 새로고침·실시간 화면은 후속 범위다.
- **Decision summary:** Option A를 채택한다.
- **Depends on:** ASR-003, ASR-004, ASR-005
- **Related AC:** AC-006
- **Related ADRs:** `adr/monitoring-ui-scope.md` — approved

### ASR-007 — 단일 프로세스 실행 구성
- **Source:** AC-007 — 배포 단위와 실행 구성
- **Statement:** 하나의 서버 프로세스가 프록시 API, 로그 API, 정적 UI를 제공하고 SQLite를 로컬 데이터 디렉터리에 저장한다. 내부 기능 모듈은 분리한다.
- **Decision summary:** Option A를 채택한다.
- **Depends on:** ASR-003, ASR-005, ASR-006
- **Related AC:** AC-007
- **Related ADRs:** `adr/deployment-configuration.md` — approved

### ASR-008 — 요청·응답 전달과 오류 투명성
- **Source:** PRD — Goals, Scope, Success Criteria
- **Statement:** 구성된 클라이언트 요청은 Provider에 도달하고 성공 응답은 클라이언트에 반환되며 실패·Provider 오류는 추적 가능한 오류 응답과 로그 상태로 반환된다.
- **Depends on:** ASR-001, ASR-002, ASR-003

### ASR-009 — 자동화된 핵심 동작 검증
- **Source:** PRD — Success Criteria
- **Statement:** 정상·실패 프록시, 스트리밍, 로그 저장·조회, 민감정보 마스킹, UI 목록·상세 동작을 자동화된 검증으로 재현한다.
- **Depends on:** ASR-001 through ASR-008

### ASR-010 — Fastify 기반 API 모듈 구조
- **Source:** AC-008 — API framework 선택과 서버 구조
- **Statement:** Fastify instance를 bootstrap에서 생성하고 route plugin 단위로 API adapter와 관리 API를 등록한다. `server.ts`는 bootstrap·configuration·listen/shutdown lifecycle에 집중하며 TypeScript route schema와 plugin 구조를 사용한다.
- **Decision summary:** Option B — Fastify를 도입한다. 기존 SSE 정상 종료·client disconnect·upstream failure 회귀 검증을 migration DoD에 포함한다.
- **Related AC:** AC-008
- **Related ADRs:** `adr/api-framework-and-server-structure.md` — approved

### ASR-011 — React 기반 UI 확장 구조
- **Source:** AC-009 — UI framework 선택과 확장 구조
- **Statement:** React의 page/component/data-query 모듈로 로그 목록·상세·content viewer를 구성하고 향후 분석·report·chart를 독립 feature로 추가한다. UI는 로그 API로만 조회하며 DB driver를 bundle하지 않는다.
- **Decision summary:** Option B — React를 도입한다.
- **Depends on:** ASR-006, ASR-010
- **Related AC:** AC-009
- **Related ADRs:** `adr/ui-framework-and-monitoring-structure.md` — approved

### ASR-012 — Provider 설정과 model routing
- **Source:** AC-010 — Provider 설정과 model routing 계약
- **Statement:** 설정 파일의 `providers`·`models` 섹션에 provider URL과 client model ID → `{ provider, providerModel }` 매핑을 정의하고 API key는 환경변수 참조로 로드한다. 서버 시작 전에 설정을 검증하고 미등록 model은 4xx로 거부하며 secret은 노출하지 않는다.
- **Decision summary:** Option B — 설정 파일 + 환경변수 secret override.
- **Depends on:** ASR-001, ASR-004
- **Related AC:** AC-010
- **Related ADRs:** `adr/provider-routing-configuration.md` — approved

### ASR-013 — 독립 API adapter contract
- **Source:** AC-011 — API adapter 확장 경계
- **Statement:** API별 adapter는 route/payload 변환과 provider 요청·응답 변환만 담당하고, 공통 application service는 client model ID를 routing contract로 전달한다. 로그 저장은 `TrafficLogWriter` port를 통한다. Responses·Chat Completions·Messages는 독립 adapter/plugin으로 등록한다.
- **Decision summary:** Direct Input. 실제 Chat Completions·Messages 구현은 후속 implementation sprint 범위다.
- **Depends on:** ASR-010, ASR-012
- **Related AC:** AC-011

### ASR-014 — API write와 UI read port 분리
- **Source:** AC-012 — API log writer와 UI read 경계
- **Statement:** 공통 domain 계층에 traffic log model과 redaction·size limit policy를 두고 API application service는 `TrafficLogWriter`, UI query service는 `TrafficLogReader`에만 의존한다. SQLite adapter가 schema·migration과 두 port 구현을 소유한다.
- **Decision summary:** Option B — 별도 writer/query port와 SQLite adapter. API/UI의 직접 DB 접근을 금지하고 동일 SQLite 파일로 strong consistency를 유지한다.
- **Depends on:** ASR-003, ASR-004, ASR-011
- **Related AC:** AC-012
- **Related ADRs:** `adr/api-log-write-ui-read-boundary.md` — approved

### ASR-015 — Migration·회귀·실행 검증 기준
- **Source:** AC-013 — 구조 변경의 migration·회귀·실행 기준
- **Statement:** migration은 기존 회귀 테스트 고정, domain/configuration/persistence 분리, Fastify와 adapter 도입, provider routing 연결, writer/reader와 SQLite adapter 연결, React static delivery 연결, schema/data compatibility 검증 순서로 진행한다. 자동화 검증은 proxy·SSE·routing·SQLite·redaction·logs API·UI list/detail을 포함하고 `npm run build`와 `npm run verify`를 진입점으로 유지한다. 필수 설정 누락이나 migration 실패 시 listen 전에 종료한다.
- **Decision summary:** Direct Input. 실제 구현은 다음 implementation sprint에서 진행한다.
- **Depends on:** ASR-010, ASR-011, ASR-012, ASR-013, ASR-014
- **Related AC:** AC-013

### ASR-016 — 다중 API public contract와 payload 변환 경계
- **Source:** AC-014 — 다중 API public contract와 payload 변환 경계
- **Statement:** Responses, OpenAI Chat Completions, Claude Messages는 각 public API 계약과 provider endpoint 계약을 가능한 한 투명하게 전달한다. Proxy는 API 간 canonical payload 변환을 수행하지 않으며, provider 오류는 client가 식별 가능한 오류와 로그 상태로 전달한다.
- **Decision summary:** Option A — Transparent pass-through.
- **Depends on:** ASR-013
- **Related AC:** AC-014
- **Related ADRs:** `adr/multi-api-contract-adapter-boundary.md` — approved

### ASR-017 — Claude provider 인증·header 설정 계약
- **Source:** AC-015 — Claude provider 인증·header 설정 계약
- **Statement:** Upstream 인증은 Bearer를 기본으로 사용한다. 공식 Anthropic endpoint처럼 native 인증이 필요한 provider는 설정된 `anthropic` mode에 따라 `x-api-key`와 `anthropic-version`을 사용한다. 기존 `apiKeyEnv` 환경변수 secret loading과 redaction 정책을 유지한다.
- **Decision summary:** Bearer default with explicitly configured native Anthropic mode.
- **Depends on:** ASR-012
- **Related AC:** AC-015
- **Related ADRs:** `adr/claude-provider-authentication-headers.md` — approved

### ASR-018 — API별 streaming 종료·오류 계약
- **Source:** AC-016 — API별 streaming 종료·오류 계약
- **Statement:** API kind별 정상 종료를 감지하면서 원본 SSE bytes는 투명하게 전달한다. Responses는 `response.completed` 또는 `[DONE]`, Chat Completions는 `[DONE]`, Claude Messages는 `message_stop`을 정상 종료 기준으로 사용한다. 조기 종료, upstream 오류, client disconnect는 `failed`로 기록하고 부분 결과를 보존한다.
- **Decision summary:** Option A — API-specific completion detectors with transparent streaming.
- **Depends on:** ASR-016
- **Related AC:** AC-016
- **Related ADRs:** `adr/api-streaming-completion-and-error-contract.md` — approved

### ASR-019 — 다중 API traffic log metadata 정규화
- **Source:** AC-017 — 다중 API traffic log metadata 정규화
- **Statement:** Traffic log domain model과 SQLite table에 first-class `api_kind` column을 추가하고 Responses, Chat Completions, Messages를 구분한다. 기존 Responses row는 migration 시 `responses` 기본값을 사용한다. API별 raw request/response body는 기존 bounded JSON/text 정책으로 보존한다.
- **Decision summary:** Option B — Add first-class `api_kind` column.
- **Depends on:** ASR-016, ASR-018
- **Related AC:** AC-017
- **Related ADRs:** `adr/traffic-log-api-metadata.md` — approved

### ASR-020 — Token usage·cost metadata 추출과 저장
- **Source:** AC-018 — Token usage·cost metadata 추출과 저장
- **Statement:** API별 usage 응답을 `input_tokens`, `cached_input_tokens`, `output_tokens`로 정규화하고 `total_tokens = input_tokens + output_tokens`로 계산한다. `cost_usd`는 provider가 명시한 USD 비용만 저장하며, 비용이 없거나 통화가 불명확하면 `NULL`로 둔다. Proxy-owned pricing table은 도입하지 않는다.
- **Decision summary:** Option A — Provider-reported cost only.
- **Depends on:** ASR-019
- **Related AC:** AC-018
- **Related ADRs:** `adr/usage-and-cost-metadata.md` — approved

### ASR-021 — Proxy semantic turn grouping
- **Source:** AC-019 — Turn grouping metadata와 저장 lifecycle
- **Statement:** Client와 harness를 변경하지 않고 proxy가 API별 semantic adapter로 traffic request/response를 분석해야 한다. response에 tool call이 있으면 turn을 진행 중으로 유지하고, tool call이 없는 response면 turn을 종료한다. 다음 request에 이전 response의 tool call들에 대응하는 tool message가 있으면 같은 turn의 다음 traffic으로 연결한다. 복수 tool call/tool message는 tool call ID 기준으로 매칭하고 배열 순서는 의미 있는 순서로 가정하지 않는다.
- **Decision summary:** Proxy semantic grouping with API-specific adapters를 채택한다. Tool execution과 harness orchestration은 proxy 범위에 포함하지 않는다.
- **Depends on:** ASR-019
- **Related AC:** AC-019
- **Related ADRs:** `adr/turn-grouping-storage-lifecycle.md` — approved

### ASR-022 — Turn 동시성·순서·완료 판정
- **Source:** AC-023 — Turn grouping 순서·동시성·완료 판정
- **Statement:** Proxy는 여러 미완료 turn을 동시에 유지하고 각 turn의 미해결 tool call ID를 역색인해야 한다. incoming request의 tool message ID가 하나의 미완료 turn에 유일하게 매칭되면 해당 turn에 traffic을 연결하고, 복수 tool message의 도착 순서는 tool call 순서와 무관하게 ID 기준으로 처리한다. identity가 없거나 미매칭되거나 여러 미완료 turn에 모호하게 매칭되면 기존 turn에 연결하지 않고 새 standalone turn의 첫 traffic으로 저장하며 `missing_tool_identity`, `unmatched_tool_identity`, `ambiguous_tool_identity` 중 하나의 fallback reason을 기록해야 한다. 이 경우에도 request를 upstream으로 전달하고 traffic을 저장한다. response에 tool call이 없으면 turn을 완료하고 이후 traffic에 연결하지 않는다. traffic sequence는 proxy가 관찰한 저장 순서를 사용한다.
- **Decision summary:** 미완료 turn pool과 tool-call ID 역색인을 사용하며, 매칭 불가 traffic은 fallback reason과 함께 standalone turn으로 격리한다.
- **Depends on:** ASR-021
- **Related AC:** AC-023
- **Related ADRs:** `adr/turn-order-concurrency-completion.md` — approved; `adr/ambiguous-missing-tool-id-fallback.md` — approved

### ASR-023 — SSE 최종·partial aggregate 저장
- **Source:** AC-024 — SSE 최종 응답 통합 저장
- **Statement:** API별 adapter가 SSE event를 API별 규칙으로 누적하고 content delta를 순서대로 병합하며 복수 tool call delta를 tool call ID 기준으로 병합하고 usage/finish metadata를 반영해야 한다. 정상 종료 시 provider API 계약에 맞는 최종 response JSON 하나만 `response_json`에 저장하고 개별 `data` event 배열은 저장하지 않는다. 정상 종료 전 upstream failure 또는 client disconnect가 발생하면 중단 시점의 partial aggregate를 `response_json`에 저장하고 status를 `failed`로 기록하며 원인을 `error`에 저장한다. Client에는 원본 SSE bytes를 투명하게 전달한다.
- **Decision summary:** API별 adapter-owned final response aggregation과 failed partial aggregate 저장을 사용한다. Event-level persistence, retry/recovery, stream replay는 제공하지 않는다.
- **Depends on:** ASR-018, ASR-022
- **Related AC:** AC-024
- **Related ADRs:** `adr/sse-final-response-aggregation.md` — approved; `adr/partial-stream-aggregate-failure.md` — approved

### ASR-024 — 표준 semantic·stream adapter contract
- **Source:** AC-019, AC-024 — 승인된 후속 adapter concern
- **Statement:** 표준 adapter contract는 request의 tool result identities, response의 tool call identities와 `hasToolCalls`, stream aggregator factory를 제공해야 한다. 공통 proxy service는 이 semantic operation만 호출하며 API별 최종 response JSON 생성은 adapter가 담당한다. API 간 canonical response 변환은 수행하지 않는다.
- **Decision summary:** 최소 semantic + stream aggregate contract를 채택한다.
- **Depends on:** ASR-021, ASR-023
- **Related AC:** AC-019, AC-024
- **Related ADRs:** `adr/standard-semantic-stream-adapter-interface.md` — approved

### ASR-025 — Turn tree aggregate query API
- **Source:** AC-020 — Turn/traffic 조회 API와 tree projection
- **Statement:** `GET /api/v1/turns` tree 전용 aggregate endpoint를 제공해야 한다. 응답은 turn 단위 pagination과 child traffic summary를 포함하고 child는 sequence 순으로 정렬해야 한다. Sidebar 응답에는 request/response 본문을 포함하지 않으며 traffic 본문은 선택 시 기존 detail API로 지연 조회한다.
- **Decision summary:** Turn 전용 aggregate endpoint와 traffic detail 지연 조회를 사용한다.
- **Depends on:** ASR-022, ASR-024
- **Related AC:** AC-020
- **Related ADRs:** `adr/turn-traffic-query-tree-projection.md` — approved

### ASR-026 — Legacy traffic non-migration compatibility
- **Source:** AC-022 — Non-migration legacy traffic 호환 표시
- **Statement:** 기존 schema/data를 migration하지 않는다. turn metadata가 없는 각 traffic은 `/api/v1/turns`에서 `kind: "legacy"`인 synthetic single-traffic turn으로 표시하고 child traffic 하나를 연결해야 한다. 기존 flat logs list/detail API는 유지하며 legacy traffic 간 과거 turn 관계는 추론하지 않는다.
- **Decision summary:** Legacy traffic을 synthetic single-traffic turn으로 표시한다. Legacy node 순서는 기존 `started_at DESC` 목록 순서를 따른다.
- **Depends on:** ASR-025
- **Related AC:** AC-022
- **Related ADRs:** `adr/legacy-traffic-tree-compatibility.md` — approved

### ASR-027 — Sidebar selection and main-view contract
- **Source:** AC-021 — Sidebar 선택 상태와 메인 뷰 계약
- **Statement:** 선택 상태를 URL query/route로 표현하고 turn 선택과 traffic 선택을 구분해야 한다. Turn 선택 시 turn summary, 상태, traffic 개수/순서와 child 목록을 표시하고, traffic 선택 시 기존 `LogDetail`로 request/response/error/metadata를 조회해야 한다. URL state로 새로고침과 browser back/forward를 지원하며 stable turn/traffic ID를 사용한다.
- **Decision summary:** URL-addressable selection과 turn/traffic 분리 메인 뷰를 사용한다.
- **Depends on:** ASR-025, ASR-026
- **Related AC:** AC-021
- **Related ADRs:** `adr/sidebar-selection-main-view-contract.md` — approved

### ASR-028 — Turn 관리 메타데이터와 삭제 계약
- **Source:** AC-025 — Turn·traffic 관리 메타데이터 저장과 삭제 의미
- **Statement:** Turn과 traffic의 제목·flag 관리 메타데이터는 request/response JSON 및 lifecycle 원본과 분리해 저장해야 한다. 삭제 API는 turn 단위만 제공하고, turn 삭제 시 해당 turn row와 모든 child traffic을 하나의 transaction에서 물리 삭제해야 한다. traffic 단독 삭제, 논리 삭제, 복원, 삭제 이력은 제공하지 않는다.
- **Decision summary:** ADR Option B를 채택한다. `turns`와 `traffic_logs`에 관리 컬럼을 추가하고 turn-child cascade 물리 삭제를 사용한다.
- **Depends on:** ASR-025
- **Related AC:** AC-025
- **Related ADRs:** `adr/turn-management-metadata-and-deletion.md` — approved

### ASR-029 — Turn 필터와 pagination query 계약
- **Source:** AC-026 — 전체·flagged 필터의 조회 책임과 pagination 계약
- **Statement:** `GET /api/v1/turns`가 전체·flagged 필터를 서버에서 적용하고, 필터 적용 후 top-level turn node 기준으로 `total`, `page`, `limit`, `has_next`를 계산해야 한다. Child traffic은 parent turn 안에 반환하고 child 자체는 pagination하지 않는다. flag 변경·turn 삭제 성공 후 UI는 현재 query를 재조회하며 빈 page는 마지막 유효 page로 보정한다.
- **Decision summary:** ADR Option A를 채택한다. Sidebar 필터와 pagination 책임은 서버 query에 둔다.
- **Depends on:** ASR-028
- **Related AC:** AC-026
- **Related ADRs:** `adr/turn-filter-pagination-contract.md` — approved

### ASR-030 — Turn summary와 usage projection
- **Source:** AC-027 — Turn summary와 traffic usage summary 데이터 계약
- **Statement:** Server query service가 turn과 child traffic에서 summary DTO를 생성해야 한다. 시작 user input은 첫 traffic에서, 종료 AI output은 마지막 completed traffic에서 선택한다. Usage·cost는 child traffic의 non-null 값을 합산하고, 값이 없으면 `null`, 일부만 있으면 partial 상태와 함께 반환한다. UI는 이 계산 규칙을 재구현하거나 provider가 보고하지 않은 cost를 추정하지 않는다.
- **Decision summary:** ADR Option A를 채택한다. Provider-reported cost와 server-owned summary projection을 사용한다.
- **Depends on:** ASR-029
- **Related AC:** AC-027
- **Related ADRs:** `adr/usage-and-cost-metadata.md` — approved; `adr/turn-summary-usage-projection.md` — approved

### ASR-032 — Traffic summary provider·usage projection
- **Source:** 사용자 Direct Input — UI Spec review resolution
- **Statement:** Traffic log는 model routing에 사용된 stable provider ID를 저장해야 한다. `GET /api/v1/turns`의 child traffic summary와 기존 traffic detail API는 request/response 본문 없이 provider, model, input_tokens, cached_input_tokens, output_tokens, total_tokens, cost_usd, latency_ms 및 기존 status/sequence/title metadata를 제공해야 한다. 값이 저장되지 않았으면 `null`을 반환하며 UI는 이를 추정하거나 재계산하지 않는다. Provider URL, API key, 인증 header는 provider display field로 노출하지 않는다.
- **Decision summary:** Provider ID와 normalized traffic usage/cost/latency를 persistence와 query projection에 first-class display metadata로 추가한다.
- **Depends on:** ASR-012, ASR-020, ASR-025, ASR-030
- **Related AC:** —
- **Related ADRs:** —

### ASR-033 — Turn note semantic contract
- **Source:** AC-029 — API별 turn note contract와 semantic extraction
- **Statement:** 외부 note 저장·조회 contract는 turn별 `TurnNote[]`로 제공해야 하며 각 note는 `title`과 deterministic Markdown `content`를 가져야 한다. API별 분석 adapter는 payload를 공통 semantic 단계로 해석해 tool call/result의 의미·누락·매칭·순서를 검증한 뒤 Markdown note로 렌더링해야 한다. 분석 상태는 notes 배열과 별도 status envelope로 제공하고 원본 request/response는 기존 traffic 저장에 보존한다.
- **Decision summary:** 저장 contract는 Option D, adapter 내부 semantic 분석은 Option A 조합을 사용한다.
- **Depends on:** ASR-021, ASR-023
- **Related AC:** AC-029
- **Related ADRs:** `adr/turn-note-semantic-contract.md` — approved

### ASR-034 — Turn analysis adapter boundary
- **Source:** AC-030 — Note 분석 adapter와 기존 turn grouping 경계
- **Statement:** `TurnAnalysisService`가 완료 turn을 `TurnReader` port로 조회하고 `api_kind`에 맞는 API별 `TurnAnalysisAdapter`를 선택해야 한다. Adapter는 전달받은 turn data를 분석해 `TurnNote[]`와 분석 결과를 반환하며 SQLite나 기존 turn lifecycle state에 직접 접근하지 않아야 한다. Service는 `TurnNoteWriter` port로 note projection을 저장하고 idempotency·재시도·상태 orchestration을 담당해야 한다.
- **Decision summary:** 기존 proxy adapter와 분리된 `TurnAnalysisService` + `TurnAnalysisAdapter` 구조를 사용한다.
- **Depends on:** ASR-033
- **Related AC:** AC-030
- **Related ADRs:** `adr/turn-note-adapter-boundary.md` — approved

### ASR-035 — Completion 후 비동기 turn analysis lifecycle
- **Source:** AC-031 — Turn 완료 후 note 분석 lifecycle·idempotency·재시도
- **Statement:** turn completion을 먼저 확정하고 completion 후 비동기 note analysis job을 실행해야 한다. Job은 `turn_id + analysis_version`을 idempotency key로 사용하고 note 상태를 `pending`, `ready`, `empty`, `failed`로 관리해야 한다. 동일 completion event와 재실행은 upsert로 처리해 중복 note를 만들지 않으며 분석 실패는 completed turn·traffic 저장에 전파하지 않아야 한다. 프로세스 재시작 시 pending 또는 재시도 가능한 failed job을 복구해야 한다.
- **Decision summary:** 동기 분석이나 조회 시 lazy analysis가 아닌 completion 후 비동기 job을 사용한다.
- **Depends on:** ASR-034
- **Related AC:** AC-031
- **Related ADRs:** `adr/turn-note-analysis-lifecycle.md` — approved

### ASR-036 — Turn note persistence projection
- **Source:** AC-032 — Note persistence와 turn 조회 projection
- **Statement:** 기존 turn/traffic 원본과 분리된 turn당 하나의 `turn_notes` projection row를 사용해야 한다. Row는 `turn_id`, `analysis_version`, `status`, `notes_json`, error/retry metadata를 저장하고 `TurnNote[]`를 JSON 배열로 원자적으로 upsert해야 한다. Turn query service는 기존 turn aggregate와 note projection을 조합해 반환하고 note별 검색·편집·pagination은 제공하지 않는다.
- **Decision summary:** turn row 확장이나 note별 relational row가 아닌 별도 projection row를 사용한다.
- **Depends on:** ASR-035
- **Related AC:** AC-032
- **Related ADRs:** `adr/turn-note-persistence-projection.md` — approved

### ASR-037 — Note 실패 관찰성과 turn 완료 독립성
- **Source:** AC-033 — Note 상태·실패 관찰성과 기존 turn 완료 독립성
- **Statement:** Note projection의 canonical status는 `pending`, `ready`, `empty`, `failed` 네 가지여야 한다. Failed는 `retryable`, `error_code`, secret을 포함하지 않는 bounded `error_message`, `attempt_count`, `updated_at`을 제공해야 하며 projection/원본 조회 불능은 `error_code: note_unavailable`로 표현해야 한다. Note status와 error는 completed turn·traffic lifecycle과 독립적으로 저장·조회해야 한다.
- **Decision summary:** unavailable을 별도 canonical status로 추가하지 않고 failed detail로 표현한다.
- **Depends on:** ASR-035, ASR-036
- **Related AC:** AC-033
- **Related ADRs:** `adr/turn-note-failure-observability.md` — approved

### ASR-038 — Turn view note card contract
- **Source:** AC-034 — Turn view note card 표시·상태 계약
- **Statement:** Turn view는 traffic usage summary table 바로 다음에 note card를 표시해야 한다. Pending은 loading indicator와 함께 표시하고, ready는 `TurnNote[]`의 title과 Markdown content를 read-only로 렌더링하며, empty는 도구 사용 이력 없음을 명시하고, failed는 안전한 오류 설명과 retryable 여부를 표시해야 한다. Note card 오류는 turn summary·traffic table 표시를 막지 않아야 하며 이번 범위에서는 수동 retry를 제공하지 않는다. Markdown renderer는 기존 안전 정책을 따르고 HTML/script 실행을 금지해야 한다.
- **Decision summary:** 상태별 note card를 기존 Turn view의 usage table 다음에 배치하는 Direct Input을 사용한다.
- **Depends on:** ASR-036, ASR-037
- **Related AC:** AC-034

### ASR-039 — Tool history table and note card split
- **Source:** AC-035 — 도구 이력 table·오류 note·note card 표시 계약
- **Statement:** 첫 번째 note는 API별 adapter가 해석한 모든 tool interaction을 `Sequence / Function / Parameters / Status` Markdown table로 렌더링한다. Parameters는 key/value를 유지하고 긴 문자열 value는 축약하며, `tmp/api-ref.md`의 API별 tool result JSON `error` field가 있는 interaction만 `Failed`로 표시한다. 오류 interaction만 별도 다음 note로 렌더링하고, Turn View는 비어 있지 않은 각 note를 독립 card로 표시하며 공통 title/status와 빈 카드를 제거한다.
- **Decision summary:** API별 extraction은 adapter 내부에 유지하고 공통 renderer는 semantic interaction과 note 배열을 deterministic하게 렌더링한다.
- **Depends on:** ASR-033, ASR-038
- **Related AC:** AC-035

- **Source:** AC-028 — 긴 문자열 형식 표시와 안전한 전체 보기
- **Statement:** Viewer adapter는 JSON parse 성공 시 request/response를 read-only JSON object/array tree container로 표시해야 한다. object/array/number/boolean/null은 tree 탐색 대상으로 유지하고 문자열 leaf만 viewer 입력으로 취급해야 한다. 문자열 leaf는 기본 축약 preview를 제공하며 전체 보기 요청 시 popup viewer window/dialog에서 해당 문자열만 표시해야 한다. Popup viewer의 `Auto`는 선택된 문자열에 대해 content hint → JSON parse → 제한된 Markdown 판별 → `highlight.js` 후보 → plain text fallback 순서를 따른다. 사용자는 `Auto`, `JSON`, `Markdown`, `Code`, `Plain text`와 curated code language를 선택할 수 있고 선택은 현재 request/response field의 문자열 leaf viewer instance presentation 상태로만 유지해야 한다. 저장된 content는 실행하지 않고 raw HTML·iframe·`eval`·`new Function`을 허용하지 않는다. 각 JSON 문자열 값이 1 MiB(1,048,576 UTF-8 bytes) 이하이면 별도 문자 수·줄 수 truncation 없이 popup에서 전문을 제공한다. request/response JSON은 저장 단계에서 잘라내지 않으며 `maxBodyBytes`는 request 수신 한도다.
- **Decision summary:** Option D와 후속 Option A 결정들을 채택한다. 형식별 전문 viewer 조합, 제한된 mode contract, viewer 인스턴스 범위 선택 보존, 1 MiB 전문 표시 기준을 사용한다.
- **Depends on:** ASR-027, ASR-028
- **Related AC:** AC-028
- **Related ADRs:** `adr/long-string-safe-rendering.md` — approved; `adr/viewer-dependency-selection.md` — approved; `adr/format-mode-contract.md` — approved

## Approval

- 2026-03-10: 기존 ASR-001~ASR-009 승인.
- 2026-03-10: Sprint 15 ASR-033~ASR-038 통합 초안 작성 완료. 사용자 승인 대기.
- 2026-03-10: 사용자 요청과 `tmp/api-ref.md`를 반영해 ASR-039를 추가하고 tool history table, API별 오류 판정, 오류 note 분리, note별 독립 card 계약을 승인했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 15 ASR-033~ASR-038과 전체 ASR delta를 승인했다. `spec/llm-proxy-turn-notes.md` 작성으로 진행한다.
- 2026-03-10: 사용자 go-ahead(“ok”)로 ASR-010~ASR-015 및 전체 ASR registry 승인. 다음 단계에서 `spec/llm-proxy-server.md`를 갱신한다.
- 2026-03-10: 사용자 go-ahead(“ok”)로 ASR-016~ASR-020 및 전체 Sprint 07 ASR delta 승인. `spec/llm-proxy-server.md`에 반영한다.

## Notes

- 2026-03-10: 모든 blocking AC와 승인된 ADR을 PRD의 제품 요구사항과 함께 통합했다.
- 2026-03-10: sprint-02 delta의 AC-008~AC-013 결과를 ASR-010~ASR-015로 append했다.
- 2026-03-10: Sprint 07의 승인된 AC-014~AC-018과 관련 ADR 결과를 ASR-016~ASR-020으로 통합했고 사용자 승인을 받았다.
- 2026-03-10: Sprint 09의 승인된 AC-019~AC-024와 관련 ADR 결과를 ASR-021~ASR-027로 통합했다. 기존 traffic migration 제외, proxy semantic grouping, API별 adapter aggregation, turn tree query, legacy compatibility, URL selection을 반영했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 09 ASR registry를 승인했다. `spec/llm-proxy-turn-traffic.md` 작성으로 진행한다.
- 2026-03-10: Sprint 12의 승인된 AC-025~AC-028과 관련 ADR/Direct Input을 ASR-028~ASR-031 초안으로 통합했다. 사용자 ASR 승인 대기.
- 2026-03-10: 사용자 go-ahead("ok")로 ASR-028~ASR-031과 전체 Sprint 12 ASR delta를 승인했다. `spec/llm-proxy-turn-management.md` 작성으로 진행한다.
- 2026-03-10: UI Spec review의 blocking gap 해결을 위해 사용자 승인된 Direct Input으로 ASR-032를 추가했다. Provider는 stable routing ID로 저장하고 turn child/detail projection에 normalized traffic usage metadata를 제공한다.
- 2026-03-10: 사용자 변경 요청에 따라 ASR-031을 JSON container + 문자열 leaf popup viewer 계약으로 수정했다. 기존 승인 Spec과 ADR은 이 변경에 맞춰 재검토가 필요하다.
