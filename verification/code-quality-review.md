# 구현 코드 품질 및 설계 검토

**검토 대상:** 현재 `src/` 구현 전체
**검토일:** 2026-03-10
**검토 범위:** 중복/반복 코드, API 유형 의존성 누수, adapter 경계, 기능·역할별 분할, 의존성 방향, 테스트 가능성
**검증 명령:** `npm run build`, `npm run verify`
**검증 결과:** 두 명령 모두 통과. Vite의 Monaco 대형 chunk 경고만 있었으며 컴파일 오류는 없었다.

## 1. 총평

현재 구조는 **기능적으로는 안정적이고, 주요 application/persistence/UI 경계도 의도대로 분리되어 있다.** 특히 API별 proxy adapter와 turn-analysis adapter를 별도 디렉터리로 둔 점, route handler가 SQLite를 직접 사용하지 않는 점, UI component가 API를 직접 호출하지 않는 점은 좋다.

다만 `adapter pattern을 사용했으므로 API 의존성이 완전히 격리되었다`고 평가하기는 어렵다. 다음 세 지점에서 API 유형 지식이 adapter 바깥으로 새어 나온다.

1. `ProxyAdapter.aggregateResponse()`가 공통 base에서 Responses/Chat Completions/Messages의 payload shape를 직접 추측한다.
2. `SqliteTrafficLogStore`가 persistence 계층에서 `apiKind`별 request/response summary 추출을 수행한다.
3. 새로운 API 추가 시 proxy adapter, turn-analysis adapter, route union, domain enum, persistence summary 분기까지 여러 중앙 지점을 동시에 수정해야 한다.

따라서 현재 평가는 다음과 같다.

- **기능적 품질:** 양호 — build/통합 검증 통과
- **역할 분리:** 양호하나 persistence와 domain에 presentation/projection 책임이 일부 집중
- **API 독립성:** 보통 — 핵심 proxy 흐름은 잘 격리됐지만 공통 base와 persistence에 누수 존재
- **중복:** 중간 — 의미 있는 중복이 adapter 세트와 분석 adapter 세트에 반복
- **확장성:** 보통 — 세 API에는 충분하지만 네 번째 API 추가부터 변경 지점이 빠르게 늘어남

이번 검토에서 즉시 동작 결함으로 단정할 문제는 발견하지 못했다. 아래 P1 항목은 현재 테스트를 깨뜨리는 결함이라기보다, API 추가·변경 시 잘못된 공통화 또는 누수로 발전할 위험이 큰 설계 문제다.

## 2. 잘된 점

### 2.1 Proxy application flow와 API별 semantic 처리의 분리

- `src/application/proxy-service.ts:34-38`에서 API adapter를 map으로 등록하고, 공통 흐름은 `apiPath`, `apiKind`, `turnSemantic`, `aggregateResponse`, `usageMetadata` 계약을 사용한다.
- `src/application/proxy-adapters/` 아래에 Responses, Chat Completions, Messages 구현이 각각 존재한다.
- `src/application/turn-analysis-adapters/`도 API별 분석을 별도 adapter로 분리한다.
- `src/application/turn-analysis-service.ts:25-46`는 API별 분석을 adapter 선택 후 실행하며 SQLite 세부 구현을 알지 못한다.

이는 API별 payload 해석을 `ProxyService`에 직접 넣는 것보다 훨씬 유지보수하기 좋은 방향이다.

### 2.2 외부 경계와 내부 port의 분리

- `src/api/routes.ts`는 application service를 호출하고 SQL/SQLite import를 하지 않는다.
- `src/domain/traffic-log.ts`의 writer/reader/manager port를 통해 application 계층과 persistence 구현을 연결한다.
- `src/ui/data-query/log-api.ts`가 브라우저 HTTP 호출과 오류 매핑을 담당한다.
- `src/ui/components/`는 API를 직접 호출하지 않고 props 기반으로 렌더링한다.
- `src/ui/pages/TrafficPage.tsx`가 페이지 상태·선택·새로고침·use-case 조합을 담당하고, `TurnView`, `TrafficView`, `TurnTree`가 표현을 담당한다.

