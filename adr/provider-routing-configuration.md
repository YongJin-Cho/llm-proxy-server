# Provider 설정과 Model Routing 계약

## Concern
복수 LLM provider의 설정과 client model ID routing 계약을 어떻게 정의할 것인가?

## Status
approved

## Context
- 현재 MVP는 단일 `PROVIDER_URL`과 `PROVIDER_API_KEY` 환경변수로 provider를 설정한다.
- sprint-02는 여러 provider와 provider별 model ID를 지원하되, 클라이언트는 안정적인 client model ID를 사용할 수 있게 해야 한다.
- 예시 매핑은 `gpt-6-luna → openrouter.ai/api/v1 + openai/gpt-6-luna`와 같다.
- API key는 로그·UI·오류 응답에 노출되어서는 안 되며, 단일 프로세스 로컬 실행을 유지한다.

## Decision
**Option B — 설정 파일 + 환경변수 secret override.** `providers`와 `models` 섹션으로 provider URL 및 client model ID → `{ provider, providerModel }` 매핑을 표현하고, API key는 설정 파일에 저장하지 않고 환경변수 참조로 로드한다. 시작 시 설정을 검증하고 미등록 model은 4xx 오류로 거부하며 secret은 오류·로그·UI에 노출하지 않는다.

## Options
### Option A — 환경변수 평면 규칙
- `PROVIDER_<NAME>_URL`, `PROVIDER_<NAME>_API_KEY`, `MODEL_<CLIENT>_PROVIDER`, `MODEL_<CLIENT>_NAME`과 같은 환경변수 규칙을 사용한다.
- Pro: 기존 실행 방식과 배포 환경변수에 직접 맞고 별도 설정 파일이 필요 없다.
- Con: 중첩 routing·provider별 옵션이 많아질수록 이름 규칙과 validation이 복잡해진다.

### Option B — 설정 파일 + 환경변수 secret override
- JSON/YAML 설정 파일에 provider URL과 model mapping을 정의하고 API key는 `${ENV_VAR}` 참조 또는 지정된 환경변수에서 로드한다.
- Pro: routing 관계가 한눈에 보이고 확장·검증·문서화가 쉽다.
- Con: 설정 파일 경로·포맷·secret reference 규칙과 파일 오류 처리가 필요하다.

### Option C — 외부 secret/config 서비스
- provider 설정과 secret을 Vault·cloud secret manager·별도 configuration service에서 로드한다.
- Pro: 운영 환경의 secret rotation·중앙 관리를 강화할 수 있다.
- Con: 로컬 단일 프로세스 실행과 검증을 어렵게 하고 외부 인프라 의존성이 생긴다.

## Tradeoffs
| | 환경변수 평면 규칙 | 설정 파일 + secret override | 외부 secret/config 서비스 |
|---|---|---|---|
| 로컬 실행성 | 높음 | 높음 | 낮음 |
| routing 가독성 | 낮음~중간 | 높음 | 중간 |
| schema validation | 직접 구현 | 파일 schema로 명확 | 서비스 계약 필요 |
| secret 노출 위험 | 환경·오류 처리에 의존 | key를 파일 밖에 둘 수 있음 | 중앙 정책 활용 가능 |
| provider/model 확장 | 이름 규칙 복잡도 증가 | 구조적 확장 용이 | 운영 인프라 필요 |
| 현재 MVP migration | 중간 | 중간 | 큼 |

## Recommendation
- **Option B — 설정 파일 + 환경변수 secret override**를 권장한다. provider와 model routing의 구조를 명시적으로 표현하면서도 API key를 설정 파일에 저장하지 않고 기존 환경변수 실행을 보존할 수 있다.

## Consequences
- 설정은 `providers`와 `models` 또는 동등한 명시적 섹션으로 구성하고, model entry는 `provider`와 `providerModel`을 가진다.
- provider API key는 설정 파일에 평문으로 요구하지 않고 환경변수 참조 또는 process environment에서 로드한다.
- 시작 시 provider URL·model mapping·필수 secret reference를 검증하고, 미등록 client model은 요청 시 명확한 4xx 오류로 거부한다.
- 잘못된 설정은 서버 startup validation 오류로 처리하며 key 값은 오류·로그·UI에 표시하지 않는다.
- 외부 secret/config service는 초기 범위에서 도입하지 않는다.

## Downstream Concerns
- [x] **directly resolved — 미등록 model 오류:** provider 호출 전 400 계열의 명시적 configuration/model error를 반환하고 로그에는 secret을 남기지 않는다.
- [x] **directly resolved — 잘못된 startup 설정:** 서버가 listen하기 전에 validation error를 출력하고 종료한다.
- [x] **covered — 로그 redaction:** AC-004의 redaction 정책을 provider key와 routing error에도 적용한다.
- [x] **out of scope — secret rotation:** 실행 중 자동 rotation과 외부 secret manager는 초기 범위 밖이다.

## Related
- `spec/AC.md` — AC-010
- `adr/sensitive-data-retention.md`
- `spec/PRD.md`

## Notes
- 2026-03-10: AC-010 검토를 위해 환경변수 평면 규칙, 설정 파일+환경변수 secret override, 외부 secret/config 서비스 옵션을 비교하는 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option B를 선택하고 구조화된 routing 설정과 환경변수 secret loading을 채택했다.
