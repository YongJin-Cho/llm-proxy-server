import type { TurnNode } from '../types.js';

type Props = { nodes: TurnNode[]; selectedTurn?: string; selectedTraffic?: string; onTurn: (id: string) => void; onTraffic: (id: string) => void };

export function TurnTree({ nodes, selectedTurn, selectedTraffic, onTurn, onTraffic }: Props) {
  return <nav className="turn-tree" aria-label="Turn traffic tree">
    <h2>Turns</h2>
    {nodes.length === 0 && <p>표시할 turn이 없습니다.</p>}
    {nodes.map((node) => <section className="turn-node" key={`${node.kind}:${node.id}`}>
      <button className={selectedTurn === node.id ? 'selected' : ''} onClick={() => onTurn(node.id)}>
        {node.kind === 'legacy' ? 'Legacy' : 'Turn'} {node.id.slice(0, 8)} · {node.status} ({node.traffic_count})
      </button>
      <div className="traffic-children">
        {node.traffic.map((traffic) => <button key={traffic.id} className={selectedTraffic === traffic.id ? 'selected' : ''} onClick={() => onTraffic(traffic.id)}>
          Traffic {traffic.turn_sequence ?? '—'} · {traffic.status}
        </button>)}
      </div>
    </section>)}
  </nav>;
}
