import type { Log } from '../types';

type Props = {
  logs: Log[];
  offset: number;
  limit: number;
  onSelect: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function LogTable({ logs, offset, limit, onSelect, onPrevious, onNext }: Props) {
  return <section className="card"><table><thead><tr><th>ID</th><th>상태</th><th>모델</th><th>HTTP</th><th>지연</th><th>시작</th></tr></thead><tbody>
    {logs.length ? logs.map((log) => <tr key={log.id}><td><button className="link" onClick={() => onSelect(log.id)}>{log.id.slice(0, 8)}</button></td><td className={`status ${log.status}`}>{log.status}</td><td>{log.model || '—'}</td><td>{log.http_status || '—'}</td><td>{log.latency_ms ?? '—'}ms</td><td>{log.started_at}</td></tr>) : <tr><td colSpan={6}>로그가 없습니다.</td></tr>}
  </tbody></table><div className="pagination"><button disabled={offset === 0} onClick={onPrevious}>이전</button><span>{offset + 1}–{offset + logs.length}</span><button disabled={logs.length < limit} onClick={onNext}>다음</button></div></section>;
}
