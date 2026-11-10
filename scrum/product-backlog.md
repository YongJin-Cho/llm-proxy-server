# Product Backlog — LLM Proxy Server

> **Updated:** 2026-03-10

> **Execution board:** [`../TODO.md`](../TODO.md)

## Stories

- [x] **PB-001** — 초기 제품 백로그 생성
  - Story: LLM Proxy Server의 승인된 PRD, 설계 결정, Spec을 바탕으로 구현 가능한 제품 백로그를 정의한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements, §Constraints
  - Sprint: sprint-00
  - Depends: —
  - Notes: Spec→backlog 스프린트에서 DoD 충족 후 Boundary에서 종료.

- [x] **PB-002** — Responses API 프록시와 오류 전달
  - Story: localhost의 LLM 클라이언트가 `/api/v1/responses`로 요청하면 Provider에 전달되고 성공·Provider 오류·네트워크 오류가 클라이언트와 로그에 추적 가능한 형태로 반환된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-001–R-003; §Constraints C-001, C-005, C-007
  - Sprint: sprint-01
  - Depends: —
  - Notes: 초기 `/api/v1/responses` 범위. 백엔드 API는 `/api/v1` 아래에 두며 `/v1/responses` 별칭은 제공하지 않는다. Chat Completions와 Claude Messages API는 후속이다.

- [x] **PB-003** — SSE 스트리밍 프록시와 집계 로그
  - Story: 스트리밍 Responses 요청의 SSE 이벤트가 클라이언트에 전달되고 정상·실패 종료 결과가 집계 로그로 저장된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-004–R-005; §Constraints C-002
  - Sprint: sprint-01
  - Depends: PB-002

- [x] **PB-004** — SQLite 요청·응답 로그 저장 및 조회 API
  - Story: 프록시 요청·응답 쌍이 마스킹·크기 제한 후 SQLite에 저장되고, 최신순·필터·페이지네이션·상세 조회 API로 조회된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-006–R-007, R-011; §Constraints C-003–C-004, C-008
  - Sprint: sprint-01
  - Depends: PB-002

- [x] **PB-005** — 확장 가능한 트래픽 모니터링 웹 UI 구현
  - Story: localhost 웹 UI에서 저장 로그 목록을 최신순으로 확인하고 상태·모델·기간 필터, 페이지네이션, 요청·응답·메타데이터·오류·content 상세를 볼 수 있으며 향후 분석·report·chart feature를 추가할 수 있다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-010–R-011; §Constraints C-004, C-006, C-008
  - Sprint: sprint-04
  - Depends: PB-004, PB-007, PB-009, PB-010
  - Notes: sprint-03에서 UI 기능 구현 완료. C-008 module extraction 정합성 partial을 sprint-04에서 carry-over closure하며 React source를 `src/ui/`로 이동한다.
  - Notes: sprint-02 설계 결과를 반영한 구현으로 이월.

- [x] **PB-006** — 자동화된 핵심 동작 검증과 실행 문서
  - Story: 정상·실패 프록시, SSE, provider/model 라우팅, 저장·조회, 마스킹, UI 목록·상세를 자동화된 검증으로 재현하고 단일 프로세스 실행 설정을 문서화한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-003–R-007, R-012–R-016; §Constraints C-001–C-009
  - Sprint: sprint-04
  - Depends: PB-002, PB-003, PB-004, PB-005, PB-007, PB-008, PB-009
  - Notes: sprint-03에서 실행 가능한 UI 기반을 확보. 실행 문서와 자동화 검증을 sprint-04에서 구현하고 `AGENTS.md`에 운영 기준을 기록한다.

