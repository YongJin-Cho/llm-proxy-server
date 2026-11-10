# Sprint 12 — Turn 관리·분석 UI 요구사항 및 구현 백로그 확정

> **Product Backlog:** [`product-backlog.md`](./product-backlog.md)
> **Execution board:** [`../TODO.md`](../TODO.md)

## Sprint Goal
저장·분석할 가치가 있는 turn을 운영자가 별도로 관리할 수 있도록 제목 편집, flag, 선택·삭제, 상태 표시, 전체/flagged 탐색과 turn·traffic 상세 분석 표시 요구사항을 확정한다. 사용자 승인 결정을 ADR/Direct Input으로 기록하고, 승인 Spec을 구현 가능한 product backlog로 분해한다.

## Scope

| ID | Story |
|----|-------|
| DELTA | 기존 turn 탐색 기능에 turn 관리·분석 UI 요구사항을 추가하고 승인 Spec 및 구현 backlog를 갱신한다. |

**Out of sprint:** 제품 코드 구현, 기존 데이터의 소급 grouping, 인증·권한, 다중 사용자 공유, 고급 차트·알림, 실시간 transcript UI, 자동 요약 생성, 서버 간 동기화.

## Definition of Done
1. 사용자의 turn 관리·분석 UI 요구사항을 PRD delta로 기록하고 성공 기준·범위·비범위를 명확히 한다.
2. 다음 blocking design concern을 사용자 결정으로 확정하고 필요한 ADR 또는 AC Direct Input으로 기록한다.
   - turn/traffic 제목·flag·삭제 메타데이터의 영구 저장 및 삭제 의미
   - 전체/flagged 등 sidebar 필터의 조회 책임과 페이지네이션 계약
   - turn summary와 traffic usage summary의 데이터 계약 및 표시 범위
   - 긴 문자열의 형식 감지·전체 보기·코드/Markdown/JSON 렌더링 안전성
3. 승인된 결정을 ASR에 통합하고 `spec/llm-proxy-turn-management.md`에 구현·검증 가능한 `R-NNN`/`C-NNN` 요구사항으로 기록한다.
4. Spec review 기록을 남기고, 승인 Spec을 PB-025 이후의 append-only product backlog story로 분해한다.
5. 새 요구사항을 구현할 다음 Backlog→Implementation sprint의 후보와 acceptance-oriented DoD를 백로그에 기록한다.

## Demo Checklist
- [ ] PRD delta가 기존 turn traffic Spec과의 관계, 성공 기준, out-of-scope를 설명한다.
- [ ] 제목/flag/삭제 저장 정책과 UI 필터 책임에 대한 사용자 승인 기록을 확인한다.
- [ ] turn summary, traffic request/response tree, usage table, 실행 환경 표시 계약을 확인한다.
- [ ] 긴 문자열 전체 보기와 형식별 표시의 안전한 동작·fallback 계약을 확인한다.
- [ ] 승인 Spec과 PB-025 이후 backlog story 간 추적성을 확인한다.
- [ ] 제품 코드 변경 없이 Spec→backlog sprint의 산출물을 검토한다.

## Approval
- 2026-03-10: 사용자 go-ahead("ok")로 Sprint 12 계획을 승인하고 Spec→backlog 실행을 시작했다.
