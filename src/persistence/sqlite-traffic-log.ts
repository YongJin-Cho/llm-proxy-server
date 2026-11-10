import Database from 'better-sqlite3';
import type { MetadataUpdate, TrafficLog, TrafficLogFilters, TrafficLogFinish, TrafficLogReader, TrafficLogWrite, TrafficLogWriter, TurnSummary, TurnTreePage, TurnTreeNode, TurnTrafficSummary } from '../domain/traffic-log.js';

type SummaryTraffic = TurnTrafficSummary & {
  request_json: string | null;
  response_json: string | null;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
};

function parseJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
}
function extractUserInput(value: Record<string, unknown> | null): unknown | null {
  if (!value) return null;
  if ('input' in value) return value.input ?? null;
  const messages = value.messages;
  if (Array.isArray(messages)) return (messages.find((message) => (message as { role?: string }).role === 'user') as { content?: unknown } | undefined)?.content ?? null;
  return null;
}
function extractAiOutput(value: Record<string, unknown> | null): unknown | null {
  if (!value) return null;
  if ('output_text' in value) return value.output_text ?? null;
  if ('output' in value) return value.output ?? null;
  const choices = value.choices;
  if (Array.isArray(choices)) return (choices[0] as { message?: { content?: unknown }; text?: unknown } | undefined)?.message?.content ?? (choices[0] as { text?: unknown } | undefined)?.text ?? null;
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
  return {
    start_user_input: extractUserInput(parseJson(first?.request_json ?? null)),
    end_ai_output: extractAiOutput(parseJson(lastCompleted?.response_json ?? null)),
    model: first?.model ?? null,
    provider: first?.provider ?? null,
    execution_environment: null,
    status,
    traffic_count: traffic.length,
    duration_ms: started && finished ? Math.max(0, finished - started) : null,
    usage: { ...usage, partial: traffic.some((item) => item.input_tokens === null || item.output_tokens === null || item.total_tokens === null) },
  };
}

export class SqliteTrafficLogStore implements TrafficLogWriter, TrafficLogReader {
  private readonly db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS turns (
      id TEXT PRIMARY KEY, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL, traffic_count INTEGER NOT NULL DEFAULT 0,
      title TEXT, flag INTEGER NOT NULL DEFAULT 0
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
      return { ...row, fallback_reasons: fallbackReasons, summary: buildSummary(traffic, row.status), traffic: traffic.map(({ request_json: _request, response_json: _response, ...summary }) => summary) } satisfies TurnTreeNode;
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
