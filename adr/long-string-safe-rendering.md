# 긴 문자열 형식 표시와 안전한 전체 보기

## Concern
request/response의 긴 문자열을 어떻게 축약·확장하고, Markdown·JSON·JavaScript 등 형식이 섞인 provider/client 데이터를 실행 없이 안전하게 표시할 것인가?

## Status
proposed

## Context
- traffic 상세에는 provider/client가 보낸 JSON과 긴 문자열이 포함될 수 있다.
- 현재 UI는 JSON을 직접 pretty-print하고 나머지 값은 `<pre>`로 표시한다. 별도 viewer, Markdown renderer, syntax highlighter, 형식 감지 모듈은 아직 없다.
- 긴 본문을 항상 펼치면 가독성과 성능이 떨어지고, 항상 자르면 debugging과 회귀 검증이 어려워진다.
- Markdown·JSON·JavaScript처럼 실행 또는 HTML 해석으로 이어질 수 있는 형식이 저장될 수 있다.
- UI는 저장된 traffic을 읽기 위한 도구이지 저장된 코드를 실행하는 환경이 아니다.
- 형식 감지는 표시 방식 선택에는 유용하지만 콘텐츠만으로 형식을 확정할 수 없으므로 오인식·불확실성 fallback이 필요하다.
- 원본 JSON은 서버에 저장된 bounded content를 그대로 보존하고, 표시 형식은 UI presentation 책임으로 둔다.

## Decision

## Options
### Option A — 직접 구현한 안전 renderer
- JSON pretty-print, Markdown 처리, code block, preview/전체 보기를 프로젝트 내부 component로 직접 구현한다.
- 모든 출력은 escaped text 또는 명시적으로 sanitized된 결과만 허용한다.
- Pro: 의존성·bundle 증가를 최소화하고 동작을 완전히 통제할 수 있다.
- Con: 형식별 edge case, 접근성, syntax 표시, sanitization을 직접 유지해야 한다.

### Option B — 모든 content를 escaped plain text로만 표시
- 형식 해석이나 syntax highlighting 없이 모든 값을 text/code block으로 렌더링한다.
- 긴 값은 preview와 전체 보기로 나눈다.
- Pro: 보안 모델과 구현이 가장 단순하다.
- Con: JSON/Markdown 구조를 읽기 어렵고 운영 분석 효율이 낮다.

### Option C — allowlist 기반 외부 viewer 조합과 안전한 fallback
- 검증된 read-only JSON viewer, Markdown viewer, code/syntax viewer를 형식별로 조합한다.
- 형식 감지 모듈 또는 명시적 content metadata로 viewer를 선택하되, 감지 결과는 실행 권한으로 사용하지 않는다.
- HTML/JavaScript 실행, arbitrary HTML injection, 실행 가능한 iframe은 금지하고, 감지 실패·불확실한 형식은 escaped plain text로 fallback한다.
- 각 viewer를 preview/전체 보기 adapter로 감싸고 `LogDetail`은 viewer adapter만 사용한다.
- Pro: 다양한 형식의 가독성과 안전한 fallback을 확보하면서 직접 renderer 유지 비용을 줄인다.
- Con: 새 의존성·bundle 증가, viewer별 보안 설정과 라이선스·업데이트 검토가 필요하다.

## Tradeoffs
| | Option A — 직접 안전 renderer | Option B — plain text | Option C — 외부 viewer 조합 |
|---|---|---|---|
| 형식별 가독성 | 중간 | 낮음~중간 | 높음 |
| XSS·임의 실행 위험 | 낮음; 직접 검증 필요 | 가장 낮음 | 낮음; allowlist·설정 필요 |
| 구현·유지 비용 | 높음 | 낮음 | 중간 |
| 의존성 증가 | 낮음 | 없음 | 있음 |
| 오인식 fallback | 직접 구현 | 불필요 | 필요 |
| 전체 보기 | 직접 구현 | 직접 구현 | adapter로 통일 가능 |

## Recommendation
- **Option C — allowlist 기반 외부 viewer 조합과 안전한 fallback**을 권장한다. 다양한 형식의 traffic을 읽는 운영 효용을 확보하면서, 형식별 renderer를 직접 만들고 유지하는 비용을 줄일 수 있다. 단, viewer는 read-only로 제한하고 형식 감지는 표시 선택에만 사용한다.

## Consequences
- `LogDetail`은 JSON pretty-print와 일반 `<pre>`를 직접 조합하지 않고 viewer adapter를 통해 표시한다.
- JSON은 전용 read-only viewer를 우선 사용하고 parse 실패 시 escaped text로 fallback한다.
- Markdown은 안전한 read-only viewer를 사용하되 HTML injection을 허용하지 않거나 sanitizer allowlist를 적용한다.
- JavaScript와 알 수 없는 형식은 실행하지 않고 syntax viewer 또는 escaped code block으로 표시한다.
- preview는 길이와 줄 수 기준으로 축약하고, 전체 보기 동작으로 저장된 bounded content 전체를 읽을 수 있게 한다.
- 형식 감지 모듈의 결과가 불확실하거나 지원 형식이 아니면 plain text fallback을 사용한다.
- 새 viewer 의존성은 bundle 크기, 라이선스, 보안 업데이트 가능성을 검토한 뒤 추가한다.

## Downstream Concerns
- [ ] **ADR candidate — Viewer stack:** JSON·Markdown·code viewer와 format detection에 사용할 구체적인 라이브러리 조합과 의존성 기준을 확정해야 한다.
- [ ] **ADR candidate — Preview thresholds:** preview의 최대 문자 수·줄 수와 전체 보기의 UI 상태를 확정해야 한다.
- [ ] **ADR candidate — Supported format detection:** JSON/Markdown/code 판별 우선순위와 sanitizer 허용 목록을 확정해야 한다.
- [x] **directly resolved — Execution safety:** 저장된 content는 실행하지 않고 allowlist viewer 또는 escaped/sanitized read-only view로만 표시한다.
- [x] **covered — Content size bound:** AC-004의 저장 시 최대 본문 크기와 잘라내기 정책을 따른다.

## Related
- `spec/AC.md` — AC-028
- `adr/sensitive-data-retention.md`
- `adr/ui-framework-and-monitoring-structure.md`
- `adr/turn-summary-usage-projection.md`

## Notes
- 2026-03-10: AC-028 review를 위해 safe renderer·plain text·외부 renderer 선택지를 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 의견에 따라 외부 viewer 조합을 직접 renderer의 대안으로 구체화했다. 현재 프로젝트에는 viewer·format detection 의존성이 없음을 확인했다.