AGENTS.md에 정의된 주요 구조와 실제 구현은 대체로 일치한다.

### 2.3 보안·운영 관련 공통 책임의 위치

- secret resolution은 `src/configuration.ts`에 집중되어 있다.
- masking과 bounded error 처리는 `src/domain/policy.ts` 및 `ProxyService` 흐름에서 수행된다.
- SQLite 저장은 `src/persistence/sqlite-traffic-log.ts`에 집중되어 있다.
- `npm run verify`가 세 API route, routing, usage/cost, persistence, turn, note, viewer까지 회귀 검증한다.

## 3. 주요 발견 사항

### P1 — 공통 `ProxyAdapter`가 API payload shape에 의존함

**위치:** `src/application/proxy-adapters/proxy-adapter.ts:14-25`

`aggregateResponse()`가 공통 base에 있으면서 다음 API별 형태를 검사한다.

- `parsed.response`
- `parsed.message`
- `parsed.choices`
- `parsed.output`
- `parsed.content`
- `parsed.usage`

이 코드는 “공통 stream envelope의 파싱”이 아니라 “각 API 응답의 의미 있는 payload를 추측하는 규칙”이다. 즉 adapter에 격리되어야 할 schema 지식이 공통 base로 올라가 있다.

**위험:**

- 새 API가 추가될 때 base 조건문을 수정하게 된다.
- 기존 API의 field 이름이 바뀌면 어떤 adapter가 영향을 받는지 불명확하다.
- 특정 API가 우연히 `message`나 `content`라는 field를 사용하면 잘못된 aggregate가 선택될 수 있다.
- 공통 base가 여러 API의 최소공통분모가 아니라 느슨한 schema dispatcher가 된다.

**권고:**

`ProxyAdapter`에는 `parseSseDataLines()` 같은 transport-level helper만 두고, 최종 aggregate 선택과 JSON 생성은 각 concrete adapter가 소유하는 편이 안전하다. 비-stream 응답의 pass-through도 concrete adapter의 명시적 기본 동작으로 두면 책임이 분명해진다.

### P1 — persistence 계층이 API별 summary 해석을 수행함

**위치:** `src/persistence/sqlite-traffic-log.ts:31-65`

`extractUserInput()`과 `extractAiOutput()`가 persistence 파일 안에서 `apiKind === 'responses'`, `'chat_completions'`, `'messages'`를 직접 분기한다.

이 로직은 SQL 저장 자체가 아니라 “API payload를 사용자에게 보여줄 turn summary로 해석하는 projection”이다. 따라서 adapter 또는 별도의 domain/application projection port가 소유하는 편이 더 적절하다.

**현재 문제:**

- SQLite adapter가 새 API의 request/response schema를 알아야 한다.
- API-specific knowledge가 proxy adapter와 turn-analysis adapter뿐 아니라 persistence에도 중복된다.
- API adapter를 추가해도 `SqliteTrafficLogStore`를 수정해야 하므로 adapter의 독립성이 제한된다.
- 저장소를 SQLite에서 다른 구현으로 교체할 때 summary 해석 규칙까지 다시 옮겨야 한다.

**권고 방향:**

다음 중 하나를 명시적으로 선택하는 것이 좋다.

1. 각 `ProxyAdapter`가 `summaryProjection` 또는 `extractTurnSummary` 계약을 제공하고, application service가 저장 시점에 canonical summary를 만든다.
2. `TurnSummaryProjector` port를 application/domain에 만들고 API별 projector를 adapter registry로 등록한다. SQLite는 이미 계산된 summary 또는 API-neutral projection만 저장/조회한다.

현재 범위에서는 2번이 persistence의 SQL 책임을 가장 작게 유지한다.

### P1 — API 추가 시 변경 지점이 여러 중앙 목록으로 확산됨

다음 위치에 API 종류가 반복해서 정의되거나 등록된다.

