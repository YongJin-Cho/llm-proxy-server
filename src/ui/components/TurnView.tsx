import type { TurnNode, TurnTraffic } from '../types';

type Props = {
  turn?: TurnNode;
  loading?: boolean;
  onTraffic: (turnId: string, trafficId: string) => void;
};

function value(value: string | number | null | undefined) {
  return value === null || value === undefined ? '—' : value;
}

function displayContent(content: unknown) {
  if (content === null || content === undefined) return '—';
  return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
}

function trafficLabel(traffic: TurnTraffic, index: number) {
  return traffic.title || String(index + 1);
}

function TrafficSummaryRow({ traffic, index, onSelect }: { traffic: TurnTraffic; index: number; onSelect: () => void }) {
  return <tr>
    <td><button type="button" className="link" onClick={onSelect}>Traffic {trafficLabel(traffic, index)}</button></td>
    <td>{value(traffic.input_tokens)}</td>
    <td>{value(traffic.cached_input_tokens)}</td>
    <td>{value(traffic.output_tokens)}</td>
    <td>{value(traffic.cost_usd)}</td>
    <td>{value(traffic.latency_ms)}{traffic.latency_ms === null || traffic.latency_ms === undefined ? '' : 'ms'}</td>
  </tr>;
}

export function TurnView({ turn, loading, onTraffic }: Props) {
  if (loading) return <section className="card" aria-label="Turn view loading"><p>turn을 불러오는 중…</p></section>;
  if (!turn) return <section className="card" aria-label="Turn view empty"><h1>LLM Proxy Traffic</h1><p>왼쪽에서 turn을 선택하세요.</p></section>;

  const summary = turn.summary;
  return <section className="card turn-view" aria-label="Turn view">
    <h1>{turn.title || `Turn ${turn.id.slice(0, 8)}`}</h1>
    <section className="traffic-summary" aria-label="Turn summary">
      <h2>Turn summary</h2>
      <dl className="summary-grid">
        <div><dt>Status</dt><dd><span className={`status ${summary.status}`}>{summary.status}</span></dd></div>
        <div><dt>Model</dt><dd>{value(summary.model)}</dd></div>
        <div><dt>Provider</dt><dd>{value(summary.provider)}</dd></div>
        <div><dt>Input tokens</dt><dd>{value(summary.usage.input_tokens)}</dd></div>
        <div><dt>Cached input tokens</dt><dd>{value(summary.usage.cached_input_tokens)}</dd></div>
        <div><dt>Output tokens</dt><dd>{value(summary.usage.output_tokens)}</dd></div>
        <div><dt>Total tokens</dt><dd>{value(summary.usage.total_tokens)}</dd></div>
        <div><dt>Cost</dt><dd>{value(summary.usage.cost_usd)}{summary.usage.partial ? ' (partial)' : ''}</dd></div>
        <div><dt>Elapsed time</dt><dd>{value(summary.duration_ms)}{summary.duration_ms === null ? '' : 'ms'}</dd></div>
      </dl>
    </section>
    <section className="turn-messages" aria-label="Turn request and response">
      <h2>Request</h2>
      <pre>{displayContent(summary.start_user_input)}</pre>
      <h2>Response</h2>
      <pre>{displayContent(summary.end_ai_output)}</pre>
    </section>
    <div className="table-scroll"><table><thead><tr><th>Traffic</th><th>Input tokens</th><th>Cached tokens</th><th>Output tokens</th><th>Cost</th><th>Elapsed time</th></tr></thead><tbody>
      {turn.traffic.map((traffic, index) => <TrafficSummaryRow key={traffic.id} traffic={traffic} index={index} onSelect={() => onTraffic(turn.id, traffic.id)} />)}
    </tbody></table></div>
  </section>;
}
