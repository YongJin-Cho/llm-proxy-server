import type { Log } from '../types';
import { ContentViewer } from './ContentViewer';

type Props = { log: Log; onBack: () => void };

export function LogDetail({ log, onBack }: Props) {
  return <section className="card"><button onClick={onBack}>← 목록</button><h2>Traffic {log.id}</h2>
    <p><strong>상태:</strong> <span className={`status ${log.status}`}>{log.status}</span> · <strong>모델:</strong> {log.model || '—'} · <strong>지연:</strong> {log.latency_ms ?? '—'}ms</p>
    <ContentViewer key={`${log.id}:request`} label="요청" content={log.request_json} hint="json" />
    <ContentViewer key={`${log.id}:response`} label="응답" content={log.response_json} hint="json" />
    <ContentViewer key={`${log.id}:error`} label="오류" content={log.error} hint="plaintext" />
  </section>;
}
