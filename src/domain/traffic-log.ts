export type TrafficLogStatus = 'pending' | 'completed' | 'failed';
export type TrafficLogApiKind = 'responses' | 'chat_completions' | 'messages';

export type TrafficLog = {
  id: string;
  api_kind: TrafficLogApiKind;
  started_at: string;
  finished_at?: string | null;
  status: TrafficLogStatus;
  http_status?: number | null;
  model?: string | null;
  streaming: number;
  latency_ms?: number | null;
  request_json?: string | null;
  response_json?: string | null;
  error?: string | null;
  input_tokens?: number | null;
  cached_input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  cost_usd?: number | null;
  };

export type TrafficLogWrite = {
  id: string;
  apiKind: TrafficLogApiKind;
  startedAt: string;
  model: string | null;
  streaming: number;
  requestJson: string;
};

export type TrafficLogFinish = {
  id: string;
  finishedAt: string;
  status: Exclude<TrafficLogStatus, 'pending'>;
  httpStatus: number;
  latencyMs: number;
  responseJson: string | null;
  error: string | null;
  inputTokens?: number | null;
  cachedInputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  costUsd?: number | null;
  };

export type TrafficLogFilters = { status?: string; model?: string; from?: string; to?: string; limit: number; offset: number };

export interface TrafficLogWriter {
  insert(entry: TrafficLogWrite): void;
  finish(entry: TrafficLogFinish): void;
}
export interface TrafficLogReader {
  list(filters: TrafficLogFilters): { data: TrafficLog[]; limit: number; offset: number };
  get(id: string): TrafficLog | undefined;
}
