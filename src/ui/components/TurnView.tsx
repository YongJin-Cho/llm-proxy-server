import type { TurnNode } from '../types';

type Props = {
  turn?: TurnNode;
  loading?: boolean;
  onTraffic: (turnId: string, trafficId: string) => void;
};

export function TurnView({ turn, loading, onTraffic }: Props) {
  if (loading) return <section className="card" aria-label="Turn view loading"><p>turn을 불러오는 중…</p></section>;
  if (!turn) return <section className="card" aria-label="Turn view empty"><h1>LLM Proxy Traffic</h1><p>왼쪽에서 turn을 선택하세요.</p></section>;

  return <section className="card turn-view" aria-label="Turn view">
    <h1>{turn.title || `Turn ${turn.id.slice(0, 8)}`}</h1>
    <p>상태: {turn.summary.status} · traffic: {turn.summary.traffic_count} · 모델: {turn.summary.model || '—'} · 처리 시간: {turn.summary.duration_ms ?? '—'}ms</p>
    <p>Usage: input {turn.summary.usage.input_tokens ?? '—'} · output {turn.summary.usage.output_tokens ?? '—'} · total {turn.summary.usage.total_tokens ?? '—'} · cost {turn.summary.usage.cost_usd ?? '—'} {turn.summary.usage.partial ? '(partial)' : ''}</p>
    {turn.summary.start_user_input !== null && <pre>{JSON.stringify(turn.summary.start_user_input, null, 2)}</pre>}
    {turn.summary.end_ai_output !== null && <pre>{JSON.stringify(turn.summary.end_ai_output, null, 2)}</pre>}
    <h2>Traffic</h2>
    <div className="turn-view-traffic-list">
      {turn.traffic.map((traffic) => <button key={traffic.id} type="button" onClick={() => onTraffic(turn.id, traffic.id)}>
        Traffic {traffic.title || (traffic.turn_sequence ?? '—')} · {traffic.status} · {traffic.model || '—'}
      </button>)}
    </div>
  </section>;
}
