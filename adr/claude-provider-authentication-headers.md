# Claude Provider 인증과 Header 설정 계약

## Concern
Claude Messages provider의 API key와 `anthropic-version` 등 API별 필수 header를 어떤 configuration schema와 secret loading 방식으로 표현하고 전달할 것인가?

## Status
approved

## Context
- 기존 provider 설정은 `baseUrl`과 `apiKeyEnv`를 사용하고, proxy가 `Authorization: Bearer ...`를 구성한다.
- Claude Messages API는 일반적으로 `x-api-key` 인증과 `anthropic-version` header를 사용한다.
- 이번 delta는 API 간 payload 변환을 하지 않는 pass-through 방향으로 결정되었지만, 인증 header는 provider contract에 맞게 구성해야 한다.
- secret은 `config.json`에 저장하지 않고 process environment에서 읽어야 하며 로그·오류·UI에 노출하면 안 된다.

## Decision
**Option A의 변형 — Bearer 기본, native Anthropic 인증은 명시적 provider 설정으로 선택.** Claude Messages payload를 지원하더라도 기본 upstream 인증은 `Authorization: Bearer <api-key>`로 구성한다. 공식 Anthropic endpoint처럼 native 인증이 필요한 provider는 설정에서 인증 모드를 선택해 `x-api-key`와 `anthropic-version`을 사용한다.

## Options
### Option A — Provider type별 내장 인증 규칙
- provider 설정에 `type` 또는 `protocol`을 두고 `openai`는 Bearer, `anthropic`은 `x-api-key`와 기본 `anthropic-version`을 proxy가 구성한다.
- Pro: 설정이 간결하고 흔한 provider 계약을 안전하게 기본 지원한다.
- Con: 새로운 인증 방식마다 코드 변경이 필요하고 provider-specific header 확장이 제한된다.

### Option B — 설정 기반 header template
- provider 설정에 인증 방식과 header 이름·값 template을 선언하고 proxy가 환경변수 secret을 치환해 header를 구성한다.
- Pro: provider별 인증·필수 header를 코드 변경 없이 확장할 수 있다.
- Con: secret template 검증과 redaction이 복잡해지고 잘못된 설정이 런타임 실패로 이어질 수 있다.

### Option C — API adapter가 인증을 직접 구성
- Claude Messages adapter가 Claude 인증 header를 직접 만들고 provider 공통 설정은 base URL·secret만 제공한다.
- Pro: API 계약과 인증 규칙이 한 곳에 모인다.
- Con: routing/provider layer와 API adapter가 강하게 결합되고 같은 provider 인증을 여러 adapter가 중복 구현할 수 있다.

## Tradeoffs
| | Option A — Provider type rules | Option B — Header template | Option C — Adapter-owned auth |
|---|---|---|---|
| 설정 복잡도 | 낮음 | 높음 | 중간 |
| provider 확장성 | 중간 | 높음 | 낮음~중간 |
| secret 안전성 검증 | 명확 | 어려움 | 명확하지만 중복 위험 |
| 인증 책임 위치 | provider layer | provider layer | API adapter |
| Claude 기본 지원 | 직접적 | 설정 필요 | 직접적 |

## Recommendation
- **Option A의 변형 — Bearer 기본, native Anthropic 인증은 명시적 provider 설정으로 선택**을 권장했으며, 사용자가 이를 선택했다.
- Claude Messages라는 payload 형식과 upstream 인증 방식은 분리한다. OpenAI 호환 gateway는 Bearer 기본으로 사용하고, 공식 Anthropic endpoint는 native 모드를 선택한다.

## Consequences
- provider 설정에 인증 모드를 표현한다. 기본 모드는 `bearer`이며, 공식 Anthropic endpoint를 위한 `anthropic` native 모드를 선택할 수 있다.
- API key 값은 기존처럼 `apiKeyEnv`가 지정한 process environment에서만 읽는다.
- `x-api-key`, `Authorization`, secret reference, API key 값은 로그와 오류에 기록하지 않는다.
- native 모드에서는 `anthropic-version`을 provider 설정으로 명시한다.

## Downstream Concerns
- [x] **directly resolved — Claude header defaults:** Bearer 기본 모드에서는 `anthropic-version`을 추가하지 않는다. native Anthropic 모드에서는 provider 설정에 `anthropic-version`을 명시하게 한다.
- [x] **directly resolved — Provider type schema:** 기존 provider 설정의 backward compatibility를 위해 인증 모드는 optional이며 기본값은 `bearer`다.
- [x] **covered — Secret source:** 기존 AC-010과 C-007에 따라 `apiKeyEnv` process environment만 사용한다.
- [x] **directly resolved — Header forwarding:** client가 보낸 인증 header를 upstream으로 전달하지 않고 proxy가 provider 설정으로 생성한다.

## Related
- `spec/AC.md` — AC-010, AC-015
- `adr/provider-routing-configuration.md`
- `spec/llm-proxy-server.md` — R-012, R-013; C-007

## Notes
- 2026-03-10: AC-015 검토를 위해 provider type 규칙, header template, adapter 소유 인증을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Bearer 기본 인증을 승인했다. native Anthropic 인증은 provider 설정으로 선택한다.