- `src/application/proxy-adapters/proxy-adapter.ts:6` — `ProxyApiPath` union
- `src/domain/traffic-log.ts:5` — `TrafficLogApiKind` union
- `src/api/routes.ts:6-10` — route 목록
- `src/application/proxy-service.ts:34-38` — proxy adapter registry
- `src/application/turn-analysis-service.ts:10-13` — analysis adapter registry
- `src/persistence/sqlite-traffic-log.ts:31-65` — summary extraction 분기
- 각 API adapter의 SSE parser/usage parser

세 API까지는 읽기 쉽지만, 네 번째 API부터는 “adapter 파일 하나 추가”가 아니라 여러 중앙 지점을 동기화해야 한다. 이 구조는 현재 구현이 잘못되었다는 의미는 아니지만, adapter pattern의 확장 목표를 충분히 달성하지 못한다.

**권고:**

등록 정보를 하나의 composition root 또는 API contract registry로 모으고, route registration·proxy registry·analysis registry가 같은 등록 목록을 사용하도록 개선한다. 단, `TrafficLogApiKind`를 무조건 문자열 동적화하면 타입 안정성이 약해지므로, registry에서 literal type을 유지하는 방향이 바람직하다.

### P2 — proxy adapter 간 보조 코드가 반복됨

#### SSE event parsing

다음 세 파일에 거의 동일한 `parseSseEvents()`가 있다.

- `src/application/proxy-adapters/responses-adapter.ts:105-119`
- `src/application/proxy-adapters/chat-completions-adapter.ts:91-105`
- `src/application/proxy-adapters/messages-adapter.ts:102-116`

각 adapter의 event payload 해석은 달라야 하지만, `data:` line 추출·`[DONE]` 제외·JSON parse 실패 무시는 transport helper로 공통화할 수 있다.

#### 공통 utility

`stringValues()`와 `emptyUsage()`가 세 adapter에 각각 복제되어 있다.

- `responses-adapter.ts:132-133`
- `chat-completions-adapter.ts:123-126`
- `messages-adapter.ts:124-126`

**권고:**

`proxy-adapters/shared.ts`에 `parseSseJsonEvents`, `stringValues`, `emptyUsage`를 두되, usage field mapping과 aggregate algorithm은 각 adapter에 남겨야 한다. 공통화의 기준은 “API 의미”가 아니라 “transport/타입 안전 보조 동작”이어야 한다.

### P2 — turn analysis adapter의 반복과 domain/presentation 혼합

세 분석 adapter는 모두 다음 흐름을 반복한다.

1. traffic request를 순회한다.
2. API별 tool result를 `Map`에 저장한다.
3. 다시 traffic을 순회한다.
4. tool call과 result를 연결한다.
5. `resultFromInteractions()`를 호출한다.

반복은 API schema가 다르기 때문에 일부 불가피하지만, 결과 연결과 오류 상태 생성은 공통 helper로 더 줄일 수 있다.

또한 `src/domain/turn-notes.ts:44-92`의 `renderToolNotes()`는 Markdown table 문자열과 표시용 제목(`도구 사용 이력`)을 직접 생성한다. 이는 domain의 semantic model과 UI presentation format이 결합된 상태다.

**위험:**

- Markdown 표현을 바꾸려면 domain 분석 코드를 수정해야 한다.
- 다른 소비자(JSON, UI table, export)가 생기면 동일 분석 결과를 재사용하기 어렵다.
- API adapter는 독립되어도 note presentation contract가 domain에 고정된다.

**권고:**

분석 결과를 `ToolInteraction[]` 또는 API-neutral note model로 먼저 반환하고, Markdown renderer는 별도 application/presentation 모듈로 분리한다. 다만 현재 기능 범위가 Markdown note 하나뿐이라서 P1보다 우선순위는 낮다.

### P2 — 의존성 주입 경계가 실제 구현보다 넓음

**위치:** `src/application/proxy-service.ts:34-38`, `src/server.ts:15`