- [x] **PB-007** — 모듈형 서버·API 확장 구조와 framework 기반
  - Story: `server.ts`의 bootstrap, configuration, routing, API adapter, provider client, logging, persistence, UI delivery 책임을 모듈로 분리하고 승인된 API framework 및 adapter contract를 적용할 수 있는 구조를 정의한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-001, R-002, R-009, R-014; §Constraints C-006, C-008
  - Sprint: sprint-04
  - Depends: PB-002, PB-004
  - Notes: sprint-02 설계 DoD 충족. 실제 module extraction과 `src/ui/` source placement를 sprint-04에서 수행한다.

  - [x] **PB-008** — 복수 LLM provider 및 model ID 라우팅
  - Story: 설정 파일에서 provider의 API URL·key를 정의하고 client model ID를 provider와 provider model ID에 매핑하여 요청을 올바른 provider로 전달하며, 미등록 model·잘못된 설정·비밀정보 노출을 명확히 처리한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-002, R-003, R-006, R-012–R-013; §Constraints C-007
  - Sprint: sprint-05
  - Depends: PB-007
  - Notes: sprint-02 Spec→backlog DoD 충족. sprint-05에서 실제 provider routing을 구현하고 자동 검증했다.

  - [x] **PB-009** — API 로그 기록과 UI 조회를 분리하는 DB access 구조
  - Story: API request path의 log writer와 UI query path의 read repository/query service를 분리하고 SQLite schema·migration·redaction·본문 크기 제한 책임과 공통 domain model을 명확히 한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-007–R-008; §Constraints C-003–C-004
  - Sprint: sprint-05
  - Depends: PB-004, PB-007
  - Notes: sprint-02 Spec→backlog DoD 충족. sprint-05에서 writer/query access boundary를 실제 코드와 자동 검증에 반영했다.

  - [x] **PB-010** — 확장 가능한 모니터링 UI 구조
  - Story: 승인된 UI framework와 page/component/data-query 구조를 사용해 log list/detail 및 content viewer를 제공할 기반을 만들고, 향후 분석·report·chart feature를 기존 화면과 독립적으로 추가할 수 있게 한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-010–R-011; §Constraints C-006, C-008
  - Sprint: sprint-06
  - Depends: PB-007, PB-009
  - Notes: sprint-02 Spec→backlog DoD 충족. sprint-06에서 확장 가능한 page/component/data-query 구조를 실제 구현·검증했고 Boundary에서 종료했다.

  - [x] **PB-011** — 구조 변경 마이그레이션·검증·실행 문서
  - Story: 기존 MVP 동작을 보존하는 모듈 분리·DB migration 순서, provider routing 및 UI/API 회귀 검증, 단일 프로세스 실행·설정 문서를 정의한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-014–R-016; §Constraints C-009
  - Sprint: sprint-05
  - Depends: PB-007, PB-008, PB-009, PB-010
  - Notes: sprint-02 Spec→backlog DoD 충족. sprint-05에서 migration·회귀 자동화·실행 문서를 현재 구조에 맞게 완성했다.

