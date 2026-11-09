import type { Log } from '../types';

type Props = { log: Log; onBack: () => void };

const pretty = (value?: string) => {
  if (!value) return '—';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
};

export function LogDetail({ log, onBack }: Props) {
  return <section className="card"><button onClick={onBack}>← 목록</button><h2>Traffic {log.id}</h2>
    <p><strong>상태:</strong> <span className={`status ${log.status}`}>{log.status}</span> · <strong>모델:</strong> {log.model || '—'} · <strong>지연:</strong> {log.latency_ms ?? '—'}ms</p>
    <h3>요청</h3><pre>{pretty(log.request_json)}</pre><h3>응답</h3><pre>{pretty(log.response_json)}</pre><h3>오류</h3><pre>{log.error || '—'}</pre>
  </section>;
}
