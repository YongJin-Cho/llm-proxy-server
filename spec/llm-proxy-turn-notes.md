# Turn 완료 후 API별 분석 Note
- 완료된 turn의 저장 데이터를 API별 `TurnAnalysisAdapter`로 분석해 deterministic Markdown note로 저장하고, 운영자가 Turn view에서 분석 상태와 note 내용을 확인할 수 있게 한다.

## Context
- Turn 완료 후 Responses, OpenAI Chat Completions, Claude Messages의 request/response를 분석해 도구 사용 이력을 표시해야 한다.
- 기존 proxy adapter, turn grouping, traffic 저장 및 completed turn lifecycle은 note 분석과 독립적으로 보존해야 한다.
- 상위 요구사항: `spec/PRD.md`의 “Turn 완료 후 API별 분석 note” delta.

## Requirements
- R-001: Turn completion이 확정되면 proxy 요청 경로의 completion 성공을 먼저 보존하고, `TurnAnalysisService`가 완료 turn에 대한 비동기 note analysis job을 시작해야 한다. Note 분석 성공 여부는 completed turn 또는 child traffic의 lifecycle status를 변경하지 않아야 한다. ← ASR-035; AC-031; adr/turn-note-analysis-lifecycle.md
- R-002: `TurnAnalysisService`는 `TurnReader` port를 통해 완료된 turn과 분석에 필요한 child traffic의 API kind, request payload, 최종 response payload, sequence 및 관련 metadata를 읽고, persistence 구현이나 UI query가 아니라 service orchestration을 통해 분석을 시작해야 한다. ← ASR-034; AC-030; adr/turn-note-adapter-boundary.md
- R-003: `TurnAnalysisService`는 `api_kind`에 따라 Responses, Chat Completions, Claude Messages용 `TurnAnalysisAdapter`를 독립적으로 선택해야 한다. 각 adapter는 전달받은 turn data를 분석하고 공통 analysis result와 `TurnNote[]`를 반환해야 하며, 기존 proxy adapter의 forwarding·grouping·SSE lifecycle을 호출하거나 변경하지 않아야 한다. ← ASR-034; AC-029, AC-030
- R-004: 각 `TurnAnalysisAdapter`는 API별 request/response 표현에서 tool call, tool result/message, call identity, tool name, 관찰 순서와 결과 상태를 해석해 공통 semantic result를 만들고, 누락·매칭·다중 호출을 결정적으로 처리해야 한다. 분석 입력은 기존 API별 최종 response aggregate를 사용해야 한다. API별 위치는 Chat Completions의 `request.body.messages[].tool_calls`와 `role: tool` message, Responses의 `request.body.input[]` 내 `function_call`/`function_call_output`, Messages의 `request.body.messages[]` 내 assistant `tool_use`와 user `tool_result`를 사용한다. ← ASR-033; AC-029; adr/turn-note-semantic-contract.md
- R-005: Adapter는 공통 semantic result를 기반으로 deterministic한 `TurnNote[]`를 생성해야 한다. 각 note는 `title: string`과 `content: string`을 가지며 `content`는 Markdown 형식이어야 한다. 이번 기능은 새 LLM 호출을 통한 자연어 요약이 아니라 payload 기반 구조화 Markdown 생성만 수행해야 한다. 첫 번째 note는 모든 tool interaction을 `Sequence / Function / Parameters / Status` 열의 Markdown table로 표시한다. Sequence는 1부터 시작하는 관찰 순번, Function은 tool 이름, Parameters는 parameter key와 value를 표시하며 긴 문자열 value는 축약한다. Status는 오류가 있는 interaction에만 `Failed`를 표시하고 그 밖에는 빈 값으로 둔다. 오류는 API별 tool result payload의 JSON object에 `error` field가 존재할 때다. ← ASR-033; AC-029
- R-006: Note 저장 contract는 다음 projection을 제공해야 한다: `turn_id`, `analysis_version`, `status`, `notes_json`, `error_code`, bounded `error_message`, `retryable`, `attempt_count`, `updated_at`. `notes_json`은 turn의 `TurnNote[]` 배열을 담아야 하며 note 배열의 adapter 생성 순서를 보존해야 한다. ← ASR-036; AC-032; adr/turn-note-persistence-projection.md
- R-007: Note는 기존 turn/traffic 원본과 분리된 `turn_notes` projection에 저장해야 한다. turn당 동일 `turn_id`와 `analysis_version` 조합은 하나의 logical result로 취급하고, 분석 완료·재시도·중복 completion event는 upsert로 처리해 duplicate note가 생기지 않아야 한다. ← ASR-035, ASR-036; AC-031, AC-032
- R-008: Note projection status는 `pending`, `ready`, `empty`, `failed`만 canonical value로 사용해야 한다. 분석 성공 후 tool interaction이 없으면 `empty`와 빈 `TurnNote[]`를 저장하고, 성공적으로 note가 생성되면 `ready`와 note 배열을 저장해야 한다. ← ASR-035, ASR-037; AC-031, AC-033
- R-009: 분석 또는 note projection 조회가 실패하면 `failed` 상태와 `retryable`, safe `error_code`, secret을 포함하지 않는 bounded `error_message`, `attempt_count`, `updated_at`을 제공해야 한다. 원본 또는 projection을 읽을 수 없는 경우 `error_code: note_unavailable`을 사용할 수 있어야 한다. Note 실패는 completed turn·traffic 저장 성공에 전파되지 않아야 하며, 재시작 시 pending/retryable failed job을 복구할 수 있어야 한다. ← ASR-035, ASR-037; AC-031, AC-033; adr/turn-note-failure-observability.md
- R-010: 기존 turn query projection은 note projection을 조합해 note status와 `TurnNote[]`를 반환해야 한다. Note row가 없거나 note read가 실패해도 가능한 범위에서 기존 turn summary와 traffic tree를 반환하고 note 상태를 별도로 표현해야 한다. 기존 turn/traffic fields와 traffic detail contract는 보존해야 한다. ← ASR-036, ASR-037; AC-032, AC-033
- R-011: Turn view는 traffic usage summary table 바로 다음에 note가 존재하는 경우에만 note별 독립 card를 표시해야 한다. 각 card는 note의 title과 Markdown content를 렌더링하며 `Turn notes` 공통 title이나 projection status를 표시하지 않아야 한다. note 배열이 비어 있으면 card를 표시하지 않는다. Note card 표시 오류는 turn summary와 traffic table 표시를 막지 않아야 한다. ← ASR-038; AC-034
- R-012: Turn view note card는 이번 범위에서 수동 retry를 실행하지 않아야 하며, worker retry 결과를 재조회해 상태를 갱신해야 한다. Note content는 기존 safe Markdown renderer 정책으로 read-only 표시해야 한다. ← ASR-038; AC-034
- R-013: 통합 검증은 세 API의 대표적인 tool call/tool result payload, 다중 호출과 API별 payload 차이, 정상 completion 후 ready/empty, pending, duplicate completion, retryable failure, unavailable detail, process restart recovery, 기존 completed turn/traffic 보존, turn query projection, note card의 네 상태 표시를 독립 시나리오로 재현해야 한다. 추가로 tool history table의 열·순번·parameter 축약·오류별 `Failed` 표시와 note별 독립 card·빈 note 미표시를 검증해야 한다. ← PRD Delta Success Criteria; ASR-033~ASR-038