- [x] **PB-012** — Chat Completions와 Claude Messages API 지원 요구사항 및 구현 backlog 확정
  - Story: 기존 Responses 프록시와 로그·provider routing 구조를 보존하면서 OpenAI Chat Completions API와 Claude Messages API를 지원하기 위해, 승인된 계약·설정·보안·streaming·오류·회귀 검증 기준과 구현 가능한 하위 backlog가 확정된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements/§Constraints — delta 예정
  - Sprint: sprint-07
  - Depends: PB-002, PB-003, PB-007, PB-008, PB-009, PB-011
  - Notes: Sprint 07에서 Spec→backlog DoD를 충족하고 PB-013~PB-018로 분해했다. 실제 제품 코드 구현은 후속 Backlog→Implementation sprint에서 수행한다.

  - [x] **PB-013** — 다중 API public route와 transparent adapter contract 구현
  - Story: `/api/v1/responses`, `/api/v1/chat/completions`, `/api/v1/messages`를 독립 adapter/plugin으로 제공하고 API별 payload·response·error를 canonical conversion 없이 provider 계약에 따라 전달한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-009, R-017; §Constraints C-010
  - Sprint: sprint-08
  - Depends: PB-012
  - Notes: Sprint 08에서 API별 ProxyAdapter 구조까지 구현하고 검증했다.

  - [x] **PB-014** — Claude 인증 mode와 provider header 설정
  - Story: 기본 Bearer 인증과 명시적 Anthropic native mode의 `x-api-key`·`anthropic-version` header를 `apiKeyEnv` secret loading 및 redaction 정책과 함께 검증한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-018; §Constraints C-007
  - Sprint: sprint-08
  - Depends: PB-013
  - Notes: Sprint 08에서 Bearer/native Anthropic auth mode와 header를 구현·검증했다.

  - [x] **PB-015** — API별 streaming completion/error 처리
  - Story: Responses, Chat Completions, Claude Messages의 API별 정상 종료 detector를 적용하고 원본 SSE를 투명 전달하며 조기 종료·upstream failure·client disconnect를 부분 결과와 함께 failed log로 저장한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-004, R-005, R-019; §Constraints C-002, C-011
  - Sprint: sprint-08
  - Depends: PB-013
  - Notes: Sprint 08에서 API별 completion detector와 partial failure logging을 구현·검증했다.

  - [x] **PB-016** — `api_kind` traffic log schema migration
  - Story: domain model과 SQLite에 `api_kind`를 추가하고 `responses`, `chat_completions`, `messages`를 구분하며 legacy row를 `responses`로 보존한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-006, R-020; §Constraints C-003, C-011
  - Sprint: sprint-08
  - Depends: PB-013
  - Notes: Sprint 08에서 legacy compatibility를 포함한 SQLite migration을 구현·검증했다.

  - [x] **PB-017** — Token usage normalization과 provider cost metadata
  - Story: API별 usage를 `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`로 저장하고 provider가 명시한 USD cost만 `cost_usd`에 기록하며 unavailable/ambiguous cost는 NULL로 둔다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-021–R-022; §Constraints C-012
  - Sprint: sprint-08
  - Depends: PB-016
  - Notes: Sprint 08에서 adapter별 usage/cost 해석과 normalized columns를 구현·검증했다. Proxy-owned pricing table은 구현하지 않는다.

  - [x] **PB-018** — 다중 API 회귀·통합 검증과 실행 문서
  - Story: 세 API의 non-streaming/streaming 성공·실패, routing, auth, schema migration, redaction, usage/cost metadata와 기존 Responses 회귀를 자동 검증하고 실행 문서를 갱신한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-013–R-016; §Constraints C-009
  - Sprint: sprint-08
  - Depends: PB-013, PB-014, PB-015, PB-016, PB-017
  - Notes: Sprint 08에서 세 API·기존 Responses 회귀, streaming, migration, redaction, usage/cost 및 실행 문서를 검증했다.

- [x] **PB-019** — Turn 기반 traffic 저장·탐색 UI 요구사항 확정
  - Story: 하나의 사용자 요청에서 발생한 복수 LLM traffic을 하나의 turn으로 그룹핑해 저장하고, 왼쪽 sidebar tree에서 turn과 하위 traffic을 탐색하며 선택한 항목의 내용을 메인 뷰에서 확인할 수 있도록 구현 가능한 요구사항·설계·검증 기준과 후속 구현 backlog를 확정한다.
  - Spec: `spec/llm-proxy-turn-traffic.md` §Requirements, §Constraints
  - Sprint: sprint-09
  - Depends: PB-004, PB-005, PB-009, PB-010
  - Notes: Spec review 3 pass, 0 fail로 승인되었다. 제품 코드 구현은 후속 Backlog→Implementation sprint에서 수행한다.

- [x] **PB-020** — Turn grouping domain·persistence lifecycle 구현
  - Story: API semantic adapter 결과를 사용해 stable turn/traffic identifier, turn reference, 관찰 순서 sequence, 진행·완료 상태와 미완료 turn pool을 SQLite writer/query 경계 안에 저장하고 조회한다.
  - Spec: `spec/llm-proxy-turn-traffic.md` §Requirements R-001–R-003, §Constraints C-001–C-006
  - Sprint: sprint-10
  - Depends: PB-004, PB-009, PB-013, PB-016
  - Notes: Sprint 10에서 DoD 충족으로 종료했다. stable identity/ordering의 세부 wire·persistence contract는 구현 acceptance criteria와 fixture에서 고정했다.

  - [x] **PB-021** — Tool identity matching과 fallback isolation
  - Story: 유일하게 매칭되는 tool ID는 기존 미완료 turn에 연결하고, 누락·미매칭·모호 identity는 각각 고정 fallback reason과 새 standalone turn으로 격리하며 request forwarding과 기존 turn 보존을 검증한다.
  - Spec: `spec/llm-proxy-turn-traffic.md` §Requirements R-001–R-003; §Constraints C-007
  - Sprint: sprint-10
  - Depends: PB-020
  - Notes: Sprint 10에서 DoD 충족으로 종료했다. fallback enum은 `missing_tool_identity`, `unmatched_tool_identity`, `ambiguous_tool_identity`다.

