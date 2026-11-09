# Product Backlog — LLM Proxy Server

> **Execution board:** [`../TODO.md`](../TODO.md)

## Stories

- [ ] **PB-002** — Responses API 프록시와 오류 전달
  - Story: localhost의 LLM 클라이언트가 `/api/v1/responses`로 요청하면 Provider에 전달되고 성공·Provider 오류·네트워크 오류가 클라이언트와 로그에 추적 가능한 형태로 반환된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-001–R-003; §Constraints C-001, C-005, C-007
  - Sprint: sprint-01
  - Depends: —
  - Notes: 초기 `/api/v1/responses` 범위. 백엔드 API는 `/api/v1` 아래에 두며 `/v1/responses` 별칭은 제공하지 않는다. Chat Completions와 Claude Messages API는 후속이다.

- [ ] **PB-003** — SSE 스트리밍 프록시와 집계 로그
  - Story: 스트리밍 Responses 요청의 SSE 이벤트가 클라이언트에 전달되고 정상·실패 종료 결과가 집계 로그로 저장된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-004–R-005; §Constraints C-002
  - Sprint: sprint-01
  - Depends: PB-002

- [ ] **PB-004** — SQLite 요청·응답 로그 저장 및 조회 API
  - Story: 프록시 요청·응답 쌍이 마스킹·크기 제한 후 SQLite에 저장되고, 최신순·필터·페이지네이션·상세 조회 API로 조회된다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-006–R-007, R-011; §Constraints C-003–C-004, C-008
  - Sprint: sprint-01
  - Depends: PB-002

- [ ] **PB-005** — 트래픽 모니터링 웹 UI
  - Story: localhost 웹 UI에서 저장 로그 목록을 최신순으로 확인하고 상태·모델·기간 필터, 페이지네이션, 요청·응답·메타데이터·오류 상세를 볼 수 있다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-008–R-009; §Constraints C-005–C-006
  - Sprint: sprint-02
  - Depends: PB-004

- [ ] **PB-006** — 자동화된 핵심 동작 검증과 실행 문서
  - Story: 정상·실패 프록시, SSE, 저장·조회, 마스킹, UI 목록·상세를 자동화된 검증으로 재현하고 단일 프로세스 실행 설정을 문서화한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements R-010–R-011; §Constraints C-007–C-008
  - Sprint: sprint-02
  - Depends: PB-002, PB-003, PB-004, PB-005

- [x] **PB-001** — 초기 제품 백로그 생성
  - Story: LLM Proxy Server의 승인된 PRD, 설계 결정, Spec을 바탕으로 구현 가능한 제품 백로그를 정의한다.
  - Spec: `spec/llm-proxy-server.md` §Requirements, §Constraints
  - Sprint: sprint-00
  - Depends: —
  - Notes: Spec→backlog 스프린트에서 DoD 충족 후 Boundary에서 종료.

## Notes

- 2026-03-10: Spec 승인 후 PB-002–PB-006을 초기 구현 백로그로 추가했다.
- 2026-03-10: sprint-00 Boundary에서 PB-001을 종료하고 sprint-01 실행을 시작했다.
