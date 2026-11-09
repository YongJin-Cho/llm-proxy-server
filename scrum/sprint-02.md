# Sprint 02 — 확장 가능한 아키텍처 설계와 백로그 갱신

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)
> **Sprint kind:** Spec→backlog delta

## Sprint Goal

현재 `src/server.ts`에 집중된 구현을 향후 API·UI·provider·저장소 확장에 견딜 수 있는 구조로 재설계한다. API/UI 프레임워크 선택, 복수 LLM provider와 model ID 라우팅, API 로그와 UI 조회를 분리하는 DB 접근 경계를 설계하고, 승인된 설계를 Spec과 제품 백로그에 반영한다.

이 스프린트는 구현 스프린트가 아니다. 스프린트 완료 후 sprint-03부터 승인된 설계를 기준으로 리팩터링·기능 구현을 시작한다.

## Scope

| ID | Story |
|----|-------|
| PB-007 | 모듈형 서버·API 확장 구조와 프레임워크 기준 |
| PB-008 | 복수 LLM provider 및 model ID 라우팅 |
| PB-009 | API 로그 기록과 UI 조회를 분리하는 DB 접근 구조 |
| PB-010 | 확장 가능한 모니터링 UI 구조 |
| PB-011 | 구조 변경에 대한 마이그레이션·검증·실행 문서 |

**Carry-over / Out of sprint:** PB-005와 PB-006의 실제 UI·자동화 구현은 sprint-03 이후로 이월한다. Chat Completions와 Claude Messages API의 실제 provider 연동 구현, 차트·리포트의 완성 기능, 인증·외부 노출은 이번 설계 스프린트의 구현 범위가 아니다. 다만 API adapter와 UI feature 확장 지점은 설계와 acceptance 기준에 포함한다.

## Design decisions to resolve

1. **API framework:** 현재 Node HTTP 직접 라우팅을 유지할지, Fastify·Hono 등 HTTP framework를 도입할지 비교하고 선택한다. 선택 기준은 route/plugin 확장성, TypeScript 지원, streaming/SSE 제어, 테스트성, 의존성 비용이다.
2. **UI framework:** 정적 HTML을 유지할지, React·Vue·Svelte 등 component framework를 도입할지 비교하고 선택한다. 선택 기준은 로그 상세 content 표시, feature/module 확장, 분석·리포트·차트 추가성, 번들·운영 복잡도다.
3. **Provider configuration contract:** provider는 `baseUrl`과 `apiKey`로 정의하고, client model ID를 `{ provider, providerModel }`로 매핑하는 설정 형식과 secret 로딩 방식을 확정한다. 예: `gpt-6-luna → openrouter.ai/api/v1 + openai/gpt-6-luna`.
4. **API adapter boundary:** Responses뿐 아니라 Chat Completions, Messages 및 향후 API를 별도 adapter/route contract로 추가할 수 있는 구조를 확정한다. 실제 추가 API 구현 여부는 별도 구현 스프린트에서 결정한다.
5. **DB access boundary:** API request path의 log writer와 UI query path의 read repository/query service를 분리하고, 공통 domain model·migration·redaction 정책을 어디에 둘지 확정한다.

## Definition of Done

1. `server.ts`의 책임을 application bootstrap, configuration, HTTP routing/middleware, API adapters, provider client/routing, logging/domain, persistence, UI delivery/query 영역으로 분리하는 target module map과 migration 순서가 Spec에 기록되어 있다.
2. API framework와 UI framework의 후보·trade-off·선택 결과가 ADR에 기록되고, 사용자 승인된 결정이 Spec의 요구사항/제약으로 복사되어 있다.
3. provider 설정 스키마가 provider URL·key와 client model ID → provider/model ID 매핑을 표현하며, 미등록 model·잘못된 설정·key 노출을 어떻게 처리하는지 정의한다.
4. API adapter가 provider routing과 log persistence에 직접 결합되지 않는 contract를 가지며, Responses·Chat Completions·Messages·향후 API를 추가할 확장 지점이 acceptance 기준에 포함되어 있다.
5. API log write와 UI DB read가 별도 port/repository/service 경계로 정의되고, SQLite schema/migration 및 redaction·size limit 책임이 한 곳에 명확히 배치되어 있다.
6. UI가 log list/detail뿐 아니라 저장된 content 표시, 분석·report·chart feature를 추가할 수 있는 page/component/data-query 구조를 갖도록 설계되어 있다.
7. 기존 PB-005·PB-006과 신규 PB-007~PB-011의 의존관계·실행 순서가 제품 백로그에 반영되고, sprint-03 구현 범위가 추적 가능하다.
8. 현재 MVP 동작을 보존하는 마이그레이션 전략, 회귀 검증 항목, 단일 프로세스 실행 문서 갱신 계획이 기록되어 있다.

## Approval

- 2026-03-10: 사용자 go-ahead(“ok”)로 sprint-02 계획 승인. 실행 보드를 시드하고 Spec→backlog delta 실행을 시작한다.

## Demo Checklist

- `server.ts` 단일 파일 책임을 target module map으로 분해한 설계 검토
- API framework 후보와 UI framework 후보의 ADR trade-off 및 사용자 승인 결정 확인
- provider/model routing 설정 예시와 미등록 model 오류 정책 확인
- Responses·Chat Completions·Messages·향후 API를 위한 adapter 확장 흐름 확인
- API log writer와 UI read repository/query service의 DB 경계 확인
- content viewer 및 report/chart feature 확장 구조 확인
- PB-005/006 이월과 sprint-03 구현 후보가 백로그에 반영되었는지 확인
- 기존 MVP 회귀 검증·마이그레이션·실행 문서 계획 확인
