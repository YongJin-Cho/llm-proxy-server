# Viewer 형식 모드 계약

## Concern
승인된 AC-028 Option D에서 `Auto`·`JSON`·`Markdown`·`Code`·`Plain text` 모드와 code language selector의 지원 범위 및 사용자 선택 상태를 어디까지 보존할 것인가?

## Status
approved

## Context
- AC-028은 자동 감지 결과를 초기값으로만 사용하고 사용자가 표시 형식과 code language를 재선택할 수 있도록 요구한다.
- viewer dependency selection은 JSON tree, sanitized Markdown, read-only Monaco, `highlight.js` 조합을 승인했다.
- 모드 계약이 없으면 viewer마다 지원 형식·fallback·선택 상태가 달라지고, 사용자가 자동 감지를 교정한 결과가 예기치 않게 사라지거나 다른 traffic에 잘못 적용될 수 있다.
- 원본 content는 변경하지 않아야 하며, 사용자 선택은 presentation 상태로만 관리해야 한다.

## Decision
**Option A — 제한된 지원 목록 + viewer 인스턴스 범위 보존**을 채택한다. 공통 mode는 `Auto`, `JSON`, `Markdown`, `Code`, `Plain text`로 제한하고, Code language는 검증된 curated 목록만 제공한다. 사용자의 mode/language 선택은 현재 viewer 인스턴스의 field별 presentation 상태로만 유지하며 traffic 변경·viewer 닫기·새로고침 시 `Auto`로 초기화한다.

## Options
### Option A — 제한된 지원 목록 + viewer 인스턴스 범위 보존
- 모드는 `Auto`, `JSON`, `Markdown`, `Code`, `Plain text`로 고정하고, Code language는 검증된 curated 목록만 노출한다.
- 지원 후보는 JSON, Markdown, JavaScript/TypeScript, Python, Bash/Shell, SQL, YAML, XML/HTML, CSS, Plain text이며, 미지원 언어는 Plain text로 fallback한다.
- 사용자가 선택한 mode/language는 현재 viewer 인스턴스가 열려 있는 동안 content field별로 보존하고, traffic 변경·viewer 닫기·새로고침 시 Auto로 초기화한다.
- Pro: 동작 범위와 보안 경계를 예측할 수 있고 stale preference·localStorage 노출을 피한다.
- Con: 같은 traffic을 다시 열 때 사용자의 교정 선택이 유지되지 않는다.

### Option B — stable traffic/field별 로컬 preference 보존
- Option A의 모드·언어 목록을 사용하되, `trafficId + field`를 key로 하여 사용자의 마지막 선택을 localStorage에 보존한다.
- 저장된 선택이 현재 content와 호환되지 않으면 Auto로 무시하고 제거한다.
- Pro: 반복적으로 확인하는 traffic의 표시 형식 교정이 유지된다.
- Con: 오래된 preference 정리, 브라우저 간 불일치, shared workstation에서 presentation 선택이 남는 문제를 관리해야 한다.

### Option C — Monaco language 전체 노출 + 전역 preference
- `Auto`, JSON, Markdown, Code, Plain text를 제공하고 Monaco가 지원하는 전체 language 목록을 selector에 노출한다.
- 마지막 mode/language를 전역 UI preference로 저장해 다음 traffic에도 기본값으로 사용한다.
- Pro: 전문 사용자가 임의 code 형식을 즉시 선택할 수 있고 반복 선택이 줄어든다.
- Con: language 목록이 과도하고 content와 맞지 않는 mode가 쉽게 적용되며, 전역 선택이 다른 traffic의 가독성을 해칠 수 있다.

## Tradeoffs
| | Option A — 인스턴스 보존 | Option B — traffic/field preference | Option C — 전체 목록·전역 preference |
|---|---|---|---|
| 지원 범위 예측 가능성 | 높음 | 높음 | 낮음 |
| 사용자 교정의 지속성 | viewer open 동안 | traffic 재방문까지 | 모든 traffic에 영향 |
| stale state 위험 | 낮음 | 중간 | 높음 |
| 구현·테스트 복잡도 | 낮음 | 중간 | 중간 |
| shared workstation 안전성 | 높음 | 중간 | 낮음 |
| 전문 사용자 유연성 | 중간 | 중간 | 높음 |
| AC-028 fallback 명확성 | 높음 | 높음 | 낮음 |

## Recommendation
- **Option A — 제한된 지원 목록 + viewer 인스턴스 범위 보존**을 권장한다.
- 저장된 traffic content는 여러 사용자나 서로 다른 시점에 재사용될 수 있으므로 presentation 선택을 영구 저장하거나 전역 적용하지 않고, 현재 열려 있는 viewer 안에서만 유지하는 편이 안전하고 예측 가능하다.
- 지원 목록은 실제 Monaco language mapping과 viewer adapter 검증을 통과한 언어만 포함하고, 목록 밖 선택은 Plain text로 fallback한다.

## Consequences
- 공통 viewer adapter의 public mode contract는 `auto | json | markdown | code | plain-text`로 제한한다.
- `Auto`는 parent ADR의 우선순위(content hint → JSON parse → 제한된 Markdown 판별 → `highlight.js` 후보 → plain text fallback)를 따른다.
- 명시적 JSON/Markdown 선택이 parse 또는 sanitizer 조건을 만족하지 못하면 원본을 변경하지 않고 plain text 또는 code fallback으로 표시하며 fallback reason을 남긴다.
- Code mode의 language 선택은 curated 목록에서만 가능하고, language mode는 syntax 표시만 바꾸며 실행 권한을 부여하지 않는다.
- 선택 상태는 현재 detail viewer의 request/response/error 등 field별로 유지한다. traffic을 바꾸거나 viewer를 닫으면 초기화하며 서버·URL·localStorage에는 저장하지 않는다.
- 향후 사용자별 preference가 필요해지면 별도 ADR에서 storage scope와 privacy를 다시 결정한다.

## Downstream Concerns
- [x] **covered — Dependency stack:** `adr/viewer-dependency-selection.md`의 approved Option A를 따른다.
- [ ] **ADR candidate — Preview thresholds:** preview의 문자 수·줄 수, 전체 보기 전환, large content 성능 기준을 별도 결정한다.
- [x] **directly resolved — Cross-tab persistence:** 현재는 localStorage·URL·서버에 모드 선택을 저장하지 않는다. 재방문 보존 요구가 생기면 재검토한다.

## Related
- `adr/long-string-safe-rendering.md` — parent ADR, approved Option D
- `adr/viewer-dependency-selection.md` — approved Option A
- `spec/AC.md` — AC-028

## Notes
- 2026-03-10: 부모 ADR의 downstream concern으로 format mode contract를 proposed 상태로 작성했다. 지원 모드·언어 목록과 선택 상태 보존 범위의 세 가지 대안을 비교했다.
- 2026-03-10: 사용자 go-ahead("ok")로 Option A를 채택하고 Status를 approved로 변경했다. mode 선택은 viewer 인스턴스 범위에 한정하며, URL·서버·localStorage에는 저장하지 않는다.
