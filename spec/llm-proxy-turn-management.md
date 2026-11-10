# Turn 관리·분석 UI

기존 turn/traffic tree와 선택·상세 조회 기능 위에 운영자가 turn을 관리하고 traffic 내용을 안전하게 분석할 수 있는 요구사항을 정의한다. 이 문서는 Sprint 12의 turn 관리·분석 delta에 대한 구현·검증 SSOT이며, 기존 grouping·tree·selection 계약은 `spec/llm-proxy-turn-traffic.md`와 함께 적용한다.

## Context
- 운영자는 turn 제목·flag·상태와 전체/flagged 탐색을 사용해 분석 대상 turn을 관리해야 한다.
- turn 삭제는 관리 메타데이터와 child traffic의 저장 일관성을 보장해야 한다.
- turn summary와 traffic usage/cost는 서버 projection 규칙으로 일관되게 계산해야 한다.
- request/response/error content는 JSON·Markdown·code/text의 가독성을 제공하면서 저장된 데이터를 실행하지 않아야 한다.
- Product requirements: `spec/PRD.md`의 `Delta: Turn 관리·분석 UI`
- Consolidated decisions: `spec/ASR.md`의 ASR-028~ASR-031

## Requirements

- R-001: Turn과 traffic은 사용자 지정 `title`과 `flag` 같은 관리 메타데이터를 request/response JSON 및 lifecycle 원본과 분리해 영구 저장해야 한다. 관리 메타데이터 변경은 원본 본문을 변경하지 않아야 한다. ← ASR-028; AC-025; `adr/turn-management-metadata-and-deletion.md`
- R-002: 삭제 API와 UI는 turn 단위 삭제만 제공해야 한다. Turn 삭제는 해당 turn row와 모든 child traffic을 하나의 transaction에서 물리 삭제해야 하며, traffic 단독 삭제·논리 삭제·복원·삭제 이력은 제공하지 않아야 한다. ← ASR-028; AC-025; `adr/turn-management-metadata-and-deletion.md`
- R-003: `GET /api/v1/turns`는 `all`과 `flagged` 필터를 서버에서 적용하고, 필터 적용 후 top-level turn node 기준으로 `total`, `page`, `limit`, `has_next`를 계산해야 한다. Child traffic은 parent turn 안에 반환하며 child 자체는 pagination하지 않아야 한다. ← ASR-029; AC-026; `adr/turn-filter-pagination-contract.md`
- R-004: flag 변경 또는 turn 삭제 성공 후 UI는 현재 filter·page query를 재조회해야 한다. 결과 page가 비면 마지막 유효 page로 보정해야 한다. ← ASR-029; AC-026; `adr/turn-filter-pagination-contract.md`
- R-005: Server query service는 turn summary DTO를 생성해야 한다. 시작 user input은 첫 traffic에서, 종료 AI output은 마지막 completed traffic에서 선택하고, 모델·실행 환경·상태·traffic 개수·처리 시간을 함께 제공해야 한다. ← ASR-030; AC-027; `adr/turn-summary-usage-projection.md`
- R-006: Usage와 cost는 child traffic의 non-null 값을 서버에서 합산해야 한다. 값이 하나도 없으면 `null`, 일부 traffic에만 있으면 partial 상태를 반환해야 하며, UI는 계산 규칙을 재구현하거나 provider가 보고하지 않은 cost를 추정하지 않아야 한다. ← ASR-030; AC-027; `adr/usage-and-cost-metadata.md`; `adr/turn-summary-usage-projection.md`
- R-007: 공통 viewer adapter는 request/response 전체 content를 하나의 viewer 형식으로 감지하지 않아야 한다. JSON parse에 성공한 request/response는 read-only JSON object/array tree container로 표시하고, object/array/number/boolean/null은 tree 탐색 대상으로 유지하며 문자열 leaf만 별도 viewer의 입력으로 취급해야 한다. JSON parse에 실패한 request/response는 안전한 escaped plain text fallback으로 표시해야 한다. Viewer dependency 조합은 `@uiw/react-json-view`, `react-markdown` + `remark-gfm` + `rehype-sanitize`, `@monaco-editor/react`, `highlight.js`를 우선 검증 대상으로 사용해야 하며 실제 버전은 설치 검증 후 lockfile에 고정한다. ← ASR-031; AC-028; `adr/long-string-safe-rendering.md`; `adr/viewer-dependency-selection.md`
- R-008: JSON tree 안의 문자열 leaf는 기본적으로 축약 preview로 표시해야 한다. 사용자가 문자열의 전체 보기/확대를 요청하면 inline content를 펼치지 않고 해당 문자열만 popup viewer window/dialog에서 표시해야 한다. Auto detection 순서는 선택된 문자열 값에 대해 content hint → JSON parse → 제한된 Markdown 판별 → `highlight.js` language 후보 → escaped plain text fallback이어야 한다. Detection은 초기 표시 후보일 뿐 viewer 선택이나 실행 권한을 결정하지 않아야 하며, 감지 실패·불확실·지원 불가 언어·viewer 예외는 안전한 plain text fallback으로 복구해야 한다. ← ASR-031; AC-028; `adr/long-string-safe-rendering.md`
- R-009: Popup viewer에서 사용자는 `Auto`, `JSON`, `Markdown`, `Code`, `Plain text`를 선택할 수 있어야 한다. Code language는 검증된 curated 목록만 노출하고 목록 밖 선택은 plain text로 fallback해야 한다. 사용자 mode/language 선택은 현재 request/response field의 문자열 leaf viewer instance에만 유지하며 다른 문자열 선택·traffic 변경·viewer 닫기·새로고침 시 `Auto`로 초기화해야 한다. URL·서버·localStorage에는 저장하지 않아야 한다. ← ASR-031; AC-028; `adr/format-mode-contract.md`
- R-010: request/response JSON 안의 각 문자열 값이 1 MiB(1,048,576 UTF-8 bytes) 이하이면 별도 문자 수·줄 수 truncation 없이 popup viewer에서 bounded content 전문을 제공해야 한다. JSON tree의 inline preview와 popup 전체 보기는 표시 상태일 뿐 원본 JSON을 변경하지 않아야 한다. 1 MiB 초과분은 AC-004의 저장 크기 제한에서 처리한다. ← ASR-031; AC-028; Direct Input
- R-011: Popup viewer의 Markdown raw HTML은 기본적으로 렌더링하지 않거나 sanitizer allowlist를 통과한 경우에만 처리해야 한다. 모든 viewer는 read-only여야 하며 JavaScript 실행, HTML 실행, iframe, `eval`, `new Function`, dynamic import를 허용하지 않아야 한다. Monaco language mode는 선택된 문자열의 syntax 표시만 변경해야 한다. ← ASR-031; AC-028; `adr/long-string-safe-rendering.md`
- R-012: Viewer component는 raw request/response content를 임의 renderer에 직접 전달하지 않고 JSON tree adapter와 문자열 popup viewer adapter를 통해 표시해야 한다. Adapter는 `detectedMode`, `selectedMode`, `fallbackReason`을 구분하고 사용자 선택을 자동 감지 결과보다 우선해야 한다. Popup close는 기존 JSON tree 위치로 복귀시키며 원본 request/response와 문자열 값을 수정하지 않아야 한다. ← ASR-031; AC-028; `adr/long-string-safe-rendering.md`

