import Database from 'better-sqlite3';
import type { MetadataUpdate, TrafficLog, TrafficLogFilters, TrafficLogFinish, TrafficLogReader, TrafficLogWrite, TrafficLogWriter, TurnSummary, TurnTreePage, TurnTreeNode, TurnTrafficSummary } from '../domain/traffic-log.js';
import type { TurnAnalysisPersistence, TurnAnalysisResult, TurnAnalysisTraffic, TurnNoteProjection } from '../domain/turn-notes.js';

type SummaryTraffic = TurnTrafficSummary & {
  request_json: string | null;
  response_json: string | null;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
};

function parseJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
}
function lastUserMessage(messages: unknown): Record<string, unknown> | null {
  if (!Array.isArray(messages)) return null;
  const message = [...messages].reverse().find((item) => (item as { role?: string } | null)?.role === 'user');
  return message && typeof message === 'object' ? message as Record<string, unknown> : null;
}
function lastContentText(content: unknown, type: string): unknown | null {
  if (!Array.isArray(content)) return null;
  const item = [...content].reverse().find((part) => (part as { type?: string } | null)?.type === type);
  return item && typeof item === 'object' && 'text' in item ? (item as { text?: unknown }).text ?? null : null;
}
function extractUserInput(value: Record<string, unknown> | null, apiKind: string | undefined): unknown | null {
  if (!value) return null;
  if (typeof value.input === 'string') return value.input;
  if (apiKind === 'responses') {
    if (typeof value.input === 'string') return value.input;
    const input = Array.isArray(value.input) ? value.input.at(-1) as { role?: string; content?: unknown } | undefined : undefined;
    return input?.role === 'user' ? lastContentText(input.content, 'input_text') : null;
  }
  const message = lastUserMessage(value.messages);
  return message?.content ?? null;
}
function extractAiOutput(value: Record<string, unknown> | null, apiKind: string | undefined): unknown | null {
  if (!value) return null;
  if (typeof value.output_text === 'string') return value.output_text;
  if (apiKind === 'responses') {
    const output = Array.isArray(value.output) ? value.output.at(-1) as { role?: string; content?: unknown } | undefined : undefined;
    return output?.role === 'assistant' ? lastContentText(output.content, 'output_text') : null;
  }
  if (apiKind === 'chat_completions') {
    const choice = Array.isArray(value.choices) ? value.choices[0] as { message?: { role?: string; content?: unknown } } | undefined : undefined;
    return choice?.message?.role === 'assistant' ? choice.message.content ?? null : null;
  }
  if (apiKind === 'messages') {
    return value.role === 'assistant' ? lastContentText(value.content, 'text') : null;
  }
  return null;
}
function buildSummary(traffic: SummaryTraffic[], status: TrafficLog['status']): TurnSummary {
  const completed = traffic.filter((item) => item.status === 'completed');
  const first = traffic[0];
  const lastCompleted = completed.at(-1);
  const values = ['input_tokens', 'cached_input_tokens', 'output_tokens', 'total_tokens', 'cost_usd'] as const;
  const usage = Object.fromEntries(values.map((field) => [field, traffic.some((item) => item[field] !== null && item[field] !== undefined) ? traffic.reduce((sum, item) => sum + (item[field] ?? 0), 0) : null])) as Record<typeof values[number], number | null>;
  const started = Date.parse(first?.started_at ?? '') || 0;
  const finished = Date.parse((lastCompleted ?? traffic.at(-1))?.finished_at ?? '') || 0;
  const requestEnvelope = parseJson(first?.request_json ?? null);
  const requestBody = requestEnvelope?.body && typeof requestEnvelope.body === 'object'
    ? requestEnvelope.body as Record<string, unknown>
    : requestEnvelope;
  const finalTraffic = lastCompleted ?? traffic.at(-1);
  return {
    start_user_input: extractUserInput(requestBody, first?.api_kind),
    end_ai_output: extractAiOutput(parseJson(finalTraffic?.response_json ?? null), finalTraffic?.api_kind),
    model: first?.model ?? null,
    provider: first?.provider ?? null,
    execution_environment: null,
    status,
    traffic_count: traffic.length,
    duration_ms: started && finished ? Math.max(0, finished - started) : null,
    usage: { ...usage, partial: traffic.some((item) => item.input_tokens === null || item.output_tokens === null || item.total_tokens === null) },
  };
}

