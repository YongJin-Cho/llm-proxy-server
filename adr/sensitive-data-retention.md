# 민감정보 보호와 로그 보존

## Concern
프록시 트래픽 로그에서 민감정보를 어떻게 보호하고 얼마 동안 보존해야 하는가?

## Status
approved

## Context
- Authorization 헤더와 API 키는 로그에 평문으로 저장되면 안 된다.
- 요청·응답 본문에는 사용자 프롬프트, 모델 출력, 개인정보가 포함될 수 있다.
- 운영자는 디버깅을 위해 트래픽 내용을 확인해야 하므로 모든 본문을 무조건 버리면 목적을 달성하기 어렵다.
- 초기 deliverable에는 완성형 보존 정책이나 외부 비밀관리 시스템을 포함하지 않는다.

## Decision
**헤더 마스킹과 request 수신 한도·request/response 전체 보존.** 알려진 인증·비밀 헤더를 저장 전에 마스킹하고, `maxBodyBytes`는 들어오는 request body 수신 한도로 적용한다. request/response JSON은 저장 단계에서 잘라내지 않고 전체 보존한다. 오류 문자열만 별도 제한한다.

## Options
### Option A — 헤더 마스킹과 본문 제한·기본 보존
- Authorization, API 키, 쿠키 등 알려진 비밀 헤더를 저장 전에 마스킹한다.
- `maxBodyBytes`를 request 수신 한도로 적용하고 저장 request/response JSON은 전체 보존한다. 오류 문자열만 별도 제한한다.
- Pro: 디버깅 가치와 기본 보안을 균형 있게 유지한다.
- Con: 본문에 포함된 비정형 비밀이나 개인정보를 완전히 식별하지 못할 수 있다.

### Option B — 메타데이터만 저장하고 본문은 저장하지 않음
- 상태, 모델, 지연시간, 토큰 사용량 등 메타데이터만 보존한다.
- Pro: 민감정보 노출과 저장 비용이 가장 낮다.
- Con: 요청·응답 내용을 확인할 수 없어 트래픽 모니터링 가치가 크게 줄어든다.

### Option C — 암호화 저장과 보존 기간 자동 삭제
- 본문을 암호화해 저장하고 설정된 TTL 이후 자동 삭제한다.
- Pro: 본문 확인 기능과 강한 보호·보존 통제를 제공한다.
- Con: 키 관리, 삭제 작업, 운영 설정이 초기 제품의 복잡도를 크게 높인다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 디버깅 가치 | 높음 | 낮음 | 높음 |
| 기본 구현 복잡도 | 중간 | 낮음 | 높음 |
| 민감정보 위험 | 중간 | 낮음 | 낮음~중간 |
| 운영 의존성 | 낮음 | 낮음 | 높음 |

## Recommendation
- 초기 로컬·단일 사용자 제품에는 헤더 마스킹과 request 수신 한도·전체 request/response 보존을 권장한다. 저장량과 보존 기간은 후속 운영 정책으로 명시한다.

## Consequences
- 로그 저장 전 헤더 마스킹을 구현하고, request 수신에는 `maxBodyBytes`를 적용해야 한다. request/response JSON은 저장 단계에서 잘라내지 않는다.
- 민감정보의 비정형 본문 탐지와 암호화·TTL 자동 삭제는 초기 범위에서 제외하거나 후속 범위로 남긴다.

## Downstream Concerns
- [x] **deferred assumption — 기본 보존 기간 및 삭제 방식:** 초기 범위에서는 자동 TTL 삭제를 제공하지 않고, 저장 경로 삭제 또는 별도 관리 명령으로 정리한다. 운영 보존 정책이 필요해지면 재검토한다.
- [x] **directly resolved — UI 노출:** UI도 저장된 마스킹 결과만 표시하며 원본 비밀을 복구하지 않는다.

## Related
- `spec/AC.md` — AC-004
- `adr/traffic-log-storage.md` — 저장 형식

## Notes
- 2026-03-10: AC-004의 민감정보 보호와 보존 결정을 위해 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. 헤더 마스킹과 본문 크기 제한 정책을 채택했다.
- 2026-03-10: 사용자 Direct Input으로 정책을 수정했다. `maxBodyBytes`는 request 수신 한도로 유지하고, 저장 request/response JSON은 전체 보존하며 오류 문자열만 제한한다.
