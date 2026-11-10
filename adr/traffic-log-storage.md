# 트래픽 로그 저장 모델과 저장소

## Concern
요청·응답 트래픽 로그를 어떤 데이터 모델과 저장소에 기록하고 조회해야 하는가?

## Status
approved

## Context
- 프록시는 요청·응답 쌍과 성공·실패·스트리밍 종료 상태를 저장해야 한다.
- 모니터링 UI는 목록과 상세 조회를 제공해야 한다.
- 초기 제품은 로컬에서 쉽게 실행·검증할 수 있어야 하며, 향후 확장 가능성도 남겨야 한다.

## Decision
**Option A — SQLite와 관계형 단일 로그 테이블.** SQLite 파일에 로그 메타데이터와 JSON 요청·응답 본문을 저장하여 별도 서버 없이 실행하고 SQL 기반 조회를 제공한다.

## Options
### Option A — SQLite와 관계형 단일 로그 테이블
- SQLite 파일에 정규화된 메타데이터와 JSON 요청·응답 본문을 저장한다.
- Pro: 별도 서버 없이 로컬 실행과 테스트가 쉽다.
- Pro: 정렬·필터·기간 조회를 위한 SQL이 명확하다.
- Con: 다중 인스턴스·대규모 로그 수집에는 한계가 있다.

### Option B — PostgreSQL 등 외부 관계형 데이터베이스
- 별도 데이터베이스 서버에 로그와 메타데이터를 저장한다.
- Pro: 동시성, 확장, 운영 기능이 우수하다.
- Con: 로컬 실행과 배포에 외부 의존성이 추가된다.

### Option C — JSONL 또는 파일 기반 저장
- 요청·응답 레코드를 JSON Lines 파일에 append하고 조회 시 읽는다.
- Pro: 가장 단순하고 의존성이 거의 없다.
- Con: 필터·페이지네이션·동시 쓰기·데이터 무결성이 빠르게 복잡해진다.

## Tradeoffs
| | Option A | Option B | Option C |
|---|---|---|---|
| 로컬 실행 | 매우 쉬움 | 별도 DB 필요 | 매우 쉬움 |
| 조회 기능 | SQL로 용이 | SQL로 용이 | 구현 부담 증가 |
| 확장성 | 중간 | 높음 | 낮음 |
| 운영 복잡도 | 낮음 | 중간~높음 | 낮음에서 시작해 증가 |

## Recommendation
- 초기 deliverable의 실행성과 검증성을 위해 Option A를 권장한다.

## Consequences
- 로그 스키마, 본문 크기 제한, 인덱스, 페이지네이션을 Spec에 명시해야 한다.
- PostgreSQL 또는 파일 기반 저장은 초기 범위에서 채택하지 않는다.

## Downstream Concerns
- [x] **directly resolved — 로그 본문 저장 형식과 크기 제한:** 요청·응답 본문은 JSON으로 저장한다. 민감정보 헤더는 마스킹하고 `maxBodyBytes`는 request 수신 한도로 적용하며, 저장 request/response JSON은 잘라내지 않는다.
- [x] **directly resolved — 조회 방식:** 초기 UI 조회는 목록·상세·기본 시간순 정렬과 페이지네이션으로 제한한다.

## Related
- `spec/AC.md` — AC-003
- `adr/streaming-response-handling.md` — 스트리밍 저장 상태

## Notes
- 2026-03-10: AC-003의 저장소와 로그 모델 결정을 위해 proposed ADR을 작성했다.
- 2026-03-10: Status → approved. Option A를 선택해 SQLite 기반 저장을 채택했다.