- [x] **PB-022** — Turn tree query API와 legacy projection
  - Story: `GET /api/v1/turns`가 turn pagination, deterministic ordering, child traffic summary, fallback metadata와 legacy synthetic node를 제공하고 traffic 본문은 기존 detail API로 지연 조회한다.
  - Spec: `spec/llm-proxy-turn-traffic.md` §Requirements R-004–R-005; §Constraints C-003–C-005
  - Sprint: sprint-11
  - Depends: PB-020, PB-021
  - Notes: Sprint 11에 커밋했다. pagination parameter·response metadata·필수 node field·tie-breaker를 구현 acceptance contract로 고정한다.

- [x] **PB-023** — Sidebar tree와 turn/traffic selection view
  - Story: UI가 turn/traffic tree를 표시하고 stable URL state로 각각을 선택하며, turn summary와 기존 traffic detail을 렌더링하고 loading·empty·error 및 독립적인 detail fetch failure를 처리한다.
  - Spec: `spec/llm-proxy-turn-traffic.md` §Requirements R-006–R-007
  - Sprint: sprint-11
  - Depends: PB-022, PB-005, PB-010
  - Notes: Sprint 11에 커밋했다. URL query/route shape와 tree node rendering contract를 구현 acceptance contract로 고정한다.

- [x] **PB-024** — Turn grouping 통합 검증과 실행 문서
  - Story: 동시 미완료 turn, out-of-order tool message, fallback isolation, completion, legacy projection, tree query, URL selection과 기존 API 회귀를 `npm run build`·`npm run verify`로 자동 검증하고 실행 문서를 갱신한다.
  - Spec: `spec/llm-proxy-turn-traffic.md` §Requirements R-008; `spec/llm-proxy-server.md` 공통 SSE 검증 계약
  - Sprint: sprint-11
  - Depends: PB-020, PB-021, PB-022, PB-023
  - Notes: Sprint 11에 커밋했다. 제품 코드 구현과 전체 검증·실행 문서를 이 Sprint에서 완료한다.

- [ ] **PB-025** — Turn 관리 메타데이터와 turn cascade 삭제 구현
  - Story: 운영자가 turn 제목·flag를 저장하고 turn을 삭제하면 관리 메타데이터와 모든 child traffic이 하나의 transaction에서 물리 삭제되며 traffic 단독 삭제·논리 삭제·복원은 제공되지 않는다.
  - Spec: `spec/llm-proxy-turn-management.md` §Requirements R-001–R-002; §Constraints C-003
  - Sprint: sprint-13
  - Depends: PB-022, PB-023
  - Notes: Sprint 13 후보 Scope. SQLite migration/schema, writer/query API, UI mutation과 cascade transaction 검증을 포함한다.

- [ ] **PB-026** — Turn filter·pagination·mutation refresh 구현
  - Story: 전체/flagged 필터와 turn 단위 pagination을 서버가 제공하고 flag 변경·삭제 후 현재 query를 재조회하며 빈 page를 마지막 유효 page로 보정한다.
  - Spec: `spec/llm-proxy-turn-management.md` §Requirements R-003–R-004
  - Sprint: sprint-13
  - Depends: PB-025
  - Notes: Sprint 13 후보 Scope. Child traffic은 pagination하지 않는다.

- [ ] **PB-027** — Turn summary·usage/cost projection 구현
  - Story: turn summary가 시작 user input, 마지막 completed AI output, 모델·환경·상태·처리 시간·traffic 개수를 제공하고 usage/cost를 서버 규칙으로 합산하며 null/partial 상태를 표현한다.
  - Spec: `spec/llm-proxy-turn-management.md` §Requirements R-005–R-006
  - Sprint: sprint-13
  - Depends: PB-026
  - Notes: Sprint 13 후보 Scope. UI가 summary 계산을 재구현하거나 provider 미보고 cost를 추정하지 않는다.

