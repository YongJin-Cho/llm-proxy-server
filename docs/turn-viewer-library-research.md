# Turn viewer 라이브러리 후보 조사

## 조사 범위

현재 React 19 + Vite UI에서 traffic request/response를 read-only로 표시하기 위한 후보를 비교했다. 현재 프로젝트에는 viewer, Markdown renderer, syntax highlighter, format detection 의존성이 없으며 `LogDetail.tsx`는 JSON pretty-print와 `<pre>`만 사용한다.

이 문서는 라이브러리를 아직 설치하거나 채택하지 않은 조사 기록이다. 실제 도입 전에는 현재 버전의 React 19 호환성, 패키지 maintainer 상태, 보안 권고, 라이선스와 bundle 크기를 lockfile 기준으로 재검증해야 한다.

## 결론 요약

단일 viewer가 JSON·Markdown·임의 code·format detection을 모두 안전하게 처리하는 것으로 가정하지 않는다. 다음과 같은 **형식별 조합**이 현실적이다.

1. JSON: read-only JSON tree viewer 후보
2. Markdown: `react-markdown` 계열 + GFM 확장 + sanitizer 정책
3. code/text: React element를 생성하는 syntax highlighter 후보
4. 감지: JSON parse 우선, 명시적 hint 다음, heuristic/auto-detection은 표시 선택에만 사용
5. 공통: preview/전체 보기와 plain-text fallback을 viewer adapter에서 통일

## 후보 비교

| 영역 | 후보 | 장점 | 주의점 | 현재 판단 |
|---|---|---|---|---|
| Markdown | `react-markdown` + `remark-gfm` + `rehype-sanitize` | React tree 기반, Markdown/GFM 확장, raw HTML을 기본적으로 경계화 가능 | raw HTML 허용 시 `rehype-raw`와 sanitizer 조합을 엄격히 검토해야 함 | 유력 후보 |
| JSON | `@uiw/react-json-view` | React read-only tree 표시, 접기/펼치기 UX 후보 | React 19 호환성과 bundle/API를 도입 전에 확인해야 함 | 유력 후보 |
| JSON | `react-json-view` | 성숙한 JSON tree UX 후보 | React 버전·유지보수 상태와 read-only 설정을 확인해야 함 | 대안 후보 |
| code | `react-syntax-highlighter` | React component로 syntax highlighting, Prism/hljs 계열 선택 가능 | 언어별 bundle 크기와 auto-detection 오인식 가능성 | 유력 후보 |
| code | `shiki` | 고품질 토큰화와 다양한 언어/theme | SSR/worker·bundle·언어 로딩 구조가 더 무거울 수 있고 형식 감지는 별도 | 품질 우선 대안 |
| 감지 | `highlight.js` auto-detection | 여러 code language 후보를 추정 가능 | Markdown/일반 text를 잘못 code로 판단할 수 있고 결과를 신뢰하면 안 됨 | 보조 수단만 |
| 감지 | MIME/확장자 기반 모듈 | 명시적 content type이 있으면 단순하고 예측 가능 | 현재 저장된 본문에는 신뢰할 extension/MIME이 없을 수 있음 | hint가 있을 때만 |
| 통합 editor | CodeMirror/Monaco 계열 | 풍부한 code 탐색 기능 | 편집기이며 이번 read-only viewer 범위와 bundle이 과함 | 제외 후보 |

## 형식 감지 판단

일반 텍스트의 형식을 완전히 신뢰성 있게 판별하는 모듈은 기대하지 않는다.

권장 우선순위:

1. 저장 metadata에 명시된 content type 또는 API kind가 있으면 사용한다.
2. 전체 문자열을 JSON parse할 수 있으면 JSON viewer를 선택한다.
3. 명시적인 Markdown hint가 있거나 제한된 Markdown heuristic을 만족할 때만 Markdown viewer를 선택한다.
4. code language hint가 있으면 해당 syntax highlighter를 선택한다.
5. hint가 없고 code로 보이는 경우 auto-detection은 syntax 표시의 후보로만 사용한다.
6. 확신할 수 없으면 escaped plain text를 사용한다.

감지 결과는 렌더러 선택을 위한 힌트일 뿐이며 다음을 절대 결정하지 않는다.

- HTML 해석 허용
- JavaScript 실행
- iframe 실행
- `eval`, `new Function`, dynamic import

## 보안·운영 기준

- viewer는 read-only여야 한다.
- Markdown raw HTML은 기본적으로 무시하거나 sanitizer allowlist를 거친다.
- React의 text/element rendering을 사용하고 arbitrary HTML injection을 피한다.
- syntax highlighter가 HTML string을 생성하는 경우 React에 삽입하기 전 escape 경계를 확인한다.
- JSON parse 실패와 viewer 오류는 plain text fallback으로 복구한다.
- preview 길이·줄 수 제한과 전체 보기 상태는 viewer별로 구현하지 않고 공통 adapter에서 관리한다.
- 언어별 bundle을 필요할 때만 로드해 초기 UI payload를 제한한다.
- 패키지별 LICENSE, transitive dependency, 최근 보안 공지, React 19 호환성을 설치 전에 검증한다.

## 추천 후보 조합

초기 후보 조합은 다음과 같다.

- Markdown: `react-markdown` + `remark-gfm` + 제한된 `rehype-sanitize`
- JSON: `@uiw/react-json-view`를 1순위 검토, `react-json-view`를 대안 검토
- code: `react-syntax-highlighter`를 1순위 검토, 품질·언어 범위가 더 중요하면 `shiki` 검토
- detection: JSON parse + 명시적 hint 우선, 필요한 경우 `highlight.js` auto-detection을 보조적으로 사용
- fallback: escaped `<pre>`

이는 최종 채택이 아니라 AC-028 ADR의 **Viewer stack** downstream concern을 구체화한 후보 목록이다.

## 미결정

1. JSON viewer 후보 중 React 19·bundle·API를 실제 dependency metadata로 확인할 것인가?
2. Markdown raw HTML을 완전히 비활성화할지 sanitizer allowlist를 둘 것인가?
3. code highlighter에서 자동 언어 감지를 허용할지, 명시적 hint와 plain text fallback만 사용할 것인가?
4. 후보 조합을 채택할 경우 preview threshold와 지원 형식 우선순위를 별도 결정할 것인가?
