# Sprint 17 — API adapter 경계와 코드 품질 개선

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
구현 품질 검토에서 확인된 API 유형 의존성 누수와 반복 코드를 정리해, API별 schema 해석이 adapter 경계 안에 머물고 persistence·domain·route의 역할이 더 명확해지도록 개선한다. 기존 세 API의 동작과 회귀 검증을 유지하면서 새 API 추가 비용과 단위 테스트 결합도를 낮춘다.

## Scope

| ID | Story |
|----|-------|
| PB-037 | 공통 ProxyAdapter의 API schema 누수 제거 |
| PB-038 | API별 turn summary projector와 persistence 경계 분리 |
| PB-039 | API adapter registry 및 공통 transport helper 정리 |
| PB-040 | 분석·주입·HTTP 입력 경계 개선 |
| PB-041 | 구조 개선 회귀 검증 및 문서 갱신 |

**Out of sprint:** ProviderClient/stream lifecycle의 대규모 분리, 새로운 API 지원, UI 기능 추가, DB 엔진 교체

## Definition of Done
1. 공통 `ProxyAdapter`가 Responses/Chat Completions/Messages의 payload field를 추측하지 않고, API별 concrete adapter가 aggregate 결과를 책임진다.
2. SSE transport-level parsing과 API별 aggregate/usage/semantic 처리가 구분되며 기존 세 API의 non-streaming·streaming 동작이 보존된다.
3. `SqliteTrafficLogStore`에 있는 API별 user input/AI output summary 해석이 API별 projector 또는 동등한 application 경계로 이동한다.
4. API registry/composition 구조가 route 등록, proxy adapter 선택, analysis adapter 선택에 일관되게 사용되며 API 종류의 중복 중앙 등록을 줄인다.
5. 동일한 SSE parsing, string filtering, empty usage, tool interaction correlation 같은 보조 로직의 중복이 의미 보존을 전제로 정리된다. API별 aggregate 알고리즘은 concrete adapter에 남는다.
6. `ProxyService`의 writer, turn lifecycle, analysis persistence 의존성이 명시적인 port/구성 경계로 드러나고 독립 mock이 가능한 구조가 된다.
7. route query/body 정규화가 별도 입력 adapter 또는 helper로 분리되고 application service에는 검증된 타입이 전달된다.
8. turn analysis 결과 모델과 Markdown rendering 책임이 분리되거나, 현재 범위에서 분리하지 않는 경우 그 근거가 코드 문서에 기록된다.
9. 기존 `npm run build`와 `npm run verify`가 통과하고, API registry completeness·summary projection·adapter boundary에 대한 회귀 검증이 추가된다.
10. `AGENTS.md`와 `verification/code-quality-review.md`가 실제 최종 구조와 검증 결과를 반영한다.

## Demo Checklist
- [x] 세 API의 aggregate 결과가 공통 base의 schema 추측 없이 concrete adapter에서 생성된다.
- [x] 기존 세 API의 streaming completion/error, usage/cost, turn grouping, turn notes 회귀 검증이 통과한다.
- [x] SQLite persistence가 API별 summary field를 직접 분기하지 않고 projector 결과를 사용한다.
- [x] 하나의 registry/composition 경계에서 proxy/analysis adapter가 일관되게 선택된다.
- [x] 공통 SSE parser와 utility 중복이 제거되고 API별 의미 해석은 유지된다.
- [x] ProxyService 의존성이 독립적으로 대체 가능한 port 경계로 확인된다.
- [x] route query/body 입력 정규화 및 잘못된 입력 처리 fixture가 통과한다.
- [x] API-neutral analysis model과 Markdown renderer의 책임 경계가 코드와 문서에 드러난다.
- [x] `npm run build`와 `npm run verify`가 통과한다.
- [x] 품질 검토 문서와 `AGENTS.md`가 변경된 구조 및 evidence와 일치한다.

## Approval
- Drafted 2026-03-10 after Sprint 16 completion approval.
- Sprint plan approved by user go-ahead("ok") on 2026-03-10.
- Execution started with T-001 as Current focus.
