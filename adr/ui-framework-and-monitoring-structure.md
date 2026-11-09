# UI Framework와 모니터링 구조

## Concern
모니터링 UI의 framework와 page·component·data-query 구조를 어떻게 선택할 것인가?

## Status
approved

## Context
- 현재 UI는 아직 정식 component framework 기반으로 확정되지 않았으며, 기존 MVP는 단일 프로세스에서 정적 UI를 제공하는 범위를 가진다.
- sprint-02는 로그 목록·상세·content viewer를 구현할 기반과 향후 분석·report·chart feature의 확장 지점을 정해야 한다.
- API framework는 Fastify로 결정되었고, UI는 같은 서버 프로세스에서 제공된다.
- UI는 SQLite 로그 조회 API와 결합하되, DB에 직접 접근하지 않는 query/data 경계를 가져야 한다.

## Decision
**Option B — React 도입.** React와 명시적 page/component/data-query 모듈을 사용해 로그 목록·상세·content viewer를 구성하고, 향후 분석·report·chart를 독립 feature로 확장한다. UI는 로그 API를 통해서만 조회하며 Fastify static delivery와 frontend build output을 연결한다.

## Options
### Option A — 정적 HTML·Vanilla TypeScript 유지
- 페이지 템플릿과 모듈화된 TypeScript query/render 코드를 사용한다.
- Pro: 번들·운영 복잡도와 migration 비용이 가장 낮다.
- Con: component 상태·화면 조합·향후 chart/report feature의 공통 구조를 직접 설계해야 한다.

### Option B — React 도입
- React와 명시적 page/component/data-query 모듈을 사용한다.
- Pro: component 생태계, 상태·화면 조합, chart/report 확장과 테스트 도구가 풍부하다.
- Con: 번들·빌드 도구·의존성 및 기존 정적 UI migration 비용이 증가한다.

### Option C — Vue 또는 Svelte 도입
- Vue/Svelte의 component framework와 해당 생태계를 사용한다.
- Pro: React보다 가벼운 구성 또는 간결한 component 문법을 선택할 수 있다.
- Con: 팀·프로젝트의 기존 convention이 없으면 framework 선택 비용이 남고, chart/report 생태계와 build 통합을 별도 검증해야 한다.

## Tradeoffs
| | 정적 HTML·Vanilla TS | React | Vue/Svelte |
|---|---|---|---|
| 초기 번들·운영 복잡도 | 가장 낮음 | 높음 | 중간 |
| page/component 구조 | 직접 설계 | 풍부한 convention | framework convention |
| log content 상세 표시 | 직접 구현 | component로 구조화 | component로 구조화 |
| 분석·report·chart 확장 | 직접 통합 | 생태계 선택 폭 큼 | 생태계 선택 가능 |
| migration 비용 | 가장 낮음 | 높음 | 중간~높음 |
| 장기 유지보수 | 작은 화면에는 단순 | 명확한 component 경계 | 명확하지만 선택 convention 필요 |

## Recommendation
- **Option B — React 도입**을 권장한다. 이번 범위의 핵심은 단순 정적 화면보다 log content 상세와 향후 분석·report·chart를 독립 feature로 확장할 수 있는 page/component/data-query 구조를 고정하는 것이다.
- 단, 정적 HTML을 유지하면 배포 복잡도와 migration 위험을 최소화할 수 있으므로, UI가 당분간 목록·상세를 넘지 않는다는 우선순위라면 Option A가 더 적합하다.

## Consequences
- Option A를 선택하면 feature/module·query·render 경계를 내부 convention으로 문서화하고 chart/report 통합을 직접 관리해야 한다.
- Option B를 선택하면 frontend build output을 Fastify static delivery에 연결하고 React page/component/data-query 모듈을 분리한다.
- Option C를 선택하면 선택한 framework와 build/static delivery 통합을 별도로 고정한다.
- 모든 옵션에서 UI는 로그 API를 통해서만 조회하고 SQLite에 직접 접근하지 않는다.

## Downstream Concerns
- [x] **directly resolved — UI DB 접근:** UI는 API/query client를 통해서만 로그를 조회하며 DB driver를 bundle하지 않는다.
- [x] **covered — API server framework:** Fastify 선택은 `adr/api-framework-and-server-structure.md`에 기록했다.
- [x] **out of scope — chart library selection:** 실제 chart feature 구현 시 별도 결정한다.

## Related
- `spec/AC.md` — AC-009
- `adr/api-framework-and-server-structure.md`
- `spec/PRD.md`

## Notes
- 2026-03-10: AC-009 검토를 위해 정적 HTML·Vanilla TypeScript, React, Vue/Svelte 옵션을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option B(React)를 선택하고 page/component/data-query 구조와 API 경유 조회를 채택했다.
