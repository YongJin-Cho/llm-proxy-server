# 프록시 API 계약과 호환 범위

## Concern
LLM Proxy Server가 어떤 OpenAI 호환 API 계약과 클라이언트 호환 범위를 제공해야 하는가?

## Status
approved

## Context
- 제품은 Codex와 유사한 클라이언트와 OpenAI Model Provider 사이에서 요청과 응답을 중계해야 한다.
- API 범위를 넓히면 호환성은 좋아지지만 구현·검증·로그 모델의 복잡도가 증가한다.
- API 계약은 스트리밍, 오류 형식, 저장 데이터 모델의 기반이 된다.

## Decision
**Option A — Responses API 중심의 최소 OpenAI 호환 계약.** 초기 deliverable은 `/v1/responses` 계약을 기준으로 구현하고, Chat Completions와 Claude Messages API는 호환 계층을 추가하는 후속 범위로 남긴다.

## Options
### Option A — Responses API 중심의 최소 OpenAI 호환 계약
- `/v1/responses`를 기준으로 요청·응답·오류 형식을 지원하고, 현재 필요한 모델 파라미터만 명시한다.
- Pro: 최신 클라이언트 흐름과 계약을 한 곳에 집중해 구현·검증이 단순하다.
- Pro: 스트리밍과 응답 이벤트 모델을 일관되게 설계하기 쉽다.
- Con: Chat Completions만 지원하는 기존 클라이언트와의 호환성이 제한될 수 있다.

### Option B — Responses API와 Chat Completions를 함께 지원
- `/v1/responses`와 `/v1/chat/completions`를 모두 제공하고 각각의 요청·응답·오류 계약을 보존한다.
- Pro: 더 넓은 OpenAI 호환 클라이언트 생태계를 수용할 수 있다.
- Pro: 기존 클라이언트를 전환하지 않고 프록시에 연결할 수 있다.
- Con: 두 계약의 스트리밍·오류·로그 정규화와 테스트 범위가 커진다.
- Con: 초기 제품에서 지원 범위가 불명확해질 위험이 있다.

## Tradeoffs
| | Option A — Responses 중심 | Option B — 두 API 지원 |
|---|---|---|
| 초기 구현 복잡도 | 낮음 | 높음 |
| 클라이언트 호환 폭 | 최신 계약 중심 | 넓음 |
| 스트리밍 설계 | 단일 이벤트 모델 | 계약별 처리 필요 |
| 테스트·유지보수 | 단순 | 더 많은 조합 필요 |
| 확장 경로 | 이후 Chat Completions 추가 가능 | 초기부터 넓은 기반 |

## Recommendation
- 초기 deliverable의 위험을 낮추려면 Option A를 권장한다.
- 사용 중인 클라이언트가 Chat Completions를 반드시 요구한다면 Option B가 더 적합하다.

## Consequences
- 승인된 옵션의 엔드포인트, 필드, 오류, 헤더 전달 규칙을 Spec에 구체화해야 한다.
- 지원하지 않는 API는 명확한 오류로 거절해야 한다.
- 선택하지 않은 계약은 이번 범위에서 구현하지 않는다.

## Downstream Concerns
- [x] **deferred assumption — API 확장:** Chat Completions와 Claude Messages API는 후속 요구사항으로 처리하며 현재 Spec·구현 범위에 포함하지 않는다.
- [x] **directly resolved — API 버전 및 모델 파라미터 범위:** 초기 Spec에서 Responses API의 필수 필드와 현재 클라이언트 사용에 필요한 모델 옵션만 명시하고, 미지원 필드는 명확한 오류로 반환한다. 구체 필드 목록은 Spec 작성 시 확정한다.
- [ ] **ADR candidate — 스트리밍 계약:** 승인된 API의 스트리밍 이벤트 전달 및 완료 처리 방식을 결정한다.

## Related
- `spec/AC.md` — AC-001

## Notes
- 2026-03-10: AC-001의 API 호환 범위 결정을 위해 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option A를 선택하고 Chat Completions·Claude Messages API 확장을 후속 범위로 defer했다.
