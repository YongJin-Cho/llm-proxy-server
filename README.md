# LLM Proxy Server

단일 프로세스로 실행되는 localhost LLM Proxy입니다. Fastify API/server와 React monitoring UI가 하나의 프로세스에서 동작합니다.

## 실행

### 설정 파일과 환경변수

현재 실행 설정은 환경변수로 로드됩니다. 기본값을 사용하면 `HOST=127.0.0.1`, `PORT=3000`, `SQLITE_PATH=./data/traffic.db`, `MAX_BODY_BYTES=65536`입니다. Provider URL은 `PROVIDER_URL`, secret은 평문 설정 파일이 아닌 `PROVIDER_API_KEY` 환경변수로 제공합니다.


```bash
npm install
PROVIDER_URL=https://api.openai.com/v1/responses \
PROVIDER_API_KEY=sk-... \
SQLITE_PATH=./data/traffic.db \
PORT=3000 \
npm run build && npm start
```

기본 바인딩 주소는 `127.0.0.1`이며 다음 환경변수로 변경할 수 있습니다.

- `HOST`: 수신 주소 (기본값 `127.0.0.1`)
- `PORT`: 수신 포트 (기본값 `3000`)
- `PROVIDER_URL`: Provider Responses API URL
- `PROVIDER_API_KEY`: Provider 인증 키
- `SQLITE_PATH`: SQLite 파일 경로 (기본값 `./data/traffic.db`)
- `MAX_BODY_BYTES`: 저장·수신 본문 최대 크기 (기본값 `65536`)

## API

- `POST /api/v1/responses`: Provider로 요청 전달
- `GET /api/v1/logs`: 최신순 로그 목록
  - `status`, `model`, `from`, `to`, `limit`, `offset` 쿼리 지원
  - `from`/`to`는 ISO 8601 `started_at` 범위로 비교
- `GET /api/v1/logs/:id`: 로그 상세 조회

Authorization, API 키, Cookie 계열 헤더는 `[REDACTED]`로 저장됩니다. 요청·응답 본문은 `MAX_BODY_BYTES`를 넘지 않도록 제한됩니다.

## 검증

빌드:

```bash
npm run build
```

통합 검증:

```bash
npm run verify
```

`verify`는 npm 11의 install-script 정책으로 `better-sqlite3` 네이티브 빌드가 차단된 환경에서도 필요한 패키지 install script를 승인한 뒤 rebuild합니다. mock Provider를 `127.0.0.1`에 띄워 정상 요청, SQLite 저장, 마스킹, 기간 필터, 페이지네이션, 상세 조회를 재현합니다. 스트리밍·Provider 오류 자동 검증은 T-005 범위입니다.
