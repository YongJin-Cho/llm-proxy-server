import type { Log } from '../types';
import { LogDetail } from './LogDetail';

type Props = {
  log?: Log;
  loading?: boolean;
  error?: string;
  onBack: () => void;
};

function value(value: string | number | null | undefined) {
  return value === null || value === undefined ? '—' : value;
}

function TrafficSummary({ log }: { log: Log }) {
  return <section className="card traffic-summary" aria-label="Traffic summary">
    <h2>Traffic summary</h2>
    <dl className="summary-grid">
      <div><dt>Status</dt><dd><span className={`status ${log.status}`}>{log.status}</span></dd></div>
      <div><dt>Model</dt><dd>{value(log.model)}</dd></div>
      <div><dt>Provider</dt><dd>{value(log.provider)}</dd></div>
      <div><dt>Input tokens</dt><dd>{value(log.input_tokens)}</dd></div>
      <div><dt>Cached input tokens</dt><dd>{value(log.cached_input_tokens)}</dd></div>
      <div><dt>Output tokens</dt><dd>{value(log.output_tokens)}</dd></div>
      <div><dt>Cost</dt><dd>{value(log.cost_usd)}</dd></div>
      <div><dt>처리 시간</dt><dd>{value(log.latency_ms)}{log.latency_ms === null || log.latency_ms === undefined ? '' : 'ms'}</dd></div>
    </dl>
  </section>;
}

export function TrafficView({ log, loading, error, onBack }: Props) {
  if (loading) return <section className="card" aria-label="Traffic view loading"><button type="button" onClick={onBack}>← turn</button><p>traffic를 불러오는 중…</p></section>;
  if (error) return <section className="card" aria-label="Traffic view error"><button type="button" onClick={onBack}>← turn</button><p className="error">{error}</p></section>;
  if (!log) return <section className="card" aria-label="Traffic view empty"><button type="button" onClick={onBack}>← turn</button><p>traffic를 선택하세요.</p></section>;
  return <>
    <TrafficSummary log={log} />
    <LogDetail log={log} />
  </>;
}
