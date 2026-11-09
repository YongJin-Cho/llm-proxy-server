import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Log = {
  id: string; status: string; model?: string; http_status?: number;
  latency_ms?: number; started_at: string; request_json?: string;
  response_json?: string; error?: string;
};
type Filters = { status: string; model: string; from: string; to: string };

const emptyFilters: Filters = { status: '', model: '', from: '', to: '' };
const pretty = (value?: string) => {
  if (!value) return '—';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
};

async function fetchLogs(filters: Filters, offset: number, limit = 20): Promise<Log[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  const response = await fetch(`/api/v1/logs?${params}`);
  if (!response.ok) throw new Error(`로그 목록 조회 실패 (${response.status})`);
  return (await response.json()).data;
}
async function fetchLog(id: string): Promise<Log> {
  const response = await fetch(`/api/v1/logs/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`로그 상세 조회 실패 (${response.status})`);
  return response.json();
}

function Filters({ value, onChange, onReset }: { value: Filters; onChange: (next: Filters) => void; onReset: () => void }) {
  return <form className="toolbar" onSubmit={(event) => { event.preventDefault(); onChange(value); }}>
    <label>상태<select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}><option value="">전체</option><option>completed</option><option>failed</option><option>pending</option></select></label>
    <label>모델<input value={value.model} placeholder="model" onChange={(event) => onChange({ ...value, model: event.target.value })} /></label>
    <label>시작일<input type="datetime-local" value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} /></label>
    <label>종료일<input type="datetime-local" value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} /></label>
    <button>필터 적용</button><button type="button" onClick={onReset}>초기화</button>
  </form>;
}
function Detail({ log, onBack }: { log: Log; onBack: () => void }) {
  return <section className="card"><button onClick={onBack}>← 목록</button><h2>Traffic {log.id}</h2>
    <p><strong>상태:</strong> <span className={`status ${log.status}`}>{log.status}</span> · <strong>모델:</strong> {log.model || '—'} · <strong>지연:</strong> {log.latency_ms ?? '—'}ms</p>
    <h3>요청</h3><pre>{pretty(log.request_json)}</pre><h3>응답</h3><pre>{pretty(log.response_json)}</pre><h3>오류</h3><pre>{log.error || '—'}</pre>
  </section>;
}
function App() {
  const [filters, setFilters] = useState(emptyFilters); const [offset, setOffset] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]); const [detail, setDetail] = useState<Log>(); const [error, setError] = useState(''); const limit = 20;
  const load = () => fetchLogs(filters, offset, limit).then(setLogs).catch((reason: Error) => setError(reason.message));
  useEffect(() => { if (!detail) load(); }, [filters, offset, detail]);
  if (detail) return <main><Detail log={detail} onBack={() => setDetail(undefined)} /></main>;
  return <main><h1>LLM Proxy Traffic</h1><Filters value={filters} onChange={(next) => { setFilters(next); setOffset(0); }} onReset={() => { setFilters(emptyFilters); setOffset(0); }} />
    {error && <p className="error">{error}</p>}<section className="card"><table><thead><tr><th>ID</th><th>상태</th><th>모델</th><th>HTTP</th><th>지연</th><th>시작</th></tr></thead><tbody>
      {logs.length ? logs.map((log) => <tr key={log.id}><td><button className="link" onClick={() => fetchLog(log.id).then(setDetail).catch((reason: Error) => setError(reason.message))}>{log.id.slice(0, 8)}</button></td><td className={`status ${log.status}`}>{log.status}</td><td>{log.model || '—'}</td><td>{log.http_status || '—'}</td><td>{log.latency_ms ?? '—'}ms</td><td>{log.started_at}</td></tr>) : <tr><td colSpan={6}>로그가 없습니다.</td></tr>}
    </tbody></table><div className="pagination"><button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>이전</button><span>{offset + 1}–{offset + logs.length}</span><button disabled={logs.length < limit} onClick={() => setOffset(offset + limit)}>다음</button></div></section></main>;
}

createRoot(document.getElementById('root')!).render(<App />);
