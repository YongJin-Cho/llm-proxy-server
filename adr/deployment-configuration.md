# 배포 단위와 실행 구성

## Concern
프록시 API, 로그 저장소, 모니터링 UI를 어떤 실행 단위와 구성으로 제공해야 하는가?

## Status
approved

## Context
- 초기 제품은 localhost에서 개발·검증·운영되는 단일 운영자 제품이다.
- 프록시와 UI는 같은 트래픽 로그 저장소를 사용해야 한다.
- 별도 서비스가 많아지면 배포와 실행 절차가 복잡해진다.

## Decision
**Option A — 단일 프로세스·단일 애플리케이션.** 하나의 서버 프로세스가 프록시 API, 로그 API, 정적 UI를 제공하고 SQLite 파일을 로컬 데이터 디렉터리에 저장한다. 코드 내부에서는 기능 모듈을 분리해 후속 확장 경로를 유지한다.

## Options
### Option A — 단일 프로세스·단일 애플리케이션
- 하나의 서버 프로세스가 프록시 API, 로그 API, 정적 UI를 제공한다.
- SQLite 파일을 로컬 데이터 디렉터리에 저장한다.
- Pro: 실행·테스트·배포가 단순하고 localhost 정책과 잘 맞는다.
- Con: API와 UI를 독립적으로 확장하기 어렵다.

### Option B — API·UI·DB 분리 서비스
- 프록시 API, UI 서버, 데이터베이스를 별도 서비스로 실행한다.
- Pro: 독립 배포·확장과 구성 분리가 가능하다.
- Con: 초기 실행·네트워크·설정 복잡도가 커진다.

### Option C — 단일 프로세스 + 컨테이너 중심 구성
- 애플리케이션은 단일 프로세스지만 Docker와 컨테이너 설정을 기본 배포 방식으로 제공한다.
- Pro: 환경 재현성이 높다.
- Con: 로컬 실행에 Docker 의존성이 추가된다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 실행 단순성 | 매우 높음 | 낮음 | 중간 |
| 독립 확장 | 낮음 | 높음 | 낮음~중간 |
| 로컬 검증 | 매우 쉬움 | 복잡 | Docker 필요 |
| 초기 범위 적합성 | 높음 | 낮음 | 중간 |

## Recommendation
- Option A를 권장한다. 단일 애플리케이션으로 빠르게 실행·검증하고, 경계가 분리된 모듈 구조를 유지해 후속 분리를 가능하게 한다.

## Consequences
- 하나의 실행 명령과 데이터 디렉터리 설정을 제공한다.
- 프록시·로그·UI 모듈은 코드상 분리하지만 네트워크 서비스는 분리하지 않는다.
- 컨테이너 배포와 수평 확장은 초기 범위에서 제외한다.

## Downstream Concerns
- [x] **directly resolved — 설정 방식:** 포트, Provider URL, Provider API 키, 데이터 경로, 본문 최대 크기는 환경변수 또는 `.env` 예시로 설정한다.
- [x] **out of scope — 수평 확장:** 단일 로컬 프로세스 범위를 벗어난다.

## Related
- `spec/AC.md` — AC-007
- `adr/traffic-log-storage.md` — SQLite 저장소
- `adr/access-control.md` — localhost 바인딩

## Notes
- 2026-03-10: AC-007의 배포 단위와 실행 구성을 위해 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option A를 선택해 단일 프로세스·단일 애플리케이션을 채택했다.
