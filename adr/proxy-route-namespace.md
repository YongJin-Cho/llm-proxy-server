# 프록시 API 라우트 네임스페이스

## Concern
프록시와 모니터링 UI·로그 API를 어떤 HTTP 경로 네임스페이스로 제공해야 하는가?

## Status
approved

## Context
- 초기 프록시 계약은 Responses API 중심이며 기존 Spec은 `/v1/responses`를 기준으로 했다.
- 애플리케이션은 프록시 API, 로그 조회 API, 정적 모니터링 UI를 단일 프로세스로 제공한다.
- 루트 경로를 UI 진입점으로 예약하고 백엔드 API를 하나의 네임스페이스로 묶을 필요가 있다.

## Decision
**Option B — `/api/v1` 네임스페이스.** 프록시는 `/api/v1/responses`, 로그 API는 `/api/v1/logs` 및 `/api/v1/logs/:id`로 제공하고 `/`는 정적 모니터링 UI 진입점으로 예약한다. 클라이언트는 `/api`를 포함한 Base URL을 사용해야 한다.

## Options
### Option A — `/v1` 직접 제공
- 프록시를 `/v1/responses`, 로그 API를 별도 경로로 제공한다.
- Pro: OpenAI 호환 클라이언트의 일반적인 `/v1` 기대와 직접 일치한다.
- Con: 프록시와 관리 API의 네임스페이스가 분리되고 루트 UI와의 경계가 덜 명확하다.

### Option B — `/api/v1` 네임스페이스
- 모든 백엔드 API를 `/api/v1` 아래에 둔다.
- Pro: UI(`/`)와 API를 명확히 분리하고 프록시·로그 API 경로를 일관되게 관리한다.
- Con: OpenAI 클라이언트 Base URL에 `/api`를 포함해야 하므로 기본 `/v1` 설정과는 직접 호환되지 않는다.

## Tradeoffs
| | Option A — `/v1` | Option B — `/api/v1` |
|---|---|---|
| 기존 OpenAI Base URL 기대와의 일치 | 높음 | `/api` 추가 필요 |
| UI/API 경계 | 별도 규칙 필요 | 명확함 |
| API 확장성 | 관리 API별 규칙 필요 | 일관된 네임스페이스 |
| 현재 단일 프로세스 구조 | 가능 | UI와 백엔드 분리에 적합 |

## Recommendation
- UI를 같은 서버에서 제공하고 향후 관리 API를 확장할 계획이므로 Option B를 권장한다.

## Consequences
- 프록시 엔드포인트는 `/api/v1/responses`가 된다.
- 로그 목록·상세 API는 `/api/v1/logs`, `/api/v1/logs/:id`를 사용한다.
- `/`는 정적 모니터링 UI 진입점으로 예약한다.
- OpenAI Responses 클라이언트의 Base URL 설정에는 `/api`가 포함되어야 한다.
- `/v1/responses` 별칭은 제공하지 않는다.

## Downstream Concerns
- [x] **directly resolved — UI/API 경로 분리:** `/`는 UI, `/api/v1/*`는 백엔드 API로 사용한다.
- [x] **covered — API 버전 관리:** 모든 초기 백엔드 API는 `/api/v1` 아래에 둔다.
- [x] **out of scope — `/v1` 호환 별칭:** 초기 범위에서는 중복 라우트를 제공하지 않는다.

## Related
- `adr/proxy-api-compatibility.md`
- `spec/llm-proxy-server.md`
- `spec-review/llm-proxy-server.md`

## Notes
- 2026-03-10: 라우트 네임스페이스 선택을 위해 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option B를 선택하고 `/api/v1/*` 네임스페이스를 채택했다.
