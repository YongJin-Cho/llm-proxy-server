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
  turn_id?: string | null;
  turn_sequence?: number | null;
  fallback_reason?: string | null;
  title?: string | null;
  flag: number;
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

export type TurnTrafficSummary = Pick<TrafficLog, 'id' | 'api_kind' | 'started_at' | 'finished_at' | 'status' | 'http_status' | 'model' | 'streaming' | 'latency_ms' | 'turn_sequence' | 'fallback_reason' | 'title' | 'flag'>;
export type TurnSummary = {
  start_user_input: unknown | null;
  end_ai_output: unknown | null;
  model: string | null;
  execution_environment: unknown | null;
  status: TrafficLogStatus;
  traffic_count: number;
  duration_ms: number | null;
  usage: {
    input_tokens: number | null;
    cached_input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
    cost_usd: number | null;
    partial: boolean;
  };
};
export type TurnTreeNode = {
  id: string;
  kind: 'turn' | 'legacy';
  started_at: string;
  finished_at: string | null;
  status: TrafficLogStatus;
  traffic_count: number;
  title?: string | null;
  flag: number;
  fallback_reasons: string[];
  summary: TurnSummary;
  traffic: TurnTrafficSummary[];
};
export type TurnTreePage = { data: TurnTreeNode[]; page: number; limit: number; total: number; has_next: boolean };

export interface TrafficLogWriter {
  insert(entry: TrafficLogWrite): void;
  finish(entry: TrafficLogFinish): void;
}
export interface TrafficLogReader {
  list(filters: TrafficLogFilters): { data: TrafficLog[]; limit: number; offset: number };
  get(id: string): TrafficLog | undefined;
  listTurns(page: number, limit: number, filter?: 'all' | 'flagged'): TurnTreePage;
  }

  export type MetadataUpdate = { title?: string | null; flag?: boolean };

  export interface TrafficLogManager {
  updateTurnMetadata(id: string, update: MetadataUpdate): void;
  updateTrafficMetadata(id: string, update: MetadataUpdate): void;
  deleteTurn(id: string): void;
  }