export class SqliteTrafficLogStore implements TrafficLogWriter, TrafficLogReader, TurnAnalysisPersistence {
  private readonly db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS turns (
      id TEXT PRIMARY KEY, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL, traffic_count INTEGER NOT NULL DEFAULT 0,
      title TEXT, flag INTEGER NOT NULL DEFAULT 0
    )`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS turn_notes (
      turn_id TEXT NOT NULL,
      analysis_version INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes_json TEXT NOT NULL DEFAULT '[]',
      error_code TEXT,
      error_message TEXT,
      retryable INTEGER NOT NULL DEFAULT 0,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (turn_id, analysis_version)
    )`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS traffic_logs (
      id TEXT PRIMARY KEY, api_kind TEXT NOT NULL DEFAULT 'responses', provider TEXT, started_at TEXT NOT NULL, finished_at TEXT,
      status TEXT NOT NULL, http_status INTEGER, model TEXT, streaming INTEGER NOT NULL,
      latency_ms INTEGER, request_json TEXT, response_json TEXT, error TEXT,
      input_tokens INTEGER, cached_input_tokens INTEGER, output_tokens INTEGER, total_tokens INTEGER, cost_usd REAL,
      turn_id TEXT, turn_sequence INTEGER, fallback_reason TEXT, title TEXT, flag INTEGER NOT NULL DEFAULT 0
      )`);
    const columns = this.db.prepare('PRAGMA table_info(traffic_logs)').all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === 'api_kind')) {
      this.db.exec("ALTER TABLE traffic_logs ADD COLUMN api_kind TEXT NOT NULL DEFAULT 'responses'");
    }
    if (!columns.some((column) => column.name === 'provider')) {
      this.db.exec('ALTER TABLE traffic_logs ADD COLUMN provider TEXT');
    }
    const refreshedColumns = this.db.prepare('PRAGMA table_info(traffic_logs)').all() as Array<{ name: string }>;
    for (const column of ['input_tokens', 'cached_input_tokens', 'output_tokens', 'total_tokens', 'turn_sequence', 'flag']) {
      if (!refreshedColumns.some((entry) => entry.name === column)) this.db.exec(`ALTER TABLE traffic_logs ADD COLUMN ${column} INTEGER`);
    }
    for (const column of ['cost_usd', 'turn_id', 'fallback_reason', 'title']) {
      if (!refreshedColumns.some((entry) => entry.name === column)) this.db.exec(`ALTER TABLE traffic_logs ADD COLUMN ${column} ${column === 'cost_usd' ? 'REAL' : 'TEXT'}`);
    }
  }
  insert(entry: TrafficLogWrite) {
    this.db.prepare(`INSERT INTO traffic_logs (id, api_kind, provider, started_at, status, http_status, model, streaming, request_json)
      VALUES (@id, @apiKind, @provider, @startedAt, 'pending', NULL, @model, @streaming, @requestJson)`).run(entry);
  }
  finish(entry: TrafficLogFinish) {
    this.db.prepare(`UPDATE traffic_logs SET finished_at=@finishedAt, status=@status, http_status=@httpStatus, latency_ms=@latencyMs, response_json=@responseJson, error=@error, input_tokens=@inputTokens, cached_input_tokens=@cachedInputTokens, output_tokens=@outputTokens, total_tokens=@totalTokens, cost_usd=@costUsd WHERE id=@id`).run({
      ...entry,
      inputTokens: entry.inputTokens ?? null,
      cachedInputTokens: entry.cachedInputTokens ?? null,
      outputTokens: entry.outputTokens ?? null,
      totalTokens: entry.totalTokens ?? null,
      costUsd: entry.costUsd ?? null,
    });
  }
  list(filters: TrafficLogFilters) {
    const clauses: string[] = []; const params: Record<string, unknown> = {};
    for (const field of ['status', 'model'] as const) if (filters[field]) { clauses.push(`${field} = @${field}`); params[field] = filters[field]; }
    if (filters.from) { clauses.push('started_at >= @from'); params.from = filters.from; }
    if (filters.to) { clauses.push('started_at <= @to'); params.to = filters.to; }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const data = this.db.prepare(`SELECT * FROM traffic_logs ${where} ORDER BY started_at DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit: filters.limit, offset: filters.offset }) as TrafficLog[];
    return { data, limit: filters.limit, offset: filters.offset };
  }
  get(id: string) { return this.db.prepare('SELECT * FROM traffic_logs WHERE id = ?').get(id) as TrafficLog | undefined; }
  listTurns(page: number, limit: number, filter: 'all' | 'flagged' = 'all'): TurnTreePage {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const flagClause = filter === 'flagged' ? 'WHERE flag = 1' : '';
    const totalRow = this.db.prepare(`SELECT COUNT(*) AS count FROM (SELECT id FROM turns ${flagClause} UNION ALL SELECT id FROM traffic_logs WHERE turn_id IS NULL ${filter === 'flagged' ? 'AND flag = 1' : ''})`).get() as { count: number };
    const rows = this.db.prepare(`SELECT id, 'turn' AS kind, started_at, finished_at, status, traffic_count, title, flag
      FROM turns ${flagClause}
      UNION ALL
      SELECT id, 'legacy' AS kind, started_at, finished_at, status, 1 AS traffic_count, title, flag
      FROM traffic_logs WHERE turn_id IS NULL ${filter === 'flagged' ? 'AND flag = 1' : ''}
      ORDER BY started_at DESC, id DESC LIMIT @limit OFFSET @offset`).all({ limit: safeLimit, offset: (safePage - 1) * safeLimit }) as Array<{ id: string; kind: 'turn' | 'legacy'; started_at: string; finished_at: string | null; status: TrafficLog['status']; traffic_count: number; title: string | null; flag: number }>;
    const data = rows.map((row) => {
      const traffic = (row.kind === 'turn'
        ? this.db.prepare(`SELECT id, api_kind, provider, started_at, finished_at, status, http_status, model, streaming, latency_ms, turn_sequence, fallback_reason, title, flag, request_json, response_json, input_tokens, cached_input_tokens, output_tokens, total_tokens, cost_usd FROM traffic_logs WHERE turn_id = ? ORDER BY turn_sequence ASC, id ASC`).all(row.id)
        : this.db.prepare(`SELECT id, api_kind, provider, started_at, finished_at, status, http_status, model, streaming, latency_ms, turn_sequence, fallback_reason, title, flag, request_json, response_json, input_tokens, cached_input_tokens, output_tokens, total_tokens, cost_usd FROM traffic_logs WHERE id = ?`).all(row.id)) as SummaryTraffic[];
      const fallbackReasons = [...new Set(traffic.map((item) => item.fallback_reason).filter((reason): reason is string => Boolean(reason)))];
      return { ...row, fallback_reasons: fallbackReasons, summary: buildSummary(traffic, row.status), notes: row.kind === 'turn' ? this.getTurnNote(row.id) : null, traffic: traffic.map(({ request_json: _request, response_json: _response, ...summary }) => summary) } satisfies TurnTreeNode;
    });
    return { data, page: safePage, limit: safeLimit, total: totalRow.count, has_next: safePage * safeLimit < totalRow.count };
  }
  createTurn(turn: { id: string; startedAt: string; status: 'in_progress' | 'completed' }) {
    this.db.prepare('INSERT INTO turns (id, started_at, status) VALUES (@id, @startedAt, @status)').run(turn);
  }
  updateTurn(turn: { id: string; status: 'in_progress' | 'completed'; finishedAt: string | null }) {
    this.db.prepare('UPDATE turns SET status=@status, finished_at=@finishedAt, traffic_count=(SELECT COUNT(*) FROM traffic_logs WHERE turn_id=@id) WHERE id=@id').run(turn);
  }
  attachTraffic(traffic: { trafficId: string; turnId: string; sequence: number; fallbackReason: string | null }) {
    this.db.prepare('UPDATE traffic_logs SET turn_id=@turnId, turn_sequence=@sequence, fallback_reason=@fallbackReason WHERE id=@trafficId').run(traffic);
  }
  getTurnForAnalysis(turnId: string) {
    const turn = this.db.prepare('SELECT id FROM turns WHERE id = ?').get(turnId) as { id: string } | undefined;
    if (!turn) return undefined;
    const rows = this.db.prepare(`SELECT api_kind, turn_sequence, status, request_json, response_json FROM traffic_logs WHERE turn_id = ? ORDER BY turn_sequence ASC, id ASC`).all(turnId) as Array<{ api_kind: TurnAnalysisTraffic['apiKind']; turn_sequence: number | null; status: string; request_json: string | null; response_json: string | null }>;
    const decode = (value: string | null) => { if (!value) return null; try { const parsed = JSON.parse(value) as Record<string, unknown>; return parsed.body ?? parsed; } catch { return null; } };
    return { turnId, analysisVersion: 1, traffic: rows.map((row) => ({ apiKind: row.api_kind, sequence: row.turn_sequence ?? 0, status: row.status, request: decode(row.request_json), response: decode(row.response_json) })) };
  }
  listPendingTurnAnalyses() {
    return this.db.prepare("SELECT turn_id AS turnId, analysis_version AS analysisVersion FROM turn_notes WHERE status = 'pending' OR (status = 'failed' AND retryable = 1)").all() as Array<{ turnId: string; analysisVersion: number }>;
  }
  ensureTurnNotePending(turnId: string, analysisVersion: number) {
    const result = this.db.prepare(`INSERT OR IGNORE INTO turn_notes (turn_id, analysis_version, status, notes_json, updated_at) VALUES (?, ?, 'pending', '[]', ?)`).run(turnId, analysisVersion, new Date().toISOString());
    return result.changes > 0;
  }
  saveTurnNoteResult(input: { turnId: string; analysisVersion: number; result: TurnAnalysisResult }) {
    const result = input.result;
    this.db.prepare(`UPDATE turn_notes SET status=@status, notes_json=@notesJson, error_code=@errorCode, error_message=@errorMessage, retryable=@retryable, attempt_count=attempt_count+1, updated_at=@updatedAt WHERE turn_id=@turnId AND analysis_version=@analysisVersion`).run({ turnId: input.turnId, analysisVersion: input.analysisVersion, status: result.status, notesJson: JSON.stringify(result.notes), errorCode: result.errorCode ?? null, errorMessage: result.errorMessage?.slice(0, 256) ?? null, retryable: result.retryable ? 1 : 0, updatedAt: new Date().toISOString() });
  }
  getTurnNote(turnId: string): TurnNoteProjection | null {
    try {
      const row = this.db.prepare(`SELECT turn_id, analysis_version, status, notes_json, error_code, error_message, retryable, attempt_count, updated_at FROM turn_notes WHERE turn_id = ? ORDER BY analysis_version DESC LIMIT 1`).get(turnId) as { turn_id: string; analysis_version: number; status: TurnNoteProjection['status']; notes_json: string; error_code: string | null; error_message: string | null; retryable: number; attempt_count: number; updated_at: string } | undefined;
      if (!row) return null;
      try { return { turn_id: row.turn_id, analysis_version: row.analysis_version, status: row.status, notes: JSON.parse(row.notes_json), error_code: row.error_code, error_message: row.error_message, retryable: row.retryable === 1, attempt_count: row.attempt_count, updated_at: row.updated_at }; } catch { return { turn_id: row.turn_id, analysis_version: row.analysis_version, status: 'failed', notes: [], error_code: 'note_unavailable', error_message: 'note projection unavailable', retryable: false, attempt_count: row.attempt_count, updated_at: row.updated_at }; }
    } catch { return { turn_id: turnId, analysis_version: 1, status: 'failed', notes: [], error_code: 'note_unavailable', error_message: 'note projection unavailable', retryable: false, attempt_count: 0, updated_at: new Date().toISOString() }; }
  }
  updateTurnMetadata(id: string, update: MetadataUpdate) {
    this.db.prepare('UPDATE turns SET title=COALESCE(@title, title), flag=COALESCE(@flag, flag) WHERE id=@id').run({ id, title: update.title ?? null, flag: update.flag === undefined ? null : (update.flag ? 1 : 0) });
  }
  updateTrafficMetadata(id: string, update: MetadataUpdate) {
    this.db.prepare('UPDATE traffic_logs SET title=COALESCE(@title, title), flag=COALESCE(@flag, flag) WHERE id=@id').run({ id, title: update.title ?? null, flag: update.flag === undefined ? null : (update.flag ? 1 : 0) });
  }
  deleteUnflaggedTurnsOnPage(page: number, limit: number, filter: 'all' | 'flagged' = 'all') {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const flagClause = filter === 'flagged' ? 'WHERE flag = 1' : '';
    const legacyFlagClause = filter === 'flagged' ? 'AND flag = 1' : '';
    const rows = this.db.prepare(`SELECT id, 'turn' AS kind, started_at FROM turns ${flagClause}
      UNION ALL SELECT id, 'legacy' AS kind, started_at FROM traffic_logs WHERE turn_id IS NULL ${legacyFlagClause}
      ORDER BY started_at DESC, id DESC LIMIT @limit OFFSET @offset`).all({ limit: safeLimit, offset: (safePage - 1) * safeLimit }) as Array<{ id: string; kind: 'turn' | 'legacy'; started_at: string }>;
    const transaction = this.db.transaction(() => {
      let deleted = 0;
      for (const row of rows) {
        const flag = row.kind === 'turn'
          ? this.db.prepare('SELECT flag FROM turns WHERE id = ?').get(row.id) as { flag: number } | undefined
          : this.db.prepare('SELECT flag FROM traffic_logs WHERE id = ?').get(row.id) as { flag: number } | undefined;
        if (!flag || flag.flag !== 0) continue;
        if (row.kind === 'turn') {
          this.db.prepare('DELETE FROM traffic_logs WHERE turn_id = ?').run(row.id);
          this.db.prepare('DELETE FROM turns WHERE id = ?').run(row.id);
        } else {
          this.db.prepare('DELETE FROM traffic_logs WHERE id = ?').run(row.id);
        }
        deleted += 1;
      }
      return deleted;
    });
    return transaction();
  }
  deleteTurn(id: string) {
    const transaction = this.db.transaction(() => {
      this.db.prepare('DELETE FROM traffic_logs WHERE turn_id = ?').run(id);
      this.db.prepare('DELETE FROM turns WHERE id = ?').run(id);
    });
    transaction();
  }
  close() { this.db.close(); }
}
