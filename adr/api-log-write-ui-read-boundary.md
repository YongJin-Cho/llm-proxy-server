# API 로그 기록과 UI 조회 경계

## Concern
API request path의 log writer와 UI query path의 read repository/query service를 어떻게 분리할 것인가?

## Status
approved

## Context
- 현재 MVP의 `server.ts`가 API 처리, SQLite write, 로그 목록·상세 query를 모두 직접 수행한다.
- sprint-02는 API adapter가 provider 요청 처리에 집중하고, UI는 로그 조회 요구사항을 독립적으로 확장할 수 있는 구조를 요구한다.
- 저장소는 SQLite이며, 공통 domain model·migration·redaction·본문 크기 제한 책임도 명확해야 한다.
- API와 UI는 하나의 프로세스에서 실행되지만 서로 다른 access path를 가져야 한다.

## Decision
**Option B — 별도 writer/query port와 SQLite adapter.** 공통 domain 계층에 traffic log model과 redaction·size limit policy를 두고, API application service는 `TrafficLogWriter`, UI query service는 `TrafficLogReader` port에만 의존한다. SQLite adapter가 schema·migration과 두 port 구현을 소유하며, 초기에는 동일 SQLite 파일과 프로세스로 strong consistency를 유지한다.

## Options
### Option A — 공통 repository 하나로 읽기·쓰기 통합
- 하나의 traffic repository가 write와 query method를 모두 제공한다.
- Pro: 초기 모듈 수와 코드량이 적고 transaction model이 단순하다.
- Con: API write 요구와 UI query 요구가 같은 interface와 모듈에 결합된다.

### Option B — 별도 writer/query port와 SQLite adapter
- domain log model과 redaction/size policy는 공통 계층에 두고, `TrafficLogWriter`와 `TrafficLogReader` 또는 query service를 별도 port로 정의한다.
- Pro: API latency·write contract와 UI filter/detail query를 독립적으로 변경·테스트할 수 있다.
- Con: interface·mapping·SQLite adapter 코드가 늘고 transaction 경계를 명시해야 한다.

### Option C — 별도 read model/database
- API write DB와 UI read DB 또는 projection을 분리하고 동기화한다.
- Pro: 조회 부하와 schema를 독립적으로 최적화할 수 있다.
- Con: projection 동기화·일관성·migration 복잡도가 단일 프로세스 MVP에 비해 과도하다.

## Tradeoffs
| | 공통 repository | 별도 writer/query port | 별도 read model/database |
|---|---|---|---|
| API/UI 결합도 | 높음 | 낮음 | 가장 낮음 |
| 초기 구현 복잡도 | 낮음 | 중간 | 높음 |
| SQLite 단일 DB 적합성 | 높음 | 높음 | 낮음~중간 |
| query 확장성 | 중간 | 높음 | 높음 |
| consistency | 단순 | 단일 DB에서 강함 | projection 지연 가능 |
| migration 비용 | 낮음 | 중간 | 높음 |

## Recommendation
- **Option B — 별도 writer/query port와 SQLite adapter**를 권장한다. 현재 단일 SQLite를 유지하면서도 API request path와 UI query path의 책임을 분리하고, 향후 query 요구사항을 API 처리 코드와 독립적으로 확장할 수 있다.

## Consequences
- 공통 domain 계층은 traffic log model, status·metadata 타입, redaction policy, body size limit policy를 소유한다.
- API application service는 `TrafficLogWriter` port만 의존하고, UI log API/query service는 `TrafficLogReader` port만 의존한다.
- SQLite adapter가 schema·migration과 두 port의 구현을 소유한다. API와 UI는 SQLite connection/table에 직접 접근하지 않는다.
- 초기에는 동일 SQLite 파일과 프로세스 내 connection을 사용하므로 strong consistency를 유지한다.
- 별도 read database, async projection, event bus는 초기 범위에 도입하지 않는다.

## Downstream Concerns
- [x] **directly resolved — redaction·size limit 위치:** 공통 logging/domain policy에서 write 전에 적용하고 UI는 저장된 결과만 반환한다.
- [x] **directly resolved — transaction ownership:** SQLite adapter가 insert·finish update transaction을 소유하고 port 호출자에게 connection을 노출하지 않는다.
- [x] **covered — storage choice:** SQLite 선택은 기존 AC-003과 `adr/traffic-log-storage.md`에서 결정했다.
- [x] **out of scope — read replica/event projection:** 단일 프로세스·SQLite MVP 범위 밖이다.

## Related
- `spec/AC.md` — AC-012
- `adr/traffic-log-storage.md`
- `adr/sensitive-data-retention.md`
- `spec/PRD.md`

## Notes
- 2026-03-10: AC-012 검토를 위해 공통 repository, 별도 writer/query port, 별도 read model/database 옵션을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option B를 선택하고 API write·UI read port 분리와 단일 SQLite adapter를 채택했다.