`ProxyService` 생성자는 `TrafficLogWriter & TurnStore & TurnAnalysisPersistence`를 요구한다. 타입상 port를 사용하고 있지만 실제로는 하나의 객체가 네 가지 책임을 모두 구현해야 한다. `server.ts`도 `new SqliteTrafficLogStore()` 하나를 직접 주입한다.

**영향:**

- ProxyService 단위 테스트에서 writer, turn store, analysis persistence를 각각 독립 mock하기 어렵다.
- persistence 책임의 결합이 타입 수준에서 고정된다.
- 향후 저장소를 분리하거나 비동기 queue를 도입할 때 생성자 계약 변경 폭이 커진다.

**권고:**

현재 실행 구조를 유지하더라도 생성자 인자를 다음처럼 명시적으로 분리할 수 있다.

```ts
constructor(
  private readonly config: AppConfig,
  private readonly writer: TrafficLogWriter,
  private readonly turns: TurnGroupingService,
  private readonly analysis: TurnAnalysisService,
) {}
```

또는 composition root에서 `ProxyDependencies` 객체를 만들어 각 port를 명시적으로 연결한다. 이것은 동작 변경 없이 테스트 가능성과 책임 가시성을 높이는 개선이다.

### P3 — route handler의 입력 검증과 반복

**위치:** `src/api/routes.ts:13-38`

route handler가 `request.params`와 `request.body`를 타입 assertion으로 바로 변환한다. Fastify schema validation이 없으므로 잘못된 metadata payload가 application service까지 들어갈 수 있다. 또한 URL parsing, page/limit/filter 정규화가 여러 route에 반복된다.

현재 검증 범위에서는 문제가 발견되지 않았고, localhost 도구라는 제품 범위도 고려해야 한다. 다만 public API가 확대되면 다음을 권고한다.

- Fastify route schema로 params/query/body를 검증한다.
- `parseTurnPageQuery()`와 `parseLogQuery()` 같은 route input adapter를 만든다.
- application service에는 이미 정제된 타입만 전달한다.

## 4. 중복/반복 코드 목록

| 위치 | 반복 내용 | 평가 | 권고 |
|---|---|---|---|
| 세 proxy adapter | SSE `data:` line 파싱 | 의미 없는 transport 중복 | shared helper로 공통화 |
| 세 proxy adapter | `stringValues()` | 완전 동일 | shared helper |
| 세 proxy adapter | `emptyUsage()` | 완전 동일 | 상수/함수 공유 |
| 세 proxy adapter | `usageMetadata()`의 try/catch와 aggregate 후 usage 추출 | 외형은 동일하나 field mapping은 API-specific | 공통 `parseAggregatedUsage()` 골격 또는 유지; 과도한 추상화는 피함 |
| 세 turn-analysis adapter | result map 생성·traffic 2회 순회·interaction 연결 | 구조는 동일, schema만 상이 | 공통 correlation helper 검토 |
| routes | URL/query 숫자·filter 정규화 | route 경계 반복 | query adapter 함수 |
| API 종류 등록 | union/route/registry/persistence 분산 | 확장성 중복 | composition registry |
| UI formatting | `TurnView`의 숫자/cost formatting | 현재 파일 내 일관적 | UI formatter 모듈화는 선택 사항 |

**주의:** 모든 반복을 제거하는 것이 목표는 아니다. API별 aggregate와 semantic extraction은 차이를 드러내는 것이 오히려 안전하다. 공통화 대상은 동일한 transport 처리·오류 처리·자료구조 연결처럼 의미가 동일한 부분으로 한정해야 한다.

## 5. 기능/역할 분할 평가

### 양호

- bootstrap: `server.ts`
- configuration: `configuration.ts`
- common proxy orchestration: `proxy-service.ts`
- API-specific proxy behavior: `proxy-adapters/`
- turn lifecycle: `domain/turn.ts`
- query use case: `log-query-service.ts`
- HTTP boundary: `api/routes.ts`
- persistence adapter: `sqlite-traffic-log.ts`
- UI data access: `ui/data-query/`
- page orchestration: `ui/pages/TrafficPage.tsx`
- presentation: `ui/components/`

