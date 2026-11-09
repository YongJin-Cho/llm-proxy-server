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

## Dependency Order (recommended Spec encoding path)

1. ASR-001 → ASR-002 → ASR-003 → ASR-004 → ASR-005 → ASR-006 → ASR-007 → ASR-008 → ASR-009
2. ASR-010 → ASR-011 → ASR-012 → ASR-013 → ASR-014 → ASR-015

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
- **Decision summary:** Option A를 채택한다. 본문 제한과 마스킹은 ASR-004를 따른다.
- **Depends on:** ASR-001, ASR-002
- **Related AC:** AC-003
- **Related ADRs:** `adr/traffic-log-storage.md` — approved

### ASR-004 — 민감정보 마스킹과 본문 제한
- **Source:** AC-004 — 민감정보 보호와 로그 보존
- **Statement:** Authorization, API key, cookie 등 비밀 헤더를 저장 전에 마스킹하고 요청·응답 본문은 설정 가능한 최대 크기까지 저장한다. UI에는 마스킹된 결과만 표시한다.
- **Decision summary:** Option A를 채택한다. 초기에는 자동 TTL 삭제를 제공하지 않는다.
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

## Approval

- 2026-03-10: 기존 ASR-001~ASR-009 승인.
- 2026-03-10: 사용자 go-ahead(“ok”)로 ASR-010~ASR-015 및 전체 ASR registry 승인. 다음 단계에서 `spec/llm-proxy-server.md`를 갱신한다.

## Notes

- 2026-03-10: 모든 blocking AC와 승인된 ADR을 PRD의 제품 요구사항과 함께 통합했다.
- 2026-03-10: sprint-02 delta의 AC-008~AC-013 결과를 ASR-010~ASR-015로 append했다.