## Constraints
- C-001: API별 `TurnAnalysisAdapter`는 SQLite connection/table에 직접 접근하지 않아야 하며, turn data는 `TurnReader` port로, note 저장은 `TurnNoteWriter` port로 경유해야 한다. `TurnAnalysisService`가 adapter 선택과 lifecycle orchestration을 담당한다. ← ASR-034; AC-030
- C-002: 기존 proxy adapter의 API forwarding, provider routing, turn grouping, SSE final/partial aggregate, completed turn 저장 계약을 비관련 변경하지 않아야 한다. Note는 원본 request/response와 lifecycle data를 덮어쓰지 않는 별도 projection이어야 한다. ← PRD Delta Constraints; ASR-034, ASR-036
- C-003: 분석은 Responses, Chat Completions, Claude Messages의 API별 payload 차이를 adapter 내부에 캡슐화해야 하며 API 간 canonical payload 변환이나 새로운 provider 호출을 수행하지 않아야 한다. ← ASR-033; AC-029
- C-004: `analysis_version`은 note 생성 규칙의 schema/contract version이며 초기 구현은 하나의 version으로 시작한다. Version이 같은 `turn_id` 결과는 한 번만 존재해야 하고 규칙 변경 시 새 version을 사용해야 한다. ← ASR-035; adr/turn-note-analysis-lifecycle.md
- C-005: error code/message와 note Markdown은 API key, Authorization, cookie 등 secret 및 원본 민감정보를 의도하지 않게 노출하지 않아야 하며 기존 redaction·bounded error 정책을 따른다. ← ASR-037; AC-004, AC-033
- C-006: 이번 Spec은 제품 코드 구현, note 분석을 위한 LLM 호출, tool 품질 평가, 비용 예측, 실시간 streaming 중간 note, 과거 traffic 무제한 소급 재분석, note 검색·편집·댓글·공유, UI 수동 retry를 포함하지 않는다. ← PRD Delta Out of Scope; AC-029~AC-034
- C-007: tool result의 JSON object에 `error` field가 있을 때만 해당 interaction의 Status를 `Failed`로 표시하며, API별 call/result identity와 payload 위치를 adapter가 해석한다. ← Direct Input

## Out of Scope
- 제품 코드 구현 자체. 이 Spec은 후속 Backlog→Implementation sprint의 SSOT다.
- 새로운 LLM 호출 기반 자연어 요약 또는 tool quality evaluation.
- streaming 중간 note와 과거 traffic 무제한 재분석.
- note-level search, edit, comment, share 및 고급 분석 chart.

## Open Questions
- Durable analysis job record/queue의 구체적 구현과 retry 횟수·backoff·permanent failure taxonomy는 implementation planning에서 확정할 세부 설계다. 다만 pending/retryable failed 복구와 status contract는 본 Spec의 blocking requirement다.
- `TurnReader`가 제공하는 request/response projection의 세부 DTO field 목록은 implementation acceptance fixture에서 확정하되, API kind·request·final response·sequence·필요 metadata는 반드시 포함한다.

## Related
- `spec/PRD.md`
- `spec/AC.md` — AC-029~AC-034
- `spec/ASR.md` — ASR-033~ASR-038
- `adr/turn-note-semantic-contract.md`
- `adr/turn-note-adapter-boundary.md`
- `adr/turn-note-analysis-lifecycle.md`
- `adr/turn-note-persistence-projection.md`
- `adr/turn-note-failure-observability.md`
