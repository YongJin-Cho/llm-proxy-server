# PRD: LLM Proxy Server

## Summary
Codex와 유사한 LLM 클라이언트와 OpenAI Model Provider 사이에서 요청·응답을 중계하는 LLM Proxy Server를 구축한다. 프록시는 트래픽의 요청/응답 쌍을 저장하고, 운영자가 웹 UI에서 저장된 트래픽 로그를 조회·모니터링할 수 있게 한다.

## Goals
- 클라이언트가 프록시를 OpenAI 호환 모델 제공자처럼 사용하도록 요청을 전달하고 제공자 응답을 반환한다.
- 프록시를 통과한 요청과 응답을 추적 가능한 형태로 저장한다.
- 운영자가 웹 UI에서 저장된 트래픽을 확인하여 동작과 오류를 모니터링할 수 있게 한다.
- 구현·검증 가능한 요구사항과 제품 백로그를 확정한다.
- API·UI·provider·저장소 확장을 위한 모듈 경계와 구현 기준을 설계한다.

## Audience
- OpenAI 호환 API를 사용하는 Codex 계열 및 기타 LLM 클라이언트 사용자
- 프록시 트래픽과 오류를 확인하는 개발자·운영자

## Deliverables
- 실행 가능한 LLM Proxy Server 애플리케이션
- 요청 전달 및 제공자 응답 반환을 위한 HTTP API
- 요청/응답 트래픽 저장 기능
- 저장된 트래픽 로그를 조회하는 웹 모니터링 UI
- 실행 방법, 설정, API 및 검증 절차를 설명하는 프로젝트 문서

## Scope
### In Scope
- 클라이언트 요청을 OpenAI Model Provider로 전달
- 제공자 응답을 클라이언트에 반환
- 요청·응답 쌍의 저장 및 조회
- 웹 UI를 통한 저장 트래픽 모니터링
- API·UI framework 후보 비교와 승인된 선택 기준
- 복수 provider 설정과 client model ID → provider/model ID 라우팅 계약
- API 로그 기록 경로와 UI 조회 경로의 DB 접근 경계
- 기존 MVP 동작을 보존하는 migration·회귀 검증·단일 프로세스 실행 문서
- 핵심 오류 처리와 운영에 필요한 기본 설정

### Out of Scope
- 모델 자체의 학습·호스팅·추론 엔진 구현
- 여러 외부 모델 제공자에 대한 완전한 통합 추상화
- 사용자·조직 단위의 완성형 인증·권한 관리 제품
- 고급 분석, 알림, 과금, 장기 보존 정책
- 이 요구사항 확정 단계에서의 제품 코드 구현

## Constraints
- OpenAI Model Provider와의 통신 및 클라이언트 호환성은 구현 시 명시적인 API 계약으로 정의해야 한다.
- 스트리밍 응답 지원 여부와 방식은 별도 설계 결정으로 확정해야 한다.
- 저장 데이터에는 API 키 등 민감정보가 포함될 수 있으므로 저장·표시 보호 방식을 결정해야 한다.
- 로그 저장소와 웹 UI 기술 선택은 구현·운영 복잡도와 검증 가능성을 고려해야 한다.
- 상세 요구사항은 사용자 승인 Spec을 구현·검증의 단일 기준으로 삼는다.

## Approval

- 2026-03-10: 사용자 go-ahead(“ok”)로 PRD 승인.
- 2026-03-10: Chat Completions·Claude Messages 지원 delta는 Sprint 07에서 별도 요구사항으로 확정하기로 했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Delta PRD를 승인했다. AC 식별 단계로 진행한다.
- 2026-03-10: 사용자 go-ahead("ok")로 Turn 관리·분석 UI Delta PRD를 승인했다. AC-025~AC-028 식별 단계로 진행한다.
- 2026-03-10: 사용자 지시에 따라 기존 traffic migration을 범위에서 제외하고, non-migration 호환 표시 정책을 AC로 분리했다.

## Delta: Chat Completions·Claude Messages API 지원

### Delta Summary
기존 `/api/v1/responses` 프록시를 보존하면서 OpenAI Chat Completions API와 Claude Messages API를 추가 지원한다. 클라이언트는 기존 client model ID 기반 routing을 사용하고, 각 API의 public payload·response·error·streaming 계약은 해당 API 클라이언트가 기대하는 형식을 유지한다.

### Delta Goals
- `/api/v1/chat/completions`를 통해 OpenAI Chat Completions 클라이언트 요청을 provider로 전달하고 응답을 반환한다.
- `/api/v1/messages`를 통해 Claude Messages 클라이언트 요청을 provider로 전달하고 응답을 반환한다.
- Responses, Chat Completions, Messages API를 독립 adapter/plugin으로 확장·검증할 수 있게 한다.
- Claude provider의 API key와 필수 version/header 요구사항을 설정·환경변수 원칙에 맞게 전달한다.
- 세 API의 성공·오류·비스트리밍·스트리밍 트래픽을 기존 SQLite 로그 모델에 안전하게 기록하고 기존 Responses 동작을 회귀 검증한다.

