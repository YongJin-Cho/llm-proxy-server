# API Framework와 서버 구조

## Concern
LLM Proxy Server의 API framework와 서버 모듈 구조를 어떻게 선택할 것인가?

## Status
approved

## Context
- 현재 구현은 `src/server.ts` 하나가 configuration, SQLite 초기화, 로그 기록, provider 호출, SSE 전달, route dispatch를 모두 담당한다.
- sprint-02는 API adapter, provider routing, 로그 writer, UI query 경계를 확장 가능한 구조로 분리해야 한다.
- 현재 프로젝트는 Node.js·TypeScript·ESM이며, 별도 API framework 의존성은 없다.
- 기존 동작에는 `/api/v1/responses`의 일반 응답과 SSE streaming, `/api/v1/logs` 조회가 포함된다.

## Decision
**Option B — Fastify 도입.** Fastify instance를 bootstrap에서 만들고 route plugin 단위로 API adapter와 관리 API를 등록한다. TypeScript 친화적 route schema·plugin 구조와 테스트 지원을 활용하되, 기존 SSE 전달 방식과 migration 회귀를 검증한다.

## Options
### Option A — Node HTTP 직접 유지
- Node의 `http.createServer`를 유지하고 bootstrap, router, middleware, adapter를 내부 모듈로 분리한다.
- Pro: 의존성 증가가 없고 현재 SSE·streaming 제어와의 호환성이 높다.
- Con: routing, validation, plugin lifecycle, 테스트 지원을 직접 설계·유지해야 한다.

### Option B — Fastify 도입
- Fastify instance를 bootstrap에서 만들고 route plugin 단위로 API adapter와 관리 API를 등록한다.
- Pro: TypeScript 친화적 route schema·plugin 구조, ecosystem, 테스트 지원을 활용할 수 있다.
- Con: framework lifecycle과 serialization에 의존하며 의존성·migration 비용이 증가한다.

### Option C — Hono 도입
- Hono app을 API entry point로 사용하고 route group과 middleware로 adapter를 구성한다.
- Pro: 가벼운 API abstraction과 간결한 route composition을 제공한다.
- Con: Node 전용 streaming·plugin·SQLite 통합은 별도 설계가 필요하고 현재 코드와의 migration 경로가 덜 직접적이다.

## Tradeoffs
| | Node HTTP 직접 유지 | Fastify | Hono |
|---|---|---|---|
| 의존성 비용 | 가장 낮음 | 증가 | 증가 |
| route/plugin 확장성 | 직접 구현 | 높음 | 높음 |
| TypeScript·schema·테스트 지원 | 직접 구현 | 높음 | 중간~높음 |
| SSE/streaming 제어 | 현재 동작과 직접 호환 | 가능하지만 lifecycle 검증 필요 | 가능하지만 Node 통합 검증 필요 |
| 현재 MVP migration | 가장 작음 | 중간 | 중간~큼 |
| 장기 구조화 효과 | 모듈 경계를 직접 강제해야 함 | framework 경계가 명확 | route 경계가 명확 |

## Recommendation
- **Option B — Fastify 도입**을 권장한다. 이번 범위는 단순 route 추가가 아니라 API adapter와 관리 API를 지속적으로 늘릴 구조를 정하는 것이며, plugin·schema·테스트 경계를 framework 수준에서 제공받는 편이 장기적으로 유리하다.
- 단, 실제 선택은 현재 MVP의 SSE 전달 방식과 Fastify streaming 응답 구현을 작은 migration 검증으로 확인한 뒤 확정해야 한다.

## Consequences
- Option A를 선택하면 framework 없는 내부 application/router/module 경계를 명시적으로 유지해야 한다.
- Option B를 선택하면 Fastify instance를 bootstrap으로 두고 API adapter 및 로그 API를 plugin/route module로 분리하며, SSE 응답은 framework의 raw response 또는 지원되는 streaming API를 통해 보존해야 한다.
- Option C를 선택하면 Node runtime adapter와 streaming·error handling convention을 별도로 고정해야 한다.
- 어느 옵션이든 `server.ts`는 process bootstrap만 담당하고 configuration, routes, adapters, provider, logging, persistence, UI delivery를 별도 모듈로 이동한다.

## Downstream Concerns
- [x] **directly resolved — server bootstrap 책임:** 선택한 framework의 instance 생성, configuration loading, listen/shutdown lifecycle만 bootstrap에 둔다.
- [x] **directly resolved — streaming 검증:** 기존 SSE 정상 종료·client disconnect·upstream failure 회귀 검증을 framework 선택의 migration DoD에 포함한다.
- [x] **covered — provider/model routing:** 별도 AC-010에서 결정한다.
- [x] **covered — API adapter contract:** 별도 AC-011에서 결정한다.

## Related
- `spec/AC.md` — AC-008
- `spec/PRD.md`
- `src/server.ts`

## Notes
- 2026-03-10: AC-008 검토를 위해 Node HTTP, Fastify, Hono 옵션을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option B(Fastify)를 선택하고 plugin·schema·테스트 확장성과 SSE 회귀 검증을 채택했다.
