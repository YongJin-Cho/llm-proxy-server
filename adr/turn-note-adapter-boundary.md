# Turn Analysis Adapter 경계

## Concern
기존 proxy adapter와 별도로, 완료된 turn을 분석해 note를 추가하는 분석 객체와 DB access 경계를 어떻게 구성할 것인가?

## Status
approved

## Context
- 기존 proxy adapter는 API 요청 전달, API별 response 변환, tool identity 추출, turn grouping, SSE aggregation 등 traffic lifecycle을 담당한다.
- Sprint 15의 turn analysis는 완료된 turn을 저장소에서 읽고 API 종류에 따라 도구 사용 이력을 분석한 뒤 `TurnNote[]`를 생성·저장한다.
- note 분석 실패나 분석 규칙 변경이 기존 proxy traffic 저장·turn completion 판정에 영향을 주면 안 된다.
- 기존 SQLite writer/query boundary와 API adapter 확장 경계를 유지해야 한다.

## Decision
**Option B — `TurnAnalysisService` + API별 `TurnAnalysisAdapter` + persistence ports**를 채택한다. 완료된 turn은 `TurnReader`로 조회하고, API 종류에 맞는 `TurnAnalysisAdapter`가 분석해 `TurnNote[]`를 반환한다. `TurnAnalysisService`는 상태·idempotency·재시도를 orchestration하고 `TurnNoteWriter`로 note projection을 저장한다. adapter는 SQLite에 직접 접근하지 않는다.

## Options
### Option A — 기존 proxy adapter에 turn analysis를 추가
- 각 API의 기존 proxy adapter가 forwarding, grouping, stream aggregation, turn analysis와 note rendering을 모두 제공한다.
- Pro: API별 payload 해석이 한곳에 모이고 별도 분석 객체가 적다.
- Con: note 규칙 변경이 proxy lifecycle 회귀 범위를 넓히며 adapter 책임이 과도하게 커진다.

### Option B — `TurnAnalysisService` + API별 `TurnAnalysisAdapter` + persistence ports
- `TurnAnalysisService`가 완료 turn을 `TurnReader` port로 읽고 `api_kind`에 맞는 `TurnAnalysisAdapter`를 선택한다.
- `TurnAnalysisAdapter`는 전달받은 turn data만 분석해 `TurnNote[]`와 분석 결과를 반환하며 SQLite나 turn lifecycle state에 직접 접근하지 않는다.
- service가 `TurnNoteWriter` port로 note projection을 저장하고 idempotency·재시도·상태 갱신을 orchestration한다.
- Pro: 사용자가 의도한 “완료 turn 조회 → API별 분석 → note DB 저장” 흐름을 유지하면서 proxy adapter와 저장소 구현을 격리한다.
- Con: service, reader port, writer port, API별 adapter라는 명시적 경계가 추가된다.

### Option C — `TurnAnalysisAdapter`가 DB를 직접 읽고 쓰기
- 완료 event가 API별 `TurnAnalysisAdapter`를 호출하고, adapter가 turn 조회와 note 저장을 직접 수행한다.
- Pro: 흐름이 짧고 구현 객체 수가 적다.
- Con: adapter가 SQLite schema와 transaction/idempotency에 결합되어 API별 adapter 변경이 persistence 회귀로 이어질 수 있다.

### Option D — 저장 후 query service에서 매번 turn 재분석
- Turn view 조회 시 query service가 저장된 turn을 읽고 API별 분석을 실행해 note를 계산한다.
- Pro: 별도 완료 lifecycle 작업이 적고 과거 data 재분석이 쉽다.
- Con: 조회 latency와 실패가 UI read path로 전파되며, note가 영구 projection으로 남지 않는다.

## Tradeoffs
| | Option A | Option B | Option C | Option D |
|---|---|---|---|---|
| 기존 proxy lifecycle 격리 | 낮음 | 높음 | 중간 | 높음 |
| DB access 경계 | 기존 adapter에 혼합 | ports로 격리 | adapter에 결합 | query에 결합 |
| 사용자 제안 흐름 적합성 | 중간 | 높음 | 높음 | 중간 |
| idempotency·재시도 제어 | 중간 | 높음 | adapter별 분산 | 낮음 |
| 구현 경계 복잡도 | 낮음 | 중간 | 낮음 | 중간 |
| API별 확장성 | 낮음 | 높음 | 중간 | 중간 |

## Recommendation
- **Option B — `TurnAnalysisService` + API별 `TurnAnalysisAdapter` + `TurnReader`/`TurnNoteWriter` ports**를 권장한다.
- 명명은 범위가 분명한 **`TurnAnalysisAdapter`**를 사용한다. `AnalysisAdapter`는 향후 다른 분석까지 포함할 수 있어 현재 concern보다 넓다.
- DB에서 turn을 읽고 note를 DB에 추가한다는 제품 흐름은 유지하되, adapter는 raw SQLite가 아니라 service가 전달한 turn data와 persistence ports를 통해 동작하도록 한다.

## Consequences
- 승인 시 완료 turn 분석의 호출 주체는 `TurnAnalysisService`가 된다.
- API별 `TurnAnalysisAdapter`는 Responses, Chat Completions, Claude Messages의 payload 의미 차이를 캡슐화한다.
- `TurnReader`는 완료 turn과 필요한 traffic/request/response projection을 제공하고, `TurnNoteWriter`는 note status와 `TurnNote[]`를 별도 projection으로 저장한다.
- 기존 proxy adapter, traffic writer, turn completion 저장은 note 분석 실패와 독립적으로 성공할 수 있다.
- 과거 traffic 무제한 소급 재분석과 UI 조회 시 매번 분석하는 방식은 이번 범위에 포함하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Analysis input projection:** `TurnReader`가 adapter에 전달할 turn data에 원본 request/response 전체와 필요한 metadata를 어떤 범위로 포함할지
- [ ] **ADR candidate — Note write transaction:** turn completion과 note status/notes 저장을 같은 transaction으로 묶을지 분리할지
- [x] **directly resolved — Adapter naming:** 현재 범위에서는 `TurnAnalysisAdapter`를 사용한다. `AnalysisAdapter`는 범위가 불명확하다.
- [x] **covered — API별 payload 해석:** 각 `TurnAnalysisAdapter`가 담당한다. AC-029와 기존 API adapter 경계에 근거한다.

## Related
- `spec/AC.md` — AC-030
- `adr/turn-note-semantic-contract.md` — approved
- `spec/PRD.md` — Delta: Turn 완료 후 API별 분석 note

## Notes
- 2026-03-10: AC-030 review를 위해 기존 adapter 확장, 별도 분석 adapter, query 재분석 세 가지 대안을 작성하고 별도 adapter를 권장했다.
- 2026-03-10: 사용자 제안에 따라 완료 turn을 DB에서 읽고 분석 결과를 DB에 추가하는 흐름을 반영했다. `TurnAnalysisService`가 ports를 통해 orchestration하고 API별 `TurnAnalysisAdapter`는 DB에 직접 결합하지 않는 Option B를 권장안으로 정리했다.
- 2026-03-10: 사용자 go-ahead("좋아")로 Option B와 `TurnAnalysisAdapter` 명명을 승인했다.
