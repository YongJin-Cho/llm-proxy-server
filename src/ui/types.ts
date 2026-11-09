export type Log = {
  id: string;
  api_kind?: 'responses' | 'chat_completions' | 'messages';
  status: string;
  model?: string;
  http_status?: number;
  latency_ms?: number;
  started_at: string;
  request_json?: string;
  response_json?: string;
  error?: string;
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
};

export type TurnTraffic = Pick<Log, 'id' | 'api_kind' | 'started_at' | 'status' | 'model' | 'latency_ms'> & {
  finished_at?: string | null;
  http_status?: number | null;
  streaming?: number;
  turn_sequence?: number | null;
  fallback_reason?: string | null;
};

export type TurnNode = {
  id: string;
  kind: 'turn' | 'legacy';
  started_at: string;
  finished_at?: string | null;
  status: string;
  traffic_count: number;
  fallback_reasons: string[];
  traffic: TurnTraffic[];
};

export type TurnPage = { data: TurnNode[]; page: number; limit: number; total: number; has_next: boolean };
export type Filters = { status: string; model: string; from: string; to: string };
export const emptyFilters: Filters = { status: '', model: '', from: '', to: '' };
