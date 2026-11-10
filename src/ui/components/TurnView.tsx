import type { TurnNode, TurnTraffic } from '../types';

type Props = {
  turn?: TurnNode;
  loading?: boolean;
  onTraffic: (turnId: string, trafficId: string) => void;
};

function value(value: string | number | null | undefined) {
  return value === null || value === undefined ? '—' : value;
}
function displayUnknown(value: unknown) {
  if (value === null || value === undefined) return '—';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function TrafficSummaryRow({ traffic, onSelect }: { traffic: TurnTraffic; onSelect: () => void }) {
  return <tr>
    <td><button type="button" className="link" onClick={onSelect}>Traffic {traffic.title || (traffic.turn_sequence ?? '—')}</button></td>
    <td>{value(traffic.model)}</td>
    <td>{value(traffic.provider)}</td>
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

  return <section className="card turn-view" aria-label="Turn view">
    <h1>{turn.title || `Turn ${turn.id.slice(0, 8)}`}</h1>
    <p>상태: {turn.summary.status} · traffic: {turn.summary.traffic_count} · 모델: {turn.summary.model || '—'} · provider: {value(turn.summary.provider)} · 실행 환경: {displayUnknown(turn.summary.execution_environment)} · 처리 시간: {turn.summary.duration_ms ?? '—'}ms</p>
    <p>Usage: input {turn.summary.usage.input_tokens ?? '—'} · cached input {turn.summary.usage.cached_input_tokens ?? '—'} · output {turn.summary.usage.output_tokens ?? '—'} · total {turn.summary.usage.total_tokens ?? '—'} · cost {turn.summary.usage.cost_usd ?? '—'} {turn.summary.usage.partial ? '(partial)' : ''}</p>
    {turn.summary.start_user_input !== null && <pre>{JSON.stringify(turn.summary.start_user_input, null, 2)}</pre>}
    {turn.summary.end_ai_output !== null && <pre>{JSON.stringify(turn.summary.end_ai_output, null, 2)}</pre>}
    <h2>Traffic summary</h2>
    <div className="table-scroll"><table><thead><tr><th>Traffic</th><th>Model</th><th>Provider</th><th>Input</th><th>Cached input</th><th>Output</th><th>Cost</th><th>처리 시간</th></tr></thead><tbody>
      {turn.traffic.map((traffic) => <TrafficSummaryRow key={traffic.id} traffic={traffic} onSelect={() => onTraffic(turn.id, traffic.id)} />)}
    </tbody></table></div>
  </section>;
}
