import type { Log } from '../types';
import { LogDetail } from './LogDetail';

type Props = {
  log?: Log;
  loading?: boolean;
  error?: string;
  onBack: () => void;
  turnTitle?: string;
  trafficLabel?: string;
};

function value(value: string | number | null | undefined) {
  return value === null || value === undefined ? '—' : value;
}

function formattedNumber(valueToFormat: number | null | undefined) {
  return valueToFormat === null || valueToFormat === undefined ? '—' : valueToFormat.toLocaleString('en-US');
}

function formattedCost(valueToFormat: number | null | undefined) {
  return valueToFormat === null || valueToFormat === undefined ? '—' : valueToFormat.toFixed(4);
}

function TrafficSummary({ log, turnTitle, trafficLabel }: { log: Log; turnTitle?: string; trafficLabel?: string }) {
  return <section className="card traffic-summary" aria-label="Traffic summary">
    <h2>Turn {turnTitle || '—'}/Traffic {trafficLabel || log.id.slice(0, 8)} summary</h2>
    <dl className="summary-grid">
      <div><dt>Status</dt><dd><span className={`status ${log.status}`}>{log.status}</span></dd></div>
      <div><dt>Model</dt><dd>{value(log.model)}</dd></div>
      <div><dt>Provider</dt><dd>{value(log.provider)}</dd></div>
      <div><dt>Cost</dt><dd>{formattedCost(log.cost_usd)}</dd></div>
      <div><dt>Input tokens</dt><dd>{formattedNumber(log.input_tokens)}</dd></div>
      <div><dt>Cached input tokens</dt><dd>{formattedNumber(log.cached_input_tokens)}</dd></div>
      <div><dt>Output tokens</dt><dd>{formattedNumber(log.output_tokens)}</dd></div>
      <div><dt>Elapsed time</dt><dd>{formattedNumber(log.latency_ms)}{log.latency_ms === null || log.latency_ms === undefined ? '' : 'ms'}</dd></div>
    </dl>
  </section>;
}

export function TrafficView({ log, loading, error, onBack, turnTitle, trafficLabel }: Props) {
  if (loading) return <section className="card" aria-label="Traffic view loading"><button type="button" onClick={onBack}>← turn</button><p>traffic를 불러오는 중…</p></section>;
  if (error) return <section className="card" aria-label="Traffic view error"><button type="button" onClick={onBack}>← turn</button><p className="error">{error}</p></section>;
  if (!log) return <section className="card" aria-label="Traffic view empty"><button type="button" onClick={onBack}>← turn</button><p>traffic를 선택하세요.</p></section>;
  return <>
    <TrafficSummary log={log} turnTitle={turnTitle} trafficLabel={trafficLabel} />
    <LogDetail log={log} />
  </>;
}
