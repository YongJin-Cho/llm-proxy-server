import type { TurnNode } from '../types.js';

type Props = {
  nodes: TurnNode[];
  selectedTurn?: string;
  selectedTraffic?: string;
  onTurn: (id: string) => void;
  onTraffic: (turnId: string, trafficId: string) => void;
  onRename: (id: string, title: string | null) => void;
  onToggleFlag: (id: string, flag: boolean) => void;
  onDelete: (id: string) => void;
};

export function TurnTree({ nodes, selectedTurn, selectedTraffic, onTurn, onTraffic, onRename, onToggleFlag, onDelete }: Props) {
  return <nav className="turn-tree" aria-label="Turn traffic tree">
    <h2>Turns</h2>
    {nodes.length === 0 && <p>표시할 turn이 없습니다.</p>}
    {nodes.map((node) => <section className="turn-node" key={`${node.kind}:${node.id}`}>
      <button className={selectedTurn === node.id ? 'selected' : ''} onClick={() => onTurn(node.id)}>
        {node.kind === 'legacy' ? 'Legacy' : 'Turn'} {node.title || node.id.slice(0, 8)} · {node.status} ({node.traffic_count})
      </button>
      <div className="turn-actions">
        <button type="button" onClick={() => onToggleFlag(node.id, !node.flag)} aria-label={`${node.flag ? 'Unflag' : 'Flag'} ${node.id}`}>{node.flag ? '★' : '☆'}</button>
        <button type="button" onClick={() => onRename(node.id, window.prompt('Turn 제목', node.title ?? '') || null)}>제목</button>
        {node.kind === 'turn' && <button type="button" onClick={() => onDelete(node.id)}>삭제</button>}
      </div>
      <div className="traffic-children">
        {node.traffic.map((traffic) => <button key={traffic.id} className={selectedTraffic === traffic.id ? 'selected' : ''} onClick={() => onTraffic(node.id, traffic.id)}>
          Traffic {traffic.title || (traffic.turn_sequence ?? '—')} · {traffic.status}
        </button>)}
      </div>
    </section>)}
  </nav>;
}
