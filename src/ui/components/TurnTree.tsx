import { useState } from 'react';
import type { TurnNode } from '../types.js';

type Props = {
  nodes: TurnNode[];
  selectedTurn?: string;
  selectedTraffic?: string;
  page: number;
  hasNext: boolean;
  onPagePrevious: () => void;
  onPageNext: () => void;
  onTurn: (id: string) => void;
  onTraffic: (turnId: string, trafficId: string) => void;
  onRename: (id: string, title: string | null) => void;
  onRenameTraffic: (id: string, title: string | null) => void;
  onToggleFlag: (id: string, flag: boolean) => void;
  onDelete: (id: string) => void;
};

export function TurnTree({ nodes, selectedTurn, selectedTraffic, page, hasNext, onPagePrevious, onPageNext, onTurn, onTraffic, onRename, onRenameTraffic, onToggleFlag, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapsed = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <nav className="turn-tree" aria-label="Turn traffic tree">
    <div className="turn-tree-header"><h2>Turns</h2><div className="turn-pagination">
      <button type="button" disabled={page <= 1} onClick={onPagePrevious}>이전</button>
      <span>Page {page}</span>
      <button type="button" disabled={!hasNext} onClick={onPageNext}>다음</button>
    </div></div>
    {nodes.length === 0 && <p>표시할 turn이 없습니다.</p>}
    {nodes.map((node) => {
      const isCollapsed = collapsed.has(node.id);
      return <section className="turn-node" key={`${node.kind}:${node.id}`}>
        <div className="turn-node-header">
          <button type="button" className="turn-collapse" onClick={() => toggleCollapsed(node.id)} aria-label={`${isCollapsed ? '펼치기' : '접기'} ${node.title || node.id}`} aria-expanded={!isCollapsed}>
            {isCollapsed ? '▸' : '▾'}
          </button>
          <button type="button" className={`turn-title ${selectedTurn === node.id ? 'selected' : ''}`} onClick={() => onTurn(node.id)}>
            {node.kind === 'legacy' ? 'Legacy' : 'Turn'} {node.title || node.id.slice(0, 8)} · {node.status} ({node.traffic_count})
          </button>
          <button type="button" className="turn-flag" onClick={() => onToggleFlag(node.id, !node.flag)} aria-label={`${node.flag ? 'Unflag' : 'Flag'} ${node.id}`}>{node.flag ? '★' : '☆'}</button>
        </div>
        <div className="turn-actions">
          <button type="button" onClick={() => onRename(node.id, window.prompt('Turn 제목', node.title ?? '') || null)}>제목</button>
          {node.kind === 'turn' && <button type="button" onClick={() => onDelete(node.id)}>삭제</button>}
        </div>
        {!isCollapsed && <div className="traffic-children">
          {node.traffic.map((traffic) => <div className="traffic-child-row" key={traffic.id}>
            <button type="button" className={selectedTraffic === traffic.id ? 'selected' : ''} onClick={() => onTraffic(node.id, traffic.id)}>
              Traffic {traffic.title || (traffic.turn_sequence ?? '—')} · {traffic.status}
            </button>
            <button type="button" className="traffic-rename" onClick={() => onRenameTraffic(traffic.id, window.prompt('Traffic 제목', traffic.title ?? '') || null)}>제목</button>
          </div>)}
        </div>}
      </section>;
    })}
  </nav>;
}