## Constraints

- C-001: 기존 `/api/v1` namespace, SQLite writer/reader 경계, secret redaction, bounded body 정책과 기존 turn/traffic grouping·tree·URL selection 계약을 유지해야 한다. ← PRD Delta Constraints; ASR-025; ASR-027
- C-002: 기존 traffic schema/data를 turn 관리 기능 때문에 소급 grouping하거나 임의 migration하지 않아야 한다. turn metadata가 없는 legacy traffic의 표시 규칙은 기존 turn traffic Spec의 legacy compatibility 계약을 따른다. ← ASR-026; AC-022; `adr/legacy-traffic-tree-compatibility.md`
- C-003: Turn 관리 메타데이터 저장·flag/filter/query 변경은 API application service와 UI data-query 경계를 통해 수행해야 하며 UI component가 DB driver나 SQLite table에 직접 접근하지 않아야 한다. ← ASR-014; AC-012; `adr/api-log-write-ui-read-boundary.md`
- C-004: 신규 viewer 의존성은 React 19 호환성, production bundle 증가량, Monaco worker 구성, license, 최근 security advisory, read-only·raw HTML 정책을 설치 전에 검증해야 한다. 검증 실패 시 package stack을 재선택하고 이 Spec을 갱신한 뒤 재승인해야 한다. ← ASR-031; `adr/viewer-dependency-selection.md`
- C-005: 저장된 content는 bounded content로 취급한다. Viewer는 저장 한도를 우회해 원본 외부 데이터를 가져오거나 content를 서버에 재저장하지 않아야 한다. ← AC-004; ASR-004; ASR-031

## Out of Scope

- 제품 코드 구현 자체는 이 Spec→backlog sprint에서 수행하지 않는다.
- 기존 traffic의 소급 turn grouping 또는 legacy traffic 간 과거 turn 관계 추론
- traffic 단독 삭제, 논리 삭제, 복원, 삭제 이력
- 사용자·조직별 인증·권한, 다중 사용자 공유와 cross-tab preference 동기화
- 자동 요약 생성, LLM 기반 형식 분류, 고급 분석 차트·알림·과금 기능
- 실시간 streaming transcript UI와 event-level 영구 저장
- preview threshold를 초과한 content를 viewer에서 임의로 추가 복구하거나 재요청하는 기능

## Open Questions

- 실제 package 버전과 lockfile 조합은 구현 전 설치 검증에서 확정한다. React 19 호환성·bundle·worker·license·security 검증에 실패하면 구현 전에 Spec을 갱신하고 재승인한다.

## Related

- `spec/PRD.md`
- `spec/ASR.md`
- `spec/llm-proxy-turn-traffic.md`
- `adr/turn-management-metadata-and-deletion.md`
- `adr/turn-filter-pagination-contract.md`
- `adr/turn-summary-usage-projection.md`
- `adr/long-string-safe-rendering.md`
- `adr/viewer-dependency-selection.md`
- `adr/format-mode-contract.md`
