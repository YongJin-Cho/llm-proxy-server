# Sprint 04 — 모듈 분리·소스 구조 정리와 실행 검증 완성

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)
> **Sprint kind:** Backlog→Implementation

## Sprint Goal

sprint-03에서 구현한 React UI와 Fastify delivery를 유지하면서 모든 애플리케이션 소스코드를 `src/` 경계 아래로 정리하고, `server.ts`에 남은 proxy·persistence·route 책임을 승인된 module map으로 분리한다. 또한 구현 단계의 운영 기준을 `AGENTS.md`로 명시하고, 단일 프로세스 실행 문서와 자동화 검증을 완성한다.

## Scope

| ID | Story |
|----|-------|
| PB-005 | 확장 가능한 트래픽 모니터링 웹 UI 구현 — carry-over DoD closure |
| PB-006 | 자동화된 핵심 동작 검증과 실행 문서 |
| PB-007 | 모듈형 서버·API 확장 구조와 framework 기반 |

**Out of sprint:** PB-008 provider/model routing의 실제 다중 provider 구현, PB-009의 추가 read/write 기능, PB-010의 추가 UI feature, PB-011의 broader migration policy는 후속 slice로 둔다. 단, 현재 Spec의 module boundary와 실행 문서 기준에 필요한 최소 연결은 포함한다.

## Additional implementation decisions

1. **Source root:** React UI source(`main.tsx`, styles 및 관련 component/data-query module)는 `src/ui/` 아래로 이동한다. `ui/`에는 Vite entry/build configuration이 필요할 때만 최소 파일을 두며, 애플리케이션 소스의 기준 경로는 `src/`로 한다.
2. **Agent operating guide:** 구현 시작 시 `AGENTS.md`를 생성하고 module map, build/verify 명령, Spec SSOT 규칙, source placement, secret handling, 변경·검증 절차를 기록한다. 구조나 검증 규칙이 바뀌면 같은 sprint의 구현 작업으로 갱신한다.

## Definition of Done

1. `src/server.ts`는 bootstrap/lifecycle에 집중하고 configuration, API routes/adapters, proxy application service, persistence writer/reader, UI delivery 책임이 별도 module로 분리된다.
2. React UI source와 관련 CSS/component/data-query code가 `src/ui/` 아래에 있고, `ui/` 경로에 중복된 애플리케이션 source가 남지 않는다.
3. `/api/v1/responses`, SSE, `/api/v1/logs`, `/api/v1/logs/:id`, React UI가 기존 동작과 동일하게 제공된다.
4. `TrafficLogWriter`와 `TrafficLogReader` port 및 SQLite adapter 경계가 코드에 반영된다.
5. `AGENTS.md`가 현재 module map, 구현·검증 명령, Spec SSOT와 source placement 규칙을 설명하고 실제 구조와 일치한다.
6. 정상·실패 proxy, SSE, SQLite persistence/query, masking, UI list/detail을 자동화 검증으로 재현한다.
7. 단일 프로세스 실행 문서에 config file/schema, secret 환경변수, SQLite path, host/port, UI/server build/start 절차가 기록된다.
8. `npm run build`와 `npm run verify`가 통과하고 verification report의 C-008/R-016 partial이 해소된다.

## Demo Checklist

- React source가 `src/ui/`에 있고 `ui/` 중복 source가 제거됐는지 확인
- `AGENTS.md`와 실제 module map/source placement 비교
- `server.ts`가 bootstrap/lifecycle 중심인지 확인
- writer/reader port와 SQLite adapter 확인
- 기존 proxy/SSE/log/UI 회귀 검증
- 실행 문서에 필요한 설정·실행 절차 확인
- `npm run build`, `npm run verify`, verification report 확인

## Approval

- 2026-03-10: 계획 수정 및 재승인 완료. 승인된 Scope로 Execute를 진행한다.

