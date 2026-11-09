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
| AC-008 | API framework 선택과 서버 구조 | Structure & organization | reviewing | adr/api-framework-and-server-structure.md | — |
| AC-009 | UI framework 선택과 확장 구조 | Deliverable form | identified | — | — |
| AC-010 | Provider 설정과 model routing 계약 | Integration & dependencies | identified | — | — |
| AC-011 | API adapter 확장 경계 | Structure & organization | identified | — | — |
| AC-012 | API log writer와 UI read 경계 | Structure & organization | identified | — | — |
| AC-013 | 구조 변경의 migration·회귀·실행 기준 | Quality bar (architectural) | identified | — | — |

## Dependency Order (recommended review path)

1. AC-001 → AC-002 → AC-003 → AC-004 → AC-005 → AC-006 → AC-007
2. AC-008 → AC-009 → AC-010 → AC-011 → AC-012 → AC-013

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
- **Status:** reviewing
- **Statement:** 직접 Node HTTP 라우팅을 유지할지 Fastify·Hono 등 framework를 도입할지, 선택한 경우 bootstrap·middleware·routing·plugin/module 경계를 어떻게 나눌 것인가?
- **Why it matters:** framework 선택과 서버 구조는 route 확장성, TypeScript·테스트성, streaming/SSE 제어, 의존성 비용 및 기존 MVP migration 난이도를 결정한다.
- **Depends on:** AC-001, AC-002
- **Related ADRs:**
  - `adr/api-framework-and-server-structure.md` — proposed
- **Resolution path:** adr
- **Resolution:**

### AC-009 — UI framework 선택과 확장 구조

- **Category:** Deliverable form
- **Status:** identified
- **Statement:** 정적 HTML을 유지할지 React·Vue·Svelte 등 component framework를 도입할지, 선택한 UI의 page·component·data-query 경계를 어떻게 구성할 것인가?
- **Why it matters:** log list/detail과 content 표시를 넘어 분석·report·chart를 추가할 때 확장성, 번들 크기, 운영 복잡도, 기존 UI migration 비용이 달라진다.
- **Depends on:** AC-006, AC-007
- **Related ADRs:** 없음
- **Resolution path:** adr
- **Resolution:**

### AC-010 — Provider 설정과 model routing 계약

- **Category:** Integration & dependencies
- **Status:** identified
- **Statement:** provider의 base URL·API key와 client model ID → provider·provider model ID 매핑을 어떤 설정 스키마와 secret loading 방식으로 표현하고, 미등록 model·잘못된 설정을 어떻게 처리할 것인가?
- **Why it matters:** routing 계약은 복수 provider 지원의 호환성, 설정 오류의 검출 시점, 인증정보 보호 및 향후 provider 추가 비용을 결정한다.
- **Depends on:** AC-001, AC-004
- **Related ADRs:** 없음
- **Resolution path:** adr
- **Resolution:**

### AC-011 — API adapter 확장 경계

- **Category:** Structure & organization
- **Status:** identified
- **Statement:** Responses·Chat Completions·Messages 및 향후 API를 별도 adapter/route contract로 추가하면서 provider routing·log persistence와 직접 결합되지 않도록 어떤 경계를 둘 것인가?
- **Why it matters:** adapter 경계가 불명확하면 API별 payload·streaming 차이가 핵심 서버와 저장소로 새고, 새 API 추가 때 회귀 범위와 결합도가 커진다.
- **Depends on:** AC-008, AC-010
- **Related ADRs:** 없음
- **Resolution path:** direct-input
- **Resolution:**

### AC-012 — API log writer와 UI read 경계

- **Category:** Structure & organization
- **Status:** identified
- **Statement:** API request path의 log writer와 UI query path의 read repository/query service를 어떤 port·repository·공통 domain model로 분리하고, SQLite schema·migration·redaction·본문 크기 제한 책임을 어디에 둘 것인가?
- **Why it matters:** 쓰기 경로와 조회 경로를 직접 결합하면 API 처리와 UI 요구사항이 서로의 변경을 강제하고, 민감정보 보호·migration 책임이 분산된다.
- **Depends on:** AC-003, AC-004, AC-009
- **Related ADRs:** 없음
- **Resolution path:** adr
- **Resolution:**

### AC-013 — 구조 변경의 migration·회귀·실행 기준

- **Category:** Quality bar (architectural)
- **Status:** identified
- **Statement:** 모듈 분리와 schema 변경이 기존 MVP 동작을 보존했음을 어떤 migration 순서, 자동화 회귀 검증, 단일 프로세스 실행 문서로 입증할 것인가?
- **Why it matters:** 설계 변경은 기능 회귀와 실행 불능 위험을 만들 수 있으므로 구현 전에 검증 범위와 실행 계약을 고정해야 한다.
- **Depends on:** AC-008, AC-009, AC-010, AC-011, AC-012
- **Related ADRs:** 없음
- **Resolution path:** direct-input
- **Resolution:**

## Notes

- 2026-03-10: 승인된 PRD를 바탕으로 초기 blocking AC 7개를 식별했다.
- 2026-03-10: 승인된 PRD delta를 바탕으로 AC-008~AC-013을 추가 식별했다. 기존 AC-003(저장 모델)과 구분하여 AC-012는 API write/UI read의 access boundary에 집중한다.