### Delta In Scope
- 두 public route의 경로와 upstream endpoint mapping
- Chat Completions 및 Claude Messages의 요청·응답·오류 payload 변환 또는 투명 전달 범위
- OpenAI Bearer와 Claude 인증/header 설정
- 세 API의 SSE streaming 전달 및 완료·중단 판정
- API 종류와 provider/model 정보를 포함한 로그 metadata 정규화
- configuration validation, model routing, secret redaction, body size limit
- 기존 Responses API 회귀 검증과 신규 API 통합 검증
- 실행 문서 및 구현 backlog 갱신

### Delta Out of Scope
- 제품 코드 구현 자체는 Sprint 07의 Spec→backlog 범위에 포함하지 않는다.
- Anthropic SDK 의존성 도입, provider별 고급 기능의 완전한 추상화, API 간 자동 payload 변환은 별도 결정 없이 추가하지 않는다.
- Claude Messages를 OpenAI 호환 형식으로 노출하거나 그 반대의 번역은 승인된 계약에 명시된 경우에만 포함한다.
- UI의 실시간 streaming 화면, 과금·토큰 분석, 다중 사용자 인증은 포함하지 않는다.

### Delta Constraints
- 기존 `/api/v1/responses` route, configuration convention, SQLite writer/reader boundary, secret redaction 정책을 보존한다.
- public route는 `/api/v1` namespace를 유지한다.
- provider secret은 `config.json`에 평문으로 저장하지 않고 `apiKeyEnv`가 가리키는 process environment에서 로드한다.
- API adapter는 route/payload/provider response 변환 책임을 가지며 공통 application service와 `TrafficLogWriter` port를 직접 결합하지 않는다.
- 구현은 승인된 Delta Spec 이후 별도 implementation sprint에서 진행한다.

### Delta Success Criteria
- Chat Completions와 Messages의 정상·실패 요청이 올바른 provider endpoint와 인증 방식으로 전달되고 client contract에 맞는 응답을 반환한다.
- 두 API의 비스트리밍·스트리밍 성공 및 upstream/client disconnect 실패가 로그에 추적 가능하게 기록된다.
- 기존 Responses의 정상·실패·streaming·routing·secret redaction 검증이 계속 통과한다.
- 잘못된 model/configuration, upstream 오류, payload size 초과가 secret을 노출하지 않고 식별 가능한 오류로 반환된다.
- 승인된 Spec에서 구현 task와 검증 task를 독립적으로 계획할 수 있다.

## Success Criteria
- 구성된 클라이언트 요청이 프록시를 통해 제공자에 도달하고, 제공자 응답이 클라이언트에 반환된다.
- 성공 및 실패 트래픽의 요청·응답 쌍이 조회 가능한 형태로 저장된다.
- 운영자가 웹 UI에서 저장 로그를 목록으로 확인하고 개별 트래픽 상세를 볼 수 있다.
- 민감한 인증 정보가 로그와 UI에 평문으로 노출되지 않는다.
- 자동화된 검증 절차로 핵심 프록시, 저장, UI 조회 동작을 재현할 수 있다.

## Delta: Turn 관리·분석 UI

### Delta Summary
기존 turn/traffic 탐색 UI를 확장해 운영자가 저장·분석할 가치가 있는 turn을 별도로 관리할 수 있게 한다. 운영자는 sidebar에서 turn을 접고 펼치며 선택·전체 선택·삭제하고, 제목을 편집하며, flag를 설정해 flagged turn만 별도로 탐색할 수 있다. main view에서는 turn 전체 요약과 traffic별 사용량을 확인하고, traffic view에서는 request/response 객체를 구조적으로 탐색하며 긴 문자열을 형식에 맞게 전체 보기할 수 있다.

### Delta Goals
- turn을 폴더처럼 접고 펼치며 제목·상태·flag를 한눈에 관리한다.
- 전체·flagged 등 탭으로 turn을 필터링하고 선택·삭제 작업을 수행한다.
- turn과 traffic에 사용자 지정 제목을 저장하며, 제목이 없으면 각각 turn ID·traffic ID를 표시한다.
- turn 선택 시 시작 user input, 종료 AI output, 실행 환경, 전체 usage와 traffic별 usage를 요약한다.
- traffic 선택 시 request/response JSON 객체를 접고 펼치며 긴 문자열의 전체 내용을 안전하게 확인한다.

### Delta In Scope
- turn tree sidebar의 접기/펼치기, 개별 선택, 전체 선택, 삭제 UI
- turn flag 설정·해제 및 전체/flagged 등 필터 탭
- turn·traffic 제목 편집과 기본 ID fallback
- completed, failed, in_progress 등 lifecycle 상태의 아이콘 표시
- turn summary의 시작 user input, 종료 AI output, 모델·실행 환경, usage/cost·처리 시간 표시
- traffic별 usage summary table
- traffic request/response JSON object의 접기/펼치기 탐색
- 긴 문자열 축약 표시와 전체 문자열 modal/window 보기
- Markdown, JSON, JavaScript 등 형식 추정에 따른 표시와 안전한 fallback
- 기존 turn/traffic 선택·URL state·traffic detail 조회와의 호환

