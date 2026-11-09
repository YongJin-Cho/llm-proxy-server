import Database from 'better-sqlite3';
import type { TrafficLog, TrafficLogFilters, TrafficLogFinish, TrafficLogReader, TrafficLogWrite, TrafficLogWriter } from '../domain/traffic-log.js';

export class SqliteTrafficLogStore implements TrafficLogWriter, TrafficLogReader {
  private readonly db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS traffic_logs (
      id TEXT PRIMARY KEY, started_at TEXT NOT NULL, finished_at TEXT,
      status TEXT NOT NULL, http_status INTEGER, model TEXT, streaming INTEGER NOT NULL,
      latency_ms INTEGER, request_json TEXT, response_json TEXT, error TEXT
    )`);
  }
  insert(entry: TrafficLogWrite) { this.db.prepare(`INSERT INTO traffic_logs (id, started_at, status, http_status, model, streaming, request_json) VALUES (@id, @startedAt, 'pending', NULL, @model, @streaming, @requestJson)`).run(entry); }
  finish(entry: TrafficLogFinish) { this.db.prepare(`UPDATE traffic_logs SET finished_at=@finishedAt, status=@status, http_status=@httpStatus, latency_ms=@latencyMs, response_json=@responseJson, error=@error WHERE id=@id`).run(entry); }
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
  close() { this.db.close(); }
}
