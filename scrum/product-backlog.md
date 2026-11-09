# Product Backlog — LLM Proxy Server

> **Updated:** 2026-03-10

> **Execution board:** [`../TODO.md`](../TODO.md)

## Stories

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

  - [x] **PB-001** — 초기 제품 백로그 생성
  - Story: LLM Proxy Server의 승인된 PRD, 설계 결정, Spec을 바탕으로 구현 가능한 제품 백로그를 정의한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements, §Constraints
  - Sprint: sprint-00
  - Depends: —
  - Notes: Spec→backlog 스프린트에서 DoD 충족 후 Boundary에서 종료.

- [ ] **PB-012** — Chat Completions와 Claude Messages API 지원 요구사항 및 구현 backlog 확정
  - Story: 기존 Responses 프록시와 로그·provider routing 구조를 보존하면서 OpenAI Chat Completions API와 Claude Messages API를 지원하기 위해, 승인된 계약·설정·보안·streaming·오류·회귀 검증 기준과 구현 가능한 하위 backlog가 확정된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements/§Constraints — delta 예정
  - Sprint: sprint-07
  - Depends: PB-002, PB-003, PB-007, PB-008, PB-009, PB-011
  - Notes: 현재는 Spec→backlog 스프린트 Scope. 실제 제품 코드 구현은 후속 Backlog→Implementation sprint에서 수행한다.

## Notes

- 2026-03-10: Spec 승인 후 PB-002–PB-006을 초기 구현 백로그로 추가했다.
- 2026-03-10: sprint-00 Boundary에서 PB-001을 종료하고 sprint-01 실행을 시작했다.
- 2026-03-10: sprint-01의 curl 기반 통합 데모 검증을 완료하고 PB-002–PB-004를 종료했다. PB-005–PB-006은 다음 스프린트 계획 대상으로 유지한다.
- 2026-03-10: sprint-02 Spec→backlog Boundary 완료. PB-007~PB-011의 설계 DoD를 충족하고 실제 구현은 implementation sprint로 이월했다.
- 2026-03-10: sprint-03 Boundary 완료. PB-005 UI 기능은 구현했으며 C-008 module extraction과 R-016 실행 문서는 sprint-04 Scope로 carry-over했다.
- 2026-03-10: sprint-04 Boundary 완료. PB-005~PB-007을 종료하고 sprint-05에 PB-008, PB-009, PB-011을 커밋 후보로 계획했다.
- 2026-03-10: sprint-05 Boundary 완료. PB-008, PB-009, PB-011을 종료하고 PB-010을 sprint-06 Scope로 계획했다.
- 2026-03-10: sprint-06 Boundary 완료. PB-010을 종료하고 현재 제품 backlog의 모든 story를 완료했다.
