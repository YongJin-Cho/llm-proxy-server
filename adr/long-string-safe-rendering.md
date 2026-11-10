# 긴 문자열 형식 표시와 안전한 전체 보기

## Concern
request/response의 긴 문자열을 어떻게 축약·확장하고, 자동 형식 감지 오류를 사용자가 교정할 수 있도록 Markdown·JSON·code/text를 안전하게 표시할 것인가?

## Status
approved

## Context
- traffic 상세에는 provider/client가 보낸 JSON과 긴 문자열이 포함될 수 있다.
- 현재 UI는 JSON을 직접 pretty-print하고 나머지 값은 `<pre>`로 표시한다. 별도 viewer, Markdown renderer, syntax highlighter, 형식 감지 모듈은 아직 없다.
- 긴 본문을 항상 펼치면 가독성과 성능이 떨어지고, 항상 자르면 debugging과 회귀 검증이 어려워진다.
- Markdown·JSON·JavaScript처럼 실행 또는 HTML 해석으로 이어질 수 있는 형식이 저장될 수 있다.
- UI는 저장된 traffic을 읽기 위한 도구이지 저장된 코드를 실행하는 환경이 아니다.
- 일반 문자열의 형식은 콘텐츠만으로 확정할 수 없으며 `highlight.js` auto-detection도 오인식할 수 있다.
- 자동 감지 결과를 고정하면 잘못된 viewer가 선택될 때 사용자가 내용을 읽기 어렵다. 따라서 viewer에서 사용자가 표시 형식을 다시 선택할 수 있어야 한다.
- 원본 JSON은 서버에 저장된 bounded content를 그대로 보존하고, 표시 형식과 사용자의 일시적 선택은 UI presentation 책임으로 둔다.

## Decision
**Option D — 전용 viewer + Monaco code fallback + 사용자 override**를 채택한다. JSON과 Markdown의 전용 가독성을 유지하고, code/text에는 read-only Monaco를 fallback으로 사용하며, 자동 감지 결과는 초기값으로만 취급하고 사용자가 표시 형식과 언어를 다시 선택할 수 있도록 한다.

## Options
### Option A — 형식별 외부 viewer 조합 + 감지 결과를 초기값으로 사용
- JSON은 read-only JSON tree viewer, Markdown은 sanitized Markdown viewer, code/text는 syntax viewer를 사용한다.
- JSON parse와 명시적 metadata를 우선하고, 필요한 경우 `highlight.js` auto-detection을 code language 후보로만 사용한다.
- 감지된 형식은 초기 표시값일 뿐이며 viewer의 형식 선택 메뉴에서 사용자가 JSON·Markdown·code/text 또는 지원 언어를 재선택할 수 있다.
- Pro: 형식별 가독성과 사용자 교정 경로를 모두 제공한다.
- Con: 여러 viewer의 보안 설정·bundle·API를 통합하고 유지해야 한다.

### Option B — `highlight.js` 감지 + read-only Monaco viewer
- `highlight.js`로 언어 후보를 감지하고, 후보를 Monaco language mode로 매핑해 하나의 read-only Monaco editor에서 표시한다.
- 사용자는 language/format selector에서 다른 Monaco language 또는 plain text를 선택할 수 있다.
- JSON·Markdown도 기본적으로 source/code 형태로 표시하며, tree 또는 rendered Markdown은 제공하지 않는다.
- Pro: 하나의 일관된 code viewer, 강한 탐색 UX, 명시적인 사용자 override를 제공한다.
- Con: Monaco bundle·초기화 비용이 크고, `highlight.js` 후보와 Monaco language 매핑이 불완전하며, JSON tree·Markdown rendered view의 가독성을 잃는다.

### Option C — 자동 감지 없이 사용자 선택 중심의 Monaco/plain-text viewer
- 기본값은 escaped plain text 또는 일반 code view로 두고 자동 언어 감지를 하지 않는다.
- 사용자가 직접 형식/language를 선택하면 read-only Monaco 또는 제한된 syntax viewer로 표시한다.
- Pro: 오인식으로 잘못된 형식을 강제하지 않고 동작을 예측하기 쉽다.
- Con: 처음 열었을 때의 가독성이 낮고, 매번 사용자가 선택해야 하며 JSON/Markdown 전용 표현을 활용하지 못한다.

### Option D — 전용 viewer + Monaco code fallback + 사용자 override
- JSON parse 성공 시 read-only JSON tree를 기본값으로, 명시적 Markdown hint 또는 제한된 Markdown 판별 시 sanitized Markdown viewer를 기본값으로 사용한다.
- 그 외 code/text는 `highlight.js` auto-detection을 사용해 Monaco의 초기 language mode를 정하되, 감지 실패·불확실·지원 불가 언어는 plain text로 표시한다.
- 사용자는 언제든지 `JSON tree`, `Markdown`, `Code`, `Plain text`와 code language를 다시 선택할 수 있다. 선택한 mode는 해당 viewer가 열려 있는 동안 유지하고 원본 content는 변경하지 않는다.
- Pro: JSON/Markdown의 운영 가독성을 보존하면서 code에는 Monaco의 탐색성과 사용자 교정 경로를 제공한다.
- Con: 전용 viewer와 Monaco를 함께 관리해야 하며, mode selector와 fallback 계약을 구현해야 한다.