### Delta Out of Scope
- 자동 요약문 생성 또는 LLM 기반 형식 분류
- 사용자·조직별 인증·권한과 다중 사용자 공유
- 고급 분석 차트, 알림, 과금 기능
- 기존 traffic의 소급 turn grouping
- 실시간 streaming transcript 편집·주석
- 이번 요구사항 확정 단계에서의 제품 코드 구현

### Delta Constraints
- 기존 `/api/v1` namespace, SQLite writer/reader 경계, secret redaction, bounded body 정책을 유지한다.
- UI component는 API를 직접 호출하지 않고 기존 data-query/application 경계를 따른다.
- 삭제·제목·flag 등 관리 메타데이터는 기존 traffic 본문과 lifecycle 원본을 임의로 덮어쓰지 않는다.
- 긴 문자열과 코드·Markdown은 XSS 및 임의 실행 없이 읽기 전용으로 표시한다.
- 구현·검증의 SSOT는 이 delta에 대한 별도 승인 Spec이다.

### Delta Success Criteria
- 사용자가 sidebar에서 turn을 접고 펼치고, 선택·전체 선택·삭제·flag 설정을 수행할 수 있다.
- 전체·flagged 탭에서 원하는 turn을 재현 가능하게 탐색할 수 있고, 제목과 상태 아이콘을 확인할 수 있다.
- turn summary가 시작/종료 메시지, 실행 환경, 전체 및 traffic별 usage를 표시한다.
- traffic view가 request/response 객체를 접고 펼치며 긴 문자열을 축약/전체 보기로 전환한다.
- 지원 가능한 형식은 읽기 쉬운 renderer로 표시하고, 불확실하거나 지원하지 않는 형식은 안전한 plain-text fallback을 사용한다.
- 승인 Spec에서 저장·조회 API, UI, persistence, 검증 task를 독립적으로 계획할 수 있다.

## Delta: Turn 기반 traffic 그룹핑·탐색 UI

### Delta Summary
하나의 사용자 요청이 tool call과 harness 처리에 따라 여러 LLM traffic으로 이어질 수 있으므로, 관련 traffic을 하나의 turn으로 그룹핑해 저장한다. 운영자는 왼쪽 sidebar tree에서 turn과 하위 traffic을 탐색하고, 선택한 turn 또는 traffic의 내용을 메인 뷰에서 확인한다.

### Delta Goals
- 하나의 turn에 속한 복수 traffic을 안정적으로 저장하고 조회한다.
- turn/traffic 계층을 sidebar tree로 표시해 관련 traffic의 흐름을 이해할 수 있게 한다.
- sidebar에서 선택한 turn 또는 traffic을 메인 뷰에 표시한다.
- 기존 traffic 데이터와 기존 로그 조회 동작을 가능한 범위에서 보존한다.
- 승인 Spec에서 구현·검증 가능한 후속 backlog를 도출한다.

### Delta In Scope
- turn과 traffic의 저장 관계 및 조회 모델
- harness가 전달하는 turn/grouping metadata의 수용 경계
- turn 하위 traffic 순서와 lifecycle 표시
- SSE streaming traffic의 개별 data event를 최종 통합 응답 하나로 저장
- 기존 traffic 데이터를 migration하지 않는 호환 표시 정책
- turn/traffic tree sidebar와 선택 상태
- 선택한 turn/traffic의 메인 뷰 내용 표시
- 관련 API, UI loading, empty/error 상태 및 회귀 검증 기준

### Delta Out of Scope
- tool call 자체의 실행 로직 변경
- 실시간 streaming transcript UI
- streaming 중간 data event의 개별 영구 저장
- 사용자·조직별 인증 및 권한
- 고급 분석·차트·알림·과금
- 기존과 무관한 log retention 정책
- 이 요구사항 확정 단계에서의 제품 코드 구현

### Delta Constraints
- 기존 `/api/v1` namespace와 traffic log 조회 호환성을 고려한다.
- SSE는 client에 투명 전달하되, 저장 응답은 정상 종료 시 provider API 계약에 맞는 최종 통합 응답 하나여야 한다.
- API application path의 log writer와 UI query path의 read boundary를 유지한다.
- secret redaction과 bounded request/response body 정책을 유지한다.
- 구현·검증의 SSOT는 이 delta에 대한 승인 Spec이다.
- 기존 traffic schema/data는 migration하지 않으며, turn metadata가 없는 traffic의 표시 동작을 명시적으로 정의한다.

### Delta Success Criteria
- 승인 Spec이 turn grouping, non-migration 호환 정책, tree navigation, main-view selection을 독립적으로 구현·검증할 수 있는 requirement와 constraint를 제공한다.
- 사용자는 turn을 선택했을 때 해당 turn의 요약과 하위 traffic 관계를, traffic을 선택했을 때 기존 traffic 상세를 확인할 수 있다.
- SSE traffic의 저장된 응답에는 개별 `data` event 목록이 아니라 최종 통합 응답이 기록된다.
- turn metadata가 없는 기존 traffic도 정의된 호환 정책에 따라 조회 가능하다.
