# Viewer 의존성 선택

## Concern
승인된 AC-028 Option D를 구현하기 위해 JSON tree, sanitized Markdown, read-only Monaco code viewer와 형식 감지에 사용할 실제 의존성 조합을 어떻게 선택할 것인가?

## Status
approved

## Context
- AC-028은 JSON 전용 viewer, sanitized Markdown viewer, read-only Monaco code fallback, `highlight.js` 기반 초기 언어 후보와 사용자 override를 요구한다.
- 현재 UI는 React 19 + Vite 6이며 viewer, Markdown renderer, syntax highlighter, Monaco wrapper, format detection 패키지가 설치되어 있지 않다.
- 현재 `package-lock.json`에는 기존 서버·React 의존성만 있으며 신규 후보의 실제 버전·transitive dependency·bundle 크기는 설치 전 검증해야 한다.
- 잘못된 조합은 React 19 호환성 문제, 초기 bundle 증가, worker 설정 실패, raw HTML/XSS 경계 누락 또는 유지보수 비용을 만들 수 있다.

## Decision
**Option A — 형식별 전문 viewer 조합**을 채택한다. JSON은 `@uiw/react-json-view`, Markdown은 `react-markdown` + `remark-gfm` + `rehype-sanitize`, code는 `@monaco-editor/react`, 감지는 `highlight.js`를 우선 검증 대상으로 삼고, 각 viewer는 공통 read-only adapter 뒤에 둔다. 실제 버전은 설치 검증 후 lockfile에 고정한다.

## Options
### Option A — 형식별 전문 viewer 조합
- JSON은 `@uiw/react-json-view`, Markdown은 `react-markdown` + `remark-gfm` + `rehype-sanitize`, code는 `@monaco-editor/react`, 감지는 `highlight.js`를 사용한다.
- 각 viewer는 read-only adapter 뒤에 숨기고 Monaco worker는 필요한 시점에만 로드한다.
- Pro: 승인된 Option D와 직접 일치하며 JSON tree·Markdown rendered view·code 탐색 UX를 각각 보존한다.
- Con: 여러 패키지의 React 19 호환성, bundle·worker 설정, 보안 정책을 함께 관리해야 한다.

### Option B — JSON viewer 후보를 `react-json-view`로 통일
- Markdown·Monaco·`highlight.js`는 Option A와 동일하게 사용하고 JSON tree만 `react-json-view`로 선택한다.
- Pro: 성숙한 JSON tree interaction과 널리 알려진 API를 활용할 수 있다.
- Con: React 19 호환성, 유지보수 상태, read-only 보장과 bundle 비용을 별도로 검증해야 하며 현재 조사상 우선 후보보다 불확실성이 크다.

### Option C — JSON tree를 직접 구현하고 외부 의존성을 최소화
- JSON tree는 프로젝트 내부의 read-only React component로 구현하고 Markdown·Monaco·`highlight.js`만 외부 패키지로 사용한다.
- Pro: JSON 표시 계약과 bundle을 직접 통제하고 추가 JSON viewer의 유지보수 리스크를 줄인다.
- Con: 접기/펼치기, 깊은 구조, 큰 객체 성능, 키/값 표시 접근성을 직접 설계·검증해야 하므로 구현 범위와 회귀 위험이 커진다.

## Tradeoffs
| | Option A — `@uiw/react-json-view` | Option B — `react-json-view` | Option C — 자체 JSON tree |
|---|---|---|---|
| AC-028 적합성 | 높음 | 높음 | 높음 |
| JSON UX 구현 비용 | 낮음 | 낮음 | 높음 |
| React 19 검증 위험 | 신규 검증 필요 | 신규 검증 필요, 더 불확실 | React 내부 API만 사용 |
| bundle·transitive dependency | 중간~높음 | 중간~높음 | JSON 부분은 낮음 |
| 유지보수 책임 | 외부 API·업데이트 추적 | 외부 API·업데이트 추적 | 프로젝트가 기능·접근성·성능을 직접 책임 |
| 빠른 구현 | 높음 | 높음 | 낮음 |
| read-only 정책 통제 | adapter 설정과 회귀 테스트 필요 | adapter 설정과 회귀 테스트 필요 | 직접 통제 가능 |

## Recommendation
- **Option A — 형식별 전문 viewer 조합**을 권장한다.
- 승인된 Option D의 사용자 경험을 가장 적은 자체 UI 구현으로 충족하고, JSON tree와 Markdown rendered view를 code editor의 책임과 분리할 수 있다.
- 실제 채택 전에는 후보 패키지를 설치한 뒤 React 19 호환성, production bundle 증가량, Monaco worker 동작, license, 최근 보안 권고, read-only·raw HTML 정책을 검증한다.
- 신규 버전은 범위 지정만으로 확정하지 않고 `package-lock.json`에 재현 가능한 버전으로 기록한다. 검증 실패 시 Option B 또는 C로 전환을 검토한다.

## Consequences
- 공통 viewer adapter가 JSON/Markdown/Code/Plain text mode와 fallback을 소유하며 component별 API가 도메인 모델로 새지 않게 한다.
- Markdown은 `rehype-raw`를 기본 도입하지 않고, raw HTML은 무시하거나 명시적인 sanitizer allowlist를 통과한 경우에만 처리한다.
- Monaco는 read-only와 허용된 language mode만 사용하며 worker·bundle은 lazy loading을 우선한다.
- `highlight.js`는 표시 언어 후보만 제공하고 viewer 선택이나 실행 권한을 결정하지 않는다.
- 실제 package 설치와 버전 확정은 이 ADR 승인 후 구현 전 검증 작업으로 남긴다.

## Downstream Concerns
- [x] **deferred assumption — Exact package versions:** 신규 패키지의 정확한 버전은 승인 후 설치 검증과 lockfile 갱신 시 확정한다. React 19 호환성·bundle·license·security 검증 실패 시 재검토한다.
- [x] **covered — Rendering safety:** raw HTML·실행·iframe 정책은 `adr/long-string-safe-rendering.md`와 AC-028이 규정한다.
- [x] **out of scope — Preview thresholds:** 별도 `preview-thresholds` 후속 ADR에서 결정한다.

## Related
- `adr/long-string-safe-rendering.md` — parent ADR, approved Option D
- `spec/AC.md` — AC-028
- `package.json`
- `package-lock.json`

## Notes
- 2026-03-10: AC-028 Option D 승인 후 viewer dependency selection 후속 ADR을 proposed 상태로 작성했다. 현재 React 19 + Vite 6 프로젝트와 기존 lockfile을 기준으로 전문 viewer 조합, 대체 JSON viewer, 자체 JSON tree를 비교했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 채택하고 Status를 approved로 변경했다. 정확한 패키지 버전은 설치·호환성·bundle·license·security 검증 후 lockfile에 고정한다.
