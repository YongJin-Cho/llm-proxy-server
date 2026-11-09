# LLM Proxy Server

단일 프로세스로 실행되는 localhost LLM Proxy입니다. Fastify API/server와 React monitoring UI가 하나의 프로세스에서 동작합니다.

## 실행

### config.json과 secret 환경변수

모든 runtime 설정은 프로젝트 루트의 `config.json`에서 로드합니다. 기본 파일은 host, port, SQLite 경로, body size limit, provider endpoint, model routing, provider auth mode를 정의합니다. API key 값 자체는 파일에 저장하지 않으며, provider의 `apiKeyEnv`가 지정한 process environment 변수에서만 읽습니다.

```bash
npm install
export OPENROUTER_API_KEY=sk-...
npm run build
npm start
```

기본 `config.json`은 다음과 같습니다.

```json
{
  "host": "127.0.0.1",
  "port": 8888,
  "databasePath": "./data/traffic.db",
  "maxBodyBytes": 65536,
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKeyEnv": "OPENROUTER_API_KEY",
      "authMode": "bearer"
    }
  },
  "models": {
    "gpt-6-luna": {
      "provider": "openrouter",
      "providerModel": "openai/gpt-6-luna"
    }
  }
}
```

서버는 시작 전에 필수 설정, provider/model 참조, secret 존재 여부를 검증합니다. 설정 오류나 SQLite migration 실패가 있으면 listen하지 않습니다. 등록되지 않은 model은 Provider 호출 전에 400 오류로 거부합니다. `.env`, `PROVIDER_URL`, `PROVIDER_API_KEY`는 사용하지 않습니다.

## API

- `POST /api/v1/responses`: Provider의 `baseUrl/responses`로 요청 전달
- `POST /api/v1/chat/completions`: Provider의 `baseUrl/chat/completions`로 요청 전달
- `POST /api/v1/messages`: Provider의 `baseUrl/messages`로 요청 전달
- `GET /api/v1/logs`: 최신순 로그 목록 (`status`, `model`, `from`, `to`, `limit`, `offset` 지원)
- `GET /api/v1/logs/:id`: 로그 상세 조회

Authorization, API 키, Cookie 계열 헤더는 `[REDACTED]`로 저장됩니다. 요청·응답 본문은 `config.json`의 `maxBodyBytes`를 넘지 않도록 제한됩니다.

## 검증

```bash
npm run build
npm run verify
```

`verify`는 임시 `config.json`과 process environment secret을 사용해 UI entrypoint, 세 API route와 provider path mapping, usage/cost normalization, `api_kind` persistence, provider model mapping, unknown model rejection, secret redaction, SQLite read/write boundary를 재현합니다.

## UI 구조

React UI는 기능별 책임을 분리해 확장할 수 있도록 구성되어 있습니다.

- `src/ui/data-query/`: `/api/v1/logs`와 `/api/v1/logs/:id` HTTP 조회 및 오류 변환
- `src/ui/pages/`: 화면 상태, 필터·pagination·상세 이동 조합
- `src/ui/components/`: `Filters`, `LogTable`, `LogDetail` 등 API에 직접 의존하지 않는 표시·입력 컴포넌트
- `src/ui/types.ts`: UI 공통 view-model과 filter 타입
- `src/ui/main.tsx`: 선택한 page를 React root에 연결하는 bootstrap

새로운 analysis/report/chart 기능은 별도 page 또는 feature module로 추가합니다. 기존 `TrafficPage`와 `main.tsx`에 기능별 조회·상태를 누적하지 않아 기존 traffic 화면과 독립적으로 확장할 수 있습니다.