## Tradeoffs
| | Option A — 형식별 조합 | Option B — 감지 + Monaco | Option C — 수동 선택 | Option D — 전용 viewer + Monaco |
|---|---|---|---|---|
| JSON 가독성 | 높음 | 중간; source 표시 | 중간 | 높음; tree 기본값 |
| Markdown 가독성 | 높음; rendered view | 낮음~중간; source 표시 | 낮음~중간 | 높음; sanitized rendered view |
| code 탐색 UX | 중간 | 높음 | 높음 | 높음 |
| 자동 감지 오인식 영향 | 사용자 override로 제한 | Monaco mode를 잘못 고를 수 있음 | 없음 | plain text fallback과 override로 제한 |
| 사용자 교정 | 제공 | 제공 | 필수 | 제공 |
| bundle·초기화 비용 | 중간 | 높음 | 중간~높음 | 높음 |
| 구현 복잡도 | 중간 | 중간 | 낮음~중간 | 높음 |
| 안전성 관리 | viewer별 allowlist 필요 | Monaco는 실행하지 않지만 Markdown/HTML 정책 별도 필요 | 가장 단순 | viewer별 allowlist + Monaco read-only 필요 |

## Recommendation
- **Option D — 전용 viewer + Monaco code fallback + 사용자 override**를 권장한다.
- `highlight.js`는 표시 권한이나 실행 여부를 결정하지 않고 초기 code language 후보를 만드는 보조 감지기로만 사용한다.
- JSON과 Markdown은 각각의 구조적 가독성이 운영 분석에 중요하므로 모든 형식을 Monaco source view로 통일하지 않는다.
- 사용자가 자동 감지를 신뢰하지 않아도 즉시 `Plain text` 또는 다른 형식으로 전환할 수 있어야 한다.
- Monaco는 반드시 read-only로 설정하고, language mode는 syntax 표시만 바꾸며 JavaScript 실행·HTML 해석·iframe·`eval`·`new Function`을 허용하지 않는다.

## Consequences
- `LogDetail`은 raw content를 직접 임의의 renderer에 넘기지 않고 공통 viewer adapter를 통해 표시한다.
- viewer adapter는 `detectedMode`, `selectedMode`, `fallbackReason`을 구분한다. 사용자가 선택한 mode는 자동 감지 결과보다 우선한다.
- 최소 사용자 선택지는 `Auto`, `JSON`, `Markdown`, `Code`, `Plain text`로 제공한다. Code 선택 시 지원 language 목록과 Monaco language mode를 선택할 수 있다.
- `Auto`의 우선순위는 명시적 content hint → JSON parse → 제한된 Markdown 판별 → `highlight.js` 후보 → plain text fallback이다.
- `highlight.js`가 반환한 언어 후보가 Monaco에서 지원되지 않거나 신뢰도가 낮으면 plain text로 표시하고, 사용자가 다른 language를 선택할 수 있게 한다.
- preview/전체 보기의 문자 수·줄 수 제한과 선택 mode 상태는 공통 adapter에서 관리한다. 전체 보기에서도 원본 bounded content는 변경하지 않는다.
- Markdown raw HTML은 기본적으로 렌더링하지 않거나 sanitizer allowlist를 통과한 경우에만 처리한다.
- JSON parse 실패, viewer 예외, 감지 실패는 escaped plain text로 복구한다.
- Monaco 도입 전 React 19 호환성, bundle 크기, worker 구성, 라이선스, 보안 업데이트 가능성을 lockfile 기준으로 확인한다.
- 이 ADR은 구체적인 패키지 버전과 preview threshold를 확정하지 않는다.

## Downstream Concerns
- [x] **ADR candidate → proposed — Viewer dependency selection:** `adr/viewer-dependency-selection.md`에서 `@uiw/react-json-view`, `react-markdown` 계열, Monaco wrapper, `highlight.js`의 조합과 검증 기준을 비교한다.
- [ ] **ADR candidate — Format mode contract:** `Auto`·JSON·Markdown·Code·Plain text와 language selector의 지원 범위, 선택 상태의 보존 범위를 어떻게 정의할 것인가?
- [ ] **ADR candidate — Preview thresholds:** preview의 최대 문자 수·줄 수와 전체 보기의 UI 상태를 확정해야 한다.
- [x] **directly resolved — Execution safety:** 저장된 content는 실행하지 않고 Monaco read-only, allowlist viewer 또는 escaped/sanitized view로만 표시한다.
- [x] **covered — Content size bound:** AC-004의 저장 시 최대 본문 크기와 잘라내기 정책을 따른다.

## Related
- `spec/AC.md` — AC-028
- `docs/turn-viewer-library-research.md`
- `adr/sensitive-data-retention.md`
- `adr/ui-framework-and-monitoring-structure.md`
- `adr/turn-summary-usage-projection.md`
- `adr/viewer-dependency-selection.md` — follow-up, proposed

## Notes
- 2026-03-10: AC-028 review를 위해 safe renderer·plain text·외부 renderer 선택지를 비교하는 proposed ADR을 작성했다.
- 2026-03-10: 사용자 의견에 따라 외부 viewer 조합을 직접 renderer의 대안으로 구체화했다. 현재 프로젝트에는 viewer·format detection 의존성이 없음을 확인했다.
- 2026-03-10: `highlight.js` 감지 후 Monaco read-only 표시와 viewer 내 사용자 형식 재선택 요구를 반영해 Option B~D를 추가하고 Option D를 권장했다. 감지 결과는 초기 표시 mode일 뿐이며 원본 content와 실행 권한을 변경하지 않는다.
- 2026-03-10: 사용자 go-ahead("D로 해줘")로 Status를 approved로 변경하고 Option D를 Decision으로 확정했다. viewer dependency selection, format mode contract, preview thresholds는 구현 전 별도 후속 쟁점으로 triage한다.
