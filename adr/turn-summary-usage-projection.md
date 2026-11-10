# Turn summary와 traffic usage summary projection

## Concern
turn summary와 traffic별 usage·cost summary를 서버가 어떤 projection과 null·partial 데이터 규칙으로 제공할 것인가?

## Status
proposed

## Context
- turn은 여러 traffic으로 구성되며, 각 traffic에는 모델·상태·latency·usage·cost가 저장될 수 있다.
- UI는 turn 선택 시 시작 user input, 종료 AI output, 모델, 실행 환경, 처리 시간과 전체 usage·cost를 보여줘야 한다.
- 진행 중이거나 실패한 turn, usage가 없는 provider 응답, 여러 모델·여러 traffic이 있는 turn을 일관되게 표시해야 한다.
- AC-018은 provider가 보고한 usage와 명시된 USD cost만 저장하고, 없는 값은 `NULL`로 두도록 결정했다.
- turn tree endpoint는 sidebar용 summary를 제공하고 traffic 상세 본문은 선택 시 지연 조회한다.

## Decision

## Options
### Option A — 서버 query projection과 명시적 partial 규칙
- 서버 query service가 turn과 child traffic을 읽어 summary DTO를 생성한다.
- 시작 user input은 첫 traffic의 request에서, 종료 AI output은 마지막 completed traffic의 response에서 선택한다.
- usage·cost는 turn child traffic의 non-null 값을 합산하고, 값이 하나도 없으면 `null`을 반환한다. 일부 traffic만 값이 있으면 partial 상태와 함께 알려준다.
- Pro: 모든 client가 같은 계산을 사용하고 pagination·legacy projection과 일관된다.
- Con: query projection과 provider별 본문 추출 규칙을 서버에 구현해야 한다.

### Option B — UI가 child traffic을 받아 summary 계산
- 서버는 child metadata와 usage raw values를 반환하고 UI가 시작·종료 traffic 선택과 합산을 수행한다.
- Pro: 서버 query 구현이 작고 화면별 표현을 빠르게 바꿀 수 있다.
- Con: 계산 규칙이 client에 중복될 수 있고, child payload·legacy·partial 상태 처리 차이가 생긴다.

### Option C — turn summary를 write 시점에 미리 계산·저장
- traffic 저장 또는 turn 완료 시 summary와 usage 합계를 turns row에 materialize한다.
- Pro: 조회가 단순하고 대규모 조회에서 빠르다.
- Con: partial/in-progress 갱신, 기존 데이터 기본값, 삭제·재계산 정합성을 관리해야 한다.

## Tradeoffs
| | Option A — 서버 projection | Option B — UI 계산 | Option C — materialized summary |
|---|---|---|---|
| 계산 일관성 | 높음 | 중간~낮음 | 높음; 갱신 정확성 필요 |
| 조회 payload | summary 중심 | child metadata 증가 | 낮음 |
| partial/in-progress 처리 | query 규칙으로 통일 | 화면별 차이 위험 | write lifecycle 복잡 |
| 기존/legacy 호환 | projection에서 처리 | UI가 fallback 처리 | backfill 필요 |
| 구현 복잡도 | 중간 | 서버 낮음·client 높음 | 높음 |

## Recommendation
- **Option A — 서버 query projection과 명시적 partial 규칙**을 권장한다. summary와 usage는 운영 데이터 계약이므로 UI마다 계산하지 않고 query service에서 단일 규칙으로 제공하는 편이 일관성과 검증 가능성이 높다.

## Consequences
- turn summary와 traffic usage summary는 서버 query projection DTO로 제공하며 UI는 합산·traffic 선택 규칙을 재구현하지 않는다.
- 시작 입력·종료 출력이 없거나 본문 형식이 지원되지 않으면 해당 summary field는 `null`이며, 서버는 원본 traffic을 숨기지 않는다.
- usage·cost가 일부 traffic에만 있으면 합계와 함께 partial 여부를 표시하고, 모든 값이 없으면 합계는 `null`이다.
- provider가 보고하지 않은 cost를 추정하거나 proxy-owned pricing table로 계산하지 않는다.
- materialized turn summary column은 이번 범위에서 추가하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Summary extraction:** API별 request/response에서 시작 user input과 종료 AI output을 추출하는 세부 규칙을 확정해야 한다.
- [ ] **ADR candidate — Partial summary representation:** partial 여부를 boolean, 상태 enum, field-level metadata 중 어떤 응답 형식으로 표현할지 결정해야 한다.
- [x] **covered — Usage normalization:** AC-018의 provider-reported usage/cost normalization을 따른다.
- [x] **covered — Tree endpoint:** AC-020의 turn tree projection과 child summary 경계를 따른다.

## Related
- `spec/AC.md` — AC-027
- `adr/usage-and-cost-metadata.md`
- `adr/turn-traffic-query-tree-projection.md`
- `adr/turn-management-metadata-and-deletion.md`

## Notes
- 2026-03-10: AC-027 review를 위해 서버 projection·UI 계산·write-time materialization 선택지를 비교하는 proposed ADR을 작성했다.
