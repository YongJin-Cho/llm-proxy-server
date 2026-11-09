# AGENTS.md — LLM Proxy Server

## Source of truth

- 구현과 검증의 기준은 `spec/llm-proxy-server.md`다.
- PRD, ASR, AC, ADR은 설계의 provenance이며, 구현 중 요구사항을 임의로 확장하거나 축소하지 않는다.
- Spec과 구현이 어긋나면 먼저 Spec/verification 기록을 확인하고, 요구사항 변경은 Spec 재승인 절차를 따른다.

## Current module map

- `src/server.ts`: Fastify bootstrap, configuration loading, listen/shutdown lifecycle, route registration 조립
- `src/ui/`: React page/component/data-query source와 UI styles
- `ui/index.html`: Vite build entry
- `vite.config.ts`: React/Vite build 설정; output은 `dist/ui/`
- `src/` 하위 예정 module:
  - configuration: runtime/config file 및 secret reference loading
  - api/routes: HTTP route/plugin과 API adapter
  - application: proxy orchestration 및 use case
  - domain: traffic log model, policy, ports
  - persistence: SQLite schema/migration와 writer/reader adapter
  - delivery: Fastify static UI delivery
- `scripts/verify.mjs`: provider mock 기반 통합 검증

## Source placement

- 모든 애플리케이션 TypeScript/TSX/CSS source는 `src/` 아래에 둔다.
- React source는 `src/ui/` 아래에 둔다.
- `ui/`에는 Vite가 요구하는 최소 entry(`index.html`)만 둔다. 빌드 산출물은 `dist/ui/`에 생성한다.
- `dist/`, `data/`, `node_modules/`는 generated/runtime output이며 source로 편집하지 않는다.

## Commands

- `npm run build`: React/Vite production build와 TypeScript server build
- `npm run build:ui`: React/Vite build만 실행
- `npm run verify`: build 후 mock provider 통합 검증 실행
- `npm run dev`: TypeScript server 개발 실행
- `npm start`: `dist/server.js` 실행

## Verification rules

- 변경 후 최소 `npm run build`를 실행한다.
- proxy, SSE, SQLite persistence/query, redaction, UI list/detail에 영향이 있으면 `npm run verify`를 실행한다.
- 검증 기준은 Spec의 R/C ID로 기록한다.
- 실패를 통과로 표시하지 않는다. partial/deviation은 `verification/llm-proxy-server.md`에 기록하고 다음 작업으로 carry-over한다.
- UI는 logs API를 통해서만 DB 데이터에 접근하며 DB driver를 bundle하지 않는다.

## Security and configuration

- API key와 secret reference 값은 로그·오류 응답·UI에 평문으로 기록하지 않는다.
- provider secret은 환경변수에서 로드한다.
- 기본 host는 `127.0.0.1`이며 외부 노출·인증·RBAC를 임의로 추가하지 않는다.

## Change discipline

- 승인된 sprint Scope 밖의 큰 변경은 조용히 포함하지 않는다.
- 구조 변경은 module map과 verification evidence를 함께 갱신한다.
- `AGENTS.md`는 실제 module map, source placement, 명령, 검증 규칙이 바뀔 때 같은 변경에서 갱신한다.
