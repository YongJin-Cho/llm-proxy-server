export type Log = {
  id: string;
  api_kind?: 'responses' | 'chat_completions' | 'messages';
  provider?: string | null;
  status: string;
  model?: string;
  http_status?: number;
  latency_ms?: number;
  started_at: string;
  request_json?: unknown;
  response_json?: unknown;
  error?: string;
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
};

export type TurnTraffic = Pick<Log, 'id' | 'api_kind' | 'provider' | 'started_at' | 'status' | 'model' | 'latency_ms' | 'input_tokens' | 'cached_input_tokens' | 'output_tokens' | 'total_tokens' | 'cost_usd'> & {
  finished_at?: string | null;
  http_status?: number | null;
  streaming?: number;
  turn_sequence?: number | null;
  fallback_reason?: string | null;
  title?: string | null;
  flag?: number;
  };

export type TurnSummary = {
  start_user_input: unknown | null;
  end_ai_output: unknown | null;
  model: string | null;
  provider: string | null;
  execution_environment: unknown | null;
  status: string;
  traffic_count: number;
  duration_ms: number | null;
  usage: { input_tokens: number | null; cached_input_tokens: number | null; output_tokens: number | null; total_tokens: number | null; cost_usd: number | null; partial: boolean };
};
export type TurnNote = { title: string; content: string };
export type TurnNoteProjection = { status: 'pending' | 'ready' | 'empty' | 'failed'; notes: TurnNote[]; error_code?: string | null; error_message?: string | null; retryable?: boolean; attempt_count?: number; updated_at?: string };
export type TurnNode = {
  id: string;
  kind: 'turn' | 'legacy';
  started_at: string;
  finished_at?: string | null;
  status: string;
  traffic_count: number;
  title?: string | null;
  flag: number;
  fallback_reasons: string[];
  summary: TurnSummary;
  traffic: TurnTraffic[];
  notes?: TurnNoteProjection | null;
  };

export type TurnPage = { data: TurnNode[]; page: number; limit: number; total: number; has_next: boolean };
export type Filters = { status: string; model: string; from: string; to: string };
export const emptyFilters: Filters = { status: '', model: '', from: '', to: '' };
