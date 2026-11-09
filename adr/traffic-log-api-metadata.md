# 다중 API Traffic Log Metadata 정규화

## Concern
서로 다른 API 계약의 요청·응답·streaming traffic을 기존 SQLite log model에 어떤 API kind, provider, model 및 raw content metadata로 기록할 것인가?

## Status
approved

## Context
- 기존 traffic log는 model, streaming, status, HTTP status, request/response body 및 error를 저장한다.
- 이번 delta는 Responses, Chat Completions, Claude Messages를 하나의 proxy에서 제공한다.
- API별 payload는 변환하지 않고 원본 계약을 보존하므로, 로그에서도 원본 request/response body를 유지해야 한다.
- 운영자는 동일 client model 또는 provider를 사용하는 서로 다른 API traffic을 구분할 수 있어야 한다.

## Decision
**Option B — Add first-class `api_kind` column.** Traffic log table과 domain model에 `api_kind`를 추가하고 Responses, Chat Completions, Messages를 구분한다. 기존 Responses row와 기존 호출 경로에는 `responses` 기본값을 사용해 migration compatibility를 유지한다. API별 raw request/response body는 기존 bounded JSON/text 정책으로 보존하며 API 간 변환하지 않는다.

## Options
### Option A — Existing columns plus API kind in request metadata
- 기존 schema를 유지하고 API kind를 masked request JSON envelope의 `api` 필드로 저장한다.
- Pro: schema migration이 작고 기존 reader/query와 호환된다.
- Con: API kind 필터를 SQL column으로 직접 제공하기 어렵다.

### Option B — Add first-class `api_kind` column
- traffic log table에 `api_kind` column을 추가하고 목록·상세 query model에도 노출한다.
- Pro: API별 필터와 집계가 명확하고 운영 조회가 쉽다.
- Con: SQLite migration, 기존 row default, reader/UI 타입 변경이 필요하다.

### Option C — Separate table per API
- Responses, Chat Completions, Messages별로 별도 traffic table을 둔다.
- Pro: API별 schema를 자유롭게 구성할 수 있다.
- Con: 공통 목록·pagination·UI query가 복잡해지고 기존 access boundary와 어긋난다.

## Tradeoffs
| | Option A — Metadata envelope | Option B — First-class column | Option C — Separate tables |
|---|---|---|---|
| Migration cost | 낮음 | 중간 | 높음 |
| API별 조회·필터 | 제한적 | 명확 | 복잡 |
| Raw contract preservation | 높음 | 높음 | 높음 |
| Existing schema compatibility | 높음 | 중간 | 낮음 |
| Future analytics | 제한적 | 좋음 | API별로 분산 |

## Recommendation
- **Option B — Add first-class `api_kind` column**을 권장했으며, 사용자가 Option B를 선택했다.
- API kind는 운영자가 직접 구분하고 필터링할 가능성이 높으므로 세 API의 핵심 식별 metadata로 저장한다.

## Consequences
- traffic log schema와 domain model에 `apiKind`/`api_kind`를 추가한다.
- 기존 Responses row와 기존 호출 경로에는 `responses` 기본값을 사용해 migration compatibility를 유지한다.
- request/response raw body는 기존 bounded JSON/text 정책으로 저장하며 API 간 변환하지 않는다.
- list/detail query와 UI model에 API kind를 노출하고 필요하면 filter를 추가한다.

## Downstream Concerns
- [x] **covered — Raw body format:** AC-014 Option A에 따라 API별 원본 request/response를 저장한다.
- [x] **directly resolved — Initial filter UI:** 이번 구현에서는 API kind 저장·상세 노출·query 지원을 우선하고 UI filter는 구현 범위에서 별도 acceptance criterion으로 명시한다.
- [ ] **ADR candidate — Usage and cost metadata:** token usage 추출과 cost 산정·저장 방식은 별도 AC-018에서 결정한다.
- [x] **covered — Secret redaction and size:** 기존 AC-004, AC-012 정책을 유지한다.

## Related
- `spec/AC.md` — AC-003, AC-012, AC-017
- `adr/traffic-log-storage.md`
- `spec/llm-proxy-server.md` — R-006, R-007

## Notes
- 2026-03-10: AC-017 검토를 위해 metadata envelope, first-class column, separate table을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 선택으로 Option B를 승인했다. `api_kind`를 first-class SQLite column으로 추가한다.