### 경계가 흐려지는 부분

1. `sqlite-traffic-log.ts`가 schema/CRUD뿐 아니라 API-specific semantic summary projection과 note projection까지 수행한다.
2. `turn-notes.ts`가 domain interaction 결과와 Markdown 표시 형식을 함께 가진다.
3. `proxy-adapter.ts`가 API-specific response shape fallback을 가진다.
4. `ProxyService`가 adapter 생성·registry 관리·provider auth header 생성·HTTP I/O·stream lifecycle·turn completion·analysis enqueue까지 수행한다.

`ProxyService`는 현재 공통 흐름의 핵심이라 어느 정도의 조정 책임은 자연스럽다. 다만 provider request construction과 stream lifecycle이 더 커지면 `ProviderClient` 또는 `StreamProxy` port로 분리할 시점이다. 현재는 즉시 분리할 필요가 있는 수준은 아니다.

## 6. 권장 개선 순서

### 1단계 — API 의존성 누수 제거

1. `ProxyAdapter` base에서 payload shape를 검사하는 `aggregateResponse()`를 제거하거나 transport-only fallback으로 축소한다.
2. `SqliteTrafficLogStore`의 `extractUserInput`/`extractAiOutput`를 API별 projector로 이동한다.
3. 각 API adapter가 담당하는 계약을 `aggregate`, `usage`, `semantic`, `summary projection`으로 문서화한다.

### 2단계 — 안전한 중복 제거

1. SSE event parser, `stringValues`, `emptyUsage`를 shared helper로 이동한다.
2. 분석 adapter의 result correlation 공통 로직을 helper로 추출한다.
3. API별 aggregate 알고리즘 자체는 각 adapter에 유지한다.

### 3단계 — composition과 테스트 가능성 개선

1. adapter registry를 composition root에서 조립한다.
2. `ProxyService` 생성자에서 writer/turn/analysis port를 명시적으로 분리한다.
3. route query/body normalization을 별도 HTTP input adapter로 추출한다.
4. API 추가 시 수정해야 하는 파일 수를 검증하는 contract test 또는 registry completeness test를 추가한다.

### 4단계 — note/presentation 책임 정리

1. `ToolInteraction[]` 기반 API-neutral 분석 결과를 먼저 만든다.
2. Markdown renderer를 별도 모듈로 이동한다.
3. UI가 필요한 경우 Markdown뿐 아니라 구조화된 note data도 제공할 수 있게 한다.

## 7. 검토 결론

현재 구현은 **동작 가능한 양호한 구조**이며, 단순히 “adapter를 사용하지 않았다”고 평가할 수준은 아니다. 핵심 proxy orchestration에서 API payload 해석을 상당 부분 adapter로 이동한 것은 올바른 방향이다.

그러나 adapter 경계를 엄격히 적용하려면 다음 두 가지는 수정 가치가 높다.

- `ProxyAdapter` 공통 base의 API shape 추측 제거
- SQLite persistence의 API별 summary 해석 제거

이 두 항목을 그대로 두면 API별 코드가 늘어날수록 공통 계층이 다시 API 유형 switch 문으로 변하고, 새 API 추가 비용이 증가한다. 반대로 SSE parser와 작은 utility 중복은 기능적 위험이 낮으므로 1단계 이후 안전하게 정리하면 된다.

**최종 판정:**

- 기능 회귀: **문제 없음** — `npm run build`, `npm run verify` 통과
- 중복: **중간 수준** — 일부는 안전하게 공통화 가능
- API 유형 독립성: **부분 충족** — proxy adapter 내부는 양호하나 base/persistence 누수 존재
- 역할 분할: **대체로 양호** — projection/presentation 책임이 일부 과집중
- 개선 우선순위: **P1 두 항목(API shape 누수, persistence API 분기)부터 처리 권장**
