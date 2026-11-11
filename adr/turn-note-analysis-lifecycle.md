# Turn Note 분석 Lifecycle과 Idempotency

## Concern
완료된 turn의 분석을 언제 어떻게 실행하고, 중복 완료 event·프로세스 재시작·분석 실패 재시도에서 note를 어떻게 중복 없이 관리할 것인가?

## Status
approved

## Context
- turn completion 저장은 note 분석 성공 여부와 독립적으로 보존되어야 한다.
- `TurnAnalysisService`는 완료 turn을 읽고 API별 `TurnAnalysisAdapter`를 실행한 뒤 note projection을 저장한다.
- 분석은 DB 조회·Markdown 생성·note 저장을 추가하므로 proxy 요청 경로의 latency와 오류 전파를 결정한다.
- 중복 completion event와 프로세스 재시작 시 같은 turn에 note가 중복 생성되거나 영구 pending이 되지 않아야 한다.

## Decision
**Option B — completion 후 비동기 분석 job**을 채택한다. turn completion을 먼저 확정하고 note analysis를 pending job으로 실행한다. `turn_id + analysis_version`을 idempotency key로 사용하며, 상태는 `pending → ready/empty/failed`로 전이한다. 중복 completion event는 동일 key upsert로 중복 note를 만들지 않고, 분석 실패는 completed turn과 traffic 저장에 전파하지 않는다.

## Options
### Option A — Turn completion transaction 안에서 동기 분석
- turn 완료와 같은 요청/transaction에서 분석하고 note까지 저장한 뒤 completion을 확정한다.
- Pro: 성공 시점과 note가 강하게 일치하고 흐름이 단순하다.
- Con: 분석 latency·실패가 client 응답과 turn completion에 영향을 주며, adapter 오류가 proxy 경로로 전파된다.

### Option B — Completion 후 비동기 분석 job
- turn completion을 먼저 확정하고 note analysis job을 pending으로 만든 뒤 별도 worker/service가 분석·저장한다.
- 분석 결과는 stable `turn_id`와 analysis version을 idempotency key로 사용해 upsert한다.
- Pro: proxy completion과 note 분석을 격리하고 재시도·관찰성을 명확히 할 수 있다.
- Con: 완료 직후에는 pending 상태가 보이며 job 실행·복구 경계가 필요하다.

### Option C — 조회 시 lazy analysis
- Turn view나 turn query가 note가 없으면 해당 turn을 즉시 분석하고 결과를 저장한다.
- Pro: 실제 조회되는 turn만 분석하고 별도 completion hook이 적다.
- Con: 조회 latency·동시 요청 중복·UI read path 실패가 발생하며 운영자가 조회하지 않은 turn은 분석되지 않는다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| proxy completion 독립성 | 낮음 | 높음 | 높음 |
| pending 상태 필요성 | 낮음 | 높음 | 높음 |
| 재시도·복구 제어 | 낮음 | 높음 | 중간 |
| 구현 복잡도 | 낮음 | 중간 | 중간 |
| 중복 분석 방지 | transaction 의존 | idempotency key/upsert | 동시 query lock 필요 |
| UI latency 영향 | 높음 | 낮음 | 높음 |

## Recommendation
- **Option B — completion 후 비동기 분석 job**을 권장한다.
- note는 `turn_id + analysis_version`을 idempotency key로 사용하고, 상태 전이는 `pending → ready/empty/failed`로 제한한다. 같은 completion event가 다시 들어와도 기존 동일 버전 결과를 중복 삽입하지 않고, failed job의 retry는 기존 projection을 갱신한다.

## Consequences
- turn completion은 note 분석과 무관하게 성공·저장된다.
- Turn 조회는 분석 전 `pending`, tool 사용이 없는 정상 분석 `empty`, 성공 `ready`, 재시도 가능한 분석 오류 `failed`를 구분해 반환한다.
- worker/service 재시작 시 pending 또는 retryable failed job을 다시 집을 durable job 상태 저장이 필요하다.
- 동기 분석과 조회 시 lazy analysis는 이번 범위의 기본 실행 방식으로 사용하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Job durability:** pending job을 note row 상태만으로 복구할지 별도 analysis job record/queue를 둘지
- [ ] **ADR candidate — Retry policy:** retry 횟수·backoff·permanent failure 판정
- [x] **covered — Duplicate completion event:** `turn_id + analysis_version` idempotency key와 upsert로 중복을 억제한다.
- [x] **directly resolved — Analysis version default:** 초기 구현은 schema/contract version 하나로 시작하고 note 규칙 변경 시 version을 증가시킨다.

## Related
- `spec/AC.md` — AC-031
- `adr/turn-note-semantic-contract.md` — approved
- `adr/turn-note-adapter-boundary.md` — approved
- `spec/PRD.md` — Delta: Turn 완료 후 API별 분석 note

## Notes
- 2026-03-10: AC-031 review를 위해 동기 completion, completion 후 비동기 job, 조회 시 lazy analysis 대안을 작성하고 Option B를 권장했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option B와 `turn_id + analysis_version` idempotency 정책을 승인했다.
