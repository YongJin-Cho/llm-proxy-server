# Architectural Concerns

LLM Proxy Server를 위한 구조적 설계 쟁점의 living registry이다.

## Summary

| ID | Title | Category | Status | Related ADRs | ASR (after ④) |
|----|-------|----------|--------|--------------|---------------|
| AC-001 | 프록시 API 계약과 호환 범위 | Integration & dependencies | identified | — | — |
| AC-002 | 스트리밍 응답 처리 | Constraints (structural) | identified | — | — |
| AC-003 | 트래픽 로그 저장 모델과 저장소 | Structure & organization | identified | — | — |
| AC-004 | 민감정보 보호와 로그 보존 | Constraints (structural) | identified | — | — |
| AC-005 | 프록시 및 모니터링 UI 접근 통제 | Quality bar (architectural) | identified | — | — |
| AC-006 | 모니터링 UI의 조회 범위와 운영 기능 | Deliverable form | identified | — | — |
| AC-007 | 배포 단위와 실행 구성 | Deliverable form | identified | — | — |

## Dependency Order (recommended review path)

1. AC-001 → AC-002 → AC-003 → AC-004 → AC-005 → AC-006 → AC-007

## AC Detail

### AC-001 — 프록시 API 계약과 호환 범위

- **Category:** Integration & dependencies
- **Status:** identified
- **Statement:** 프록시가 어떤 OpenAI 호환 엔드포인트, 요청 형식, 응답 형식, 오류 형식, 헤더 전달 규칙을 지원해야 하는가?
- **Why it matters:** 계약 범위를 잘못 정하면 클라이언트 호환성이 깨지거나 필요 이상의 API를 구현하게 된다.
- **Depends on:** —
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** 미정

### AC-002 — 스트리밍 응답 처리

- **Category:** Constraints (structural)
- **Status:** identified
- **Statement:** 제공자의 스트리밍 응답을 프록시가 지원할 것인지, 지원한다면 클라이언트까지 어떤 방식으로 전달하고 로그에 어떻게 기록할 것인가?
- **Why it matters:** 스트리밍은 연결 수명, 오류 처리, 로그 완결성, UI 표시 방식에 직접 영향을 준다.
- **Depends on:** AC-001
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** 미정

### AC-003 — 트래픽 로그 저장 모델과 저장소

- **Category:** Structure & organization
- **Status:** identified
- **Statement:** 요청·응답 쌍, 메타데이터, 오류, 스트리밍 청크를 어떤 데이터 모델과 저장소에 기록하고 조회할 것인가?
- **Why it matters:** 저장소 선택은 검색성, 설치 복잡도, 데이터 일관성, 향후 확장 비용을 결정한다.
- **Depends on:** AC-001, AC-002
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** 미정

### AC-004 — 민감정보 보호와 로그 보존

- **Category:** Constraints (structural)
- **Status:** identified
- **Statement:** API 키·Authorization 헤더·프롬프트 등 민감할 수 있는 데이터를 무엇을 마스킹·암호화·제외하고 얼마 동안 보존할 것인가?
- **Why it matters:** 로그가 운영 가치를 가지면서도 인증정보 유출과 불필요한 민감정보 저장을 막아야 한다.
- **Depends on:** AC-003
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** 미정

### AC-005 — 프록시 및 모니터링 UI 접근 통제

- **Category:** Quality bar (architectural)
- **Status:** identified
- **Statement:** 프록시 엔드포인트와 모니터링 UI에 어떤 최소 인증·접근 통제를 적용할 것인가?
- **Why it matters:** 인증 없는 프록시는 비용·오용 위험을 만들고, 로그 UI는 저장된 트래픽을 노출할 수 있다.
- **Depends on:** AC-004
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** 미정

### AC-006 — 모니터링 UI의 조회 범위와 운영 기능

- **Category:** Deliverable form
- **Status:** identified
- **Statement:** UI에서 목록·상세 외에 어떤 필터, 검색, 상태·지연시간 표시, 새로고침 방식을 초기 범위에 포함할 것인가?
- **Why it matters:** UI 범위를 정하지 않으면 구현량과 운영 효용 사이의 균형이 흔들린다.
- **Depends on:** AC-003, AC-004, AC-005
- **Related ADRs:**
  - 없음
- **Resolution path:** direct-input
- **Resolution:** 미정

### AC-007 — 배포 단위와 실행 구성

- **Category:** Deliverable form
- **Status:** identified
- **Statement:** 프록시 API, 로그 저장소, 모니터링 UI를 하나의 실행 단위로 제공할지 분리할지, 로컬 실행에 필요한 의존성을 어떻게 구성할 것인가?
- **Why it matters:** 배포 형태는 개발·검증 난이도와 사용자가 실제로 실행할 수 있는지에 영향을 준다.
- **Depends on:** AC-003, AC-005, AC-006
- **Related ADRs:**
  - 없음
- **Resolution path:** adr
- **Resolution:** 미정

## Notes

- 2026-03-10: 승인된 PRD를 바탕으로 초기 blocking AC 7개를 식별했다.
