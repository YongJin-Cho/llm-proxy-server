# 긴 문자열 형식 표시와 안전한 전체 보기

## Concern
request/response의 긴 문자열을 어떻게 축약·확장하고, Markdown·JSON·JavaScript 등 형식이 섞인 provider/client 데이터를 실행 없이 안전하게 표시할 것인가?

## Status
proposed

## Context
- traffic 상세에는 provider/client가 보낸 JSON과 긴 문자열이 포함될 수 있다.
- 긴 본문을 항상 펼치면 가독성과 성능이 떨어지고, 항상 자르면 debugging과 회귀 검증이 어려워진다.
- Markdown·JSON·JavaScript처럼 실행 또는 HTML 해석으로 이어질 수 있는 형식이 저장될 수 있다.
- UI는 저장된 traffic을 읽기 위한 도구이지 저장된 코드를 실행하는 환경이 아니다.
- 원본 JSON은 서버에 저장된 bounded content를 그대로 보존하고, 표시 형식은 UI presentation 책임으로 둔다.

## Decision

## Options
### Option A — 안전한 형식별 read-only renderer와 명시적 전체 보기
- JSON은 파싱 가능한 경우 pretty-print하고 실패하면 escaped plain text로 표시한다.
- Markdown은 HTML로 직접 주입하지 않고 sanitized read-only rendering 또는 escaped plain text로 표시한다.
- JavaScript와 알 수 없는 형식은 실행·평가·iframe 없이 syntax-highlight 가능한 escaped code block으로 표시한다.
- 긴 문자열은 고정된 preview 길이/줄 수로 축약하고, 사용자가 같은 뷰 안에서 전체 보기로 확장한다.
- Pro: 읽기 편의성과 원본 확인을 결합하면서 XSS·임의 실행을 차단한다.
- Con: format detection과 sanitization 정책을 구현·테스트해야 한다.

### Option B — 모든 content를 escaped plain text로만 표시
- 형식 해석이나 syntax highlighting 없이 모든 값을 text/code block으로 렌더링한다.
- 긴 값은 preview와 전체 보기로 나눈다.
- Pro: 보안 모델과 구현이 가장 단순하다.
- Con: JSON/Markdown 구조를 읽기 어렵고 운영 분석 효율이 낮다.

### Option C — content type별 외부 renderer를 그대로 사용
- Markdown renderer, JSON viewer, code editor 등 전용 component를 사용해 형식별 UX를 제공한다.
- Pro: 가장 풍부한 탐색·가독성 경험을 제공할 수 있다.
- Con: sanitizer 설정 오류, HTML injection, code execution surface와 bundle/runtime 복잡도가 커진다.

## Tradeoffs
| | Option A — safe read-only renderer | Option B — plain text | Option C — unrestricted renderer |
|---|---|---|---|
| 읽기 편의성 | 높음 | 낮음~중간 | 높음 |
| XSS·임의 실행 위험 | 낮음; sanitization 필요 | 가장 낮음 | 높음 |
| 구현 복잡도 | 중간 | 낮음 | 높음 |
| format 오인식 fallback | 명시적으로 가능 | 항상 동일 | renderer별 상이 |
| 전체 보기 | 지원 | 지원 | 지원 |

## Recommendation
- **Option A — 안전한 형식별 read-only renderer와 명시적 전체 보기**를 권장한다. 운영자가 구조화된 traffic을 읽는 효용을 유지하면서도 저장된 provider/client 데이터가 HTML·JavaScript로 실행되는 경로를 차단할 수 있다.

## Consequences
- preview는 길이와 줄 수 기준으로 축약하고, 전체 보기 동작으로 저장된 bounded content 전체를 읽을 수 있게 한다.
- JSON은 구조화된 read-only view를 우선하고 parse 실패 시 escaped text로 fallback한다.
- Markdown은 허용 목록 기반 sanitized rendering 또는 escaped text로만 표시한다.
- JavaScript와 알 수 없는 형식은 실행하지 않고 escaped code block으로 표시한다. `innerHTML`, `eval`, `new Function`, 실행 가능한 iframe은 사용하지 않는다.
- format detection은 신뢰할 수 없는 content를 자동 실행하거나 원본 type을 보장하는 것으로 간주하지 않는다.

## Downstream Concerns
- [ ] **ADR candidate — Preview thresholds:** preview의 최대 문자 수·줄 수와 전체 보기의 UI 상태를 확정해야 한다.
- [ ] **ADR candidate — Supported format detection:** JSON/Markdown/code 판별 우선순위와 sanitizer 허용 목록을 확정해야 한다.
- [x] **directly resolved — Execution safety:** 저장된 content는 실행하지 않고 escaped/sanitized read-only view로만 표시한다.
- [x] **covered — Content size bound:** AC-004의 저장 시 최대 본문 크기와 잘라내기 정책을 따른다.

## Related
- `spec/AC.md` — AC-028
- `adr/sensitive-data-retention.md`
- `adr/ui-framework-and-monitoring-structure.md`
- `adr/turn-summary-usage-projection.md`

## Notes
- 2026-03-10: AC-028 review를 위해 safe renderer·plain text·외부 renderer 선택지를 비교하는 proposed ADR을 작성했다.
