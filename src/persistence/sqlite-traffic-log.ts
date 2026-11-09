import Database from 'better-sqlite3';
import type { TrafficLog, TrafficLogFilters, TrafficLogFinish, TrafficLogReader, TrafficLogWrite, TrafficLogWriter } from '../domain/traffic-log.js';

export class SqliteTrafficLogStore implements TrafficLogWriter, TrafficLogReader {
  private readonly db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS traffic_logs (
      id TEXT PRIMARY KEY, api_kind TEXT NOT NULL DEFAULT 'responses', started_at TEXT NOT NULL, finished_at TEXT,
      status TEXT NOT NULL, http_status INTEGER, model TEXT, streaming INTEGER NOT NULL,
      latency_ms INTEGER, request_json TEXT, response_json TEXT, error TEXT,
      input_tokens INTEGER, cached_input_tokens INTEGER, output_tokens INTEGER, total_tokens INTEGER, cost_usd REAL,
      turn_id TEXT, turn_sequence INTEGER, fallback_reason TEXT
      )`);
    const columns = this.db.prepare('PRAGMA table_info(traffic_logs)').all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === 'api_kind')) {
      this.db.exec("ALTER TABLE traffic_logs ADD COLUMN api_kind TEXT NOT NULL DEFAULT 'responses'");
    }
    const refreshedColumns = this.db.prepare('PRAGMA table_info(traffic_logs)').all() as Array<{ name: string }>;
    for (const column of ['input_tokens', 'cached_input_tokens', 'output_tokens', 'total_tokens', 'turn_sequence']) {
      if (!refreshedColumns.some((entry) => entry.name === column)) this.db.exec(`ALTER TABLE traffic_logs ADD COLUMN ${column} INTEGER`);
    }
    for (const column of ['cost_usd', 'turn_id', 'fallback_reason']) {
      if (!refreshedColumns.some((entry) => entry.name === column)) this.db.exec(`ALTER TABLE traffic_logs ADD COLUMN ${column} ${column === 'cost_usd' ? 'REAL' : 'TEXT'}`);
    }
  }
  insert(entry: TrafficLogWrite) {
    this.db.prepare(`INSERT INTO traffic_logs (id, api_kind, started_at, status, http_status, model, streaming, request_json)
      VALUES (@id, @apiKind, @startedAt, 'pending', NULL, @model, @streaming, @requestJson)`).run(entry);
  }
  finish(entry: TrafficLogFinish) { this.db.prepare(`UPDATE traffic_logs SET finished_at=@finishedAt, status=@status, http_status=@httpStatus, latency_ms=@latencyMs, response_json=@responseJson, error=@error, input_tokens=@inputTokens, cached_input_tokens=@cachedInputTokens, output_tokens=@outputTokens, total_tokens=@totalTokens, cost_usd=@costUsd WHERE id=@id`).run(entry); }
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
  createTurn(turn: { id: string; startedAt: string; status: 'in_progress' | 'completed' }) {
    this.db.prepare(`CREATE TABLE IF NOT EXISTS turns (
      id TEXT PRIMARY KEY, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL, traffic_count INTEGER NOT NULL DEFAULT 0
    )`).run();
    this.db.prepare('INSERT INTO turns (id, started_at, status) VALUES (@id, @startedAt, @status)').run(turn);
  }
  updateTurn(turn: { id: string; status: 'in_progress' | 'completed'; finishedAt: string | null }) {
    this.db.prepare('UPDATE turns SET status=@status, finished_at=@finishedAt, traffic_count=(SELECT COUNT(*) FROM traffic_logs WHERE turn_id=@id) WHERE id=@id').run(turn);
  }
  attachTraffic(traffic: { trafficId: string; turnId: string; sequence: number; fallbackReason: string | null }) {
    this.db.prepare('UPDATE traffic_logs SET turn_id=@turnId, turn_sequence=@sequence, fallback_reason=@fallbackReason WHERE id=@trafficId').run(traffic);
  }
  close() { this.db.close(); }
}
