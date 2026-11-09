export type Log = {
  id: string;
  status: string;
  model?: string;
  http_status?: number;
  latency_ms?: number;
  started_at: string;
  request_json?: string;
  response_json?: string;
  error?: string;
};

export type Filters = {
  status: string;
  model: string;
  from: string;
  to: string;
};

export const emptyFilters: Filters = { status: '', model: '', from: '', to: '' };