- [ ] **PB-028** — 안전한 형식별 traffic content viewer 구현
  - Story: JSON tree, sanitized Markdown, read-only Monaco와 `Auto`/사용자 mode override를 제공하고, detection 실패·지원 불가 형식은 plain text로 fallback하며 content를 실행하지 않는다.
  - Spec: `spec/llm-proxy-turn-management.md` §Requirements R-007–R-012; §Constraints C-004–C-005
  - Sprint: —
  - Depends: PB-023
  - Notes: 다음 Backlog→Implementation sprint 후보. 승인된 dependency stack을 설치 검증하고 1 MiB field 전문 표시·viewer 인스턴스 범위 state·보안 회귀를 포함한다.

- [ ] **PB-029** — Turn 관리·분석 통합 검증과 실행 문서
  - Story: 제목·flag·삭제 cascade, all/flagged filter, pagination 보정, summary/usage partial, viewer mode/fallback/1 MiB 전문 표시와 기존 turn tree·URL·traffic API 회귀를 자동 검증하고 실행 문서를 갱신한다.
  - Spec: `spec/llm-proxy-turn-management.md` §Requirements R-001–R-012; §Constraints C-001–C-005
  - Sprint: —
  - Depends: PB-025, PB-026, PB-027, PB-028
  - Notes: 다음 Backlog→Implementation sprint 후보. `npm run build`와 `npm run verify`를 검증 진입점으로 사용한다.

## Notes

- 2026-03-10: Spec 승인 후 PB-002–PB-006을 초기 구현 백로그로 추가했다.
- 2026-03-10: sprint-00 Boundary에서 PB-001을 종료하고 sprint-01 실행을 시작했다.
- 2026-03-10: sprint-01의 curl 기반 통합 데모 검증을 완료하고 PB-002–PB-004를 종료했다. PB-005–PB-006은 다음 스프린트 계획 대상으로 유지한다.
- 2026-03-10: sprint-02 Spec→backlog Boundary 완료. PB-007~PB-011의 설계 DoD를 충족하고 실제 구현은 implementation sprint로 이월했다.
- 2026-03-10: sprint-03 Boundary 완료. PB-005 UI 기능은 구현했으며 C-008 module extraction과 R-016 실행 문서는 sprint-04 Scope로 carry-over했다.
- 2026-03-10: sprint-04 Boundary 완료. PB-005~PB-007을 종료하고 sprint-05에 PB-008, PB-009, PB-011을 커밋 후보로 계획했다.
- 2026-03-10: sprint-05 Boundary 완료. PB-008, PB-009, PB-011을 종료하고 PB-010을 sprint-06 Scope로 계획했다.
- 2026-03-10: sprint-06 Boundary 완료. PB-010을 종료하고 현재 제품 backlog의 모든 story를 완료했다.
- 2026-03-10: sprint-07 Boundary 완료. PB-012를 종료하고 PB-013~PB-018을 Backlog→Implementation 후보로 유지했다.
- 2026-03-10: sprint-08 Boundary 완료. PB-013~PB-018을 종료했으며 구현 backlog의 모든 story가 완료되었다.
- 2026-03-10: Sprint 09 Spec 승인 후 PB-019를 종료하고 승인 Spec의 구현 backlog PB-020~PB-024를 append했다.
- 2026-03-10: Sprint 10 Boundary에서 PB-020·PB-021을 종료하고 PB-022~PB-024를 다음 구현 sprint 후보로 유지했다.
- 2026-03-10: Sprint 11 Boundary에서 PB-022·PB-023·PB-024를 종료했다. turn tree API, Sidebar UI, 통합 검증 및 실행 문서 DoD를 충족했다.
- 2026-03-10: Sprint 12 Spec review를 통과한 승인 Spec을 PB-025~PB-029 구현 story로 append했다.
- 2026-03-10: Sprint 12 Boundary에서 PB-025~PB-027을 Sprint 13 후보 Scope로 지정했다. PB-028~PB-029는 후속 implementation sprint 후보로 유지한다.
