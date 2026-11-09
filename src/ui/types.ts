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

export type Filters = {
  status: string;
  model: string;
  from: string;
  to: string;
};

export const emptyFilters: Filters = { status: '', model: '', from: '', to: '' };
