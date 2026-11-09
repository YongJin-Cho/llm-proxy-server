# 다중 API 계약과 Adapter 경계

## Concern
Responses, OpenAI Chat Completions, Claude Messages를 어떤 public route와 provider endpoint 계약으로 노출하며, 요청·응답 payload를 투명 전달할지 API별 adapter에서 변환할지 어떻게 결정할 것인가?

## Status
proposed

## Context
- 기존 프록시는 `/api/v1/responses`를 제공하고 upstream `/responses`로 요청을 전달한다.
- 이번 delta는 `/api/v1/chat/completions`와 `/api/v1/messages`를 추가한다.
- OpenAI Chat Completions와 Claude Messages는 요청 필드, 응답 구조, 오류 형식, streaming event가 서로 다르다.
- 기존 AC-011은 API별 adapter/plugin이 route·payload 변환과 provider 요청·응답 변환을 담당하고 공통 application service와 로그 writer를 분리하도록 결정했다.
- 이번 결정은 AC-011을 실제 두 API 확장에 적용하는 구체적인 경계와 변환 수준을 확정한다.

## Decision

## Options
### Option A — Transparent pass-through
- Public route별로 body를 거의 그대로 해당 provider endpoint에 전달하고 provider 응답도 거의 그대로 반환한다.
- Pro: 구현과 지연시간이 가장 작고 provider의 최신 필드를 보존하기 쉽다.
- Con: provider endpoint·header·오류·streaming 차이가 공통 proxy 흐름으로 새기 쉽고, API별 검증이 약해진다.

### Option B — Canonical internal contract
- 세 public API 요청을 하나의 내부 canonical request로 변환하고, provider 응답도 canonical response로 만든 뒤 public API별 응답으로 재변환한다.
- Pro: 공통 routing, logging, error, streaming orchestration을 통합하기 쉽다.
- Con: 각 API의 고유 필드·event·확장성을 잃거나 별도 매핑이 늘어나며, 변환 오류와 유지보수 비용이 커진다.

### Option C — Route-specific adapter with provider contract mapping
- public route마다 독립 adapter를 두고 public API 계약을 보존한다. Adapter가 route별 upstream path, request/response/error/streaming 변환을 담당하며 공통 application service는 routing context와 log writer만 제공한다.
- Pro: 클라이언트 호환성을 보존하면서 API별 차이를 adapter에 격리할 수 있다.
- Pro: 기존 Responses 흐름을 유지하고 새 API를 독립적으로 테스트·추가할 수 있다.
- Con: API마다 adapter와 계약별 테스트가 필요하고 공통 기능 일부가 중복될 수 있다.

## Tradeoffs
| | Option A — Transparent pass-through | Option B — Canonical contract | Option C — Route-specific adapter |
|---|---|---|---|
| Public client compatibility | provider 의존 | 변환 품질 의존 | API 계약을 직접 보존 |
| 구현 복잡도 | 낮음 | 높음 | 중간 |
| API 차이 격리 | 약함 | 강함 | 강함 |
| Provider 고유 필드 보존 | 높음 | 낮거나 추가 설계 필요 | 높음 |
| Streaming/error 처리 | 공통 흐름에 누수 가능 | 중앙화 가능하나 변환 복잡 | API별 명시적 처리 |
| 향후 API 추가 | 공통 코드 결합 위험 | canonical 확장 필요 | adapter/plugin 추가 |

## Recommendation
- **Option C — Route-specific adapter with provider contract mapping**을 권장한다.
- 기존 AC-011의 adapter 경계를 구체화하면서 public API 호환성을 보존하고, Chat Completions와 Messages의 서로 다른 payload·error·SSE event를 각 adapter 안에 격리할 수 있다.
- 내부 공통 모델은 routing context와 traffic log metadata 수준으로 제한하고, public request/response 전체를 하나의 canonical contract로 억지로 합치지 않는다.

## Consequences
- `/api/v1/responses`, `/api/v1/chat/completions`, `/api/v1/messages`는 독립 route/adapter로 등록한다.
- 각 adapter는 public request를 해당 provider contract로 변환하고 response/error/stream event를 public contract로 반환한다.
- 공통 application service는 API adapter가 전달한 API kind와 client model ID를 사용해 routing 및 `TrafficLogWriter` 호출을 조정한다.
- API별 정상·오류·비스트리밍·streaming 검증이 필요하다.
- 하나의 canonical public response 형식으로 세 API를 통합하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Provider endpoint 및 API capability 설정:** provider별 base URL만으로 route를 유추할지, API kind별 endpoint/capability를 설정에 명시할지 결정한다.
- [ ] **ADR candidate — API별 public error 변환:** provider 오류를 public API 원래 계약으로 변환할 범위와 pass-through 범위를 결정한다.
- [x] **covered — Adapter 등록 구조:** AC-011의 승인된 Resolution에 따라 독립 adapter/plugin으로 등록한다.
- [x] **deferred assumption — SDK 도입:** 공식 SDK 의존성 도입 여부는 이번 AC의 public contract 경계 결정 이후 구현 단계에서 필요할 때 별도 검토한다.

## Related
- `spec/AC.md` — AC-011, AC-014
- `spec/llm-proxy-server.md` — R-009

## Notes
- 2026-03-10: AC-014 검토를 위해 세 가지 public contract·adapter 경계를 비교하는 proposed ADR을 작성했다.
