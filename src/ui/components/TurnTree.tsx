import { useEffect, useRef, useState } from 'react';
import type { TurnNode } from '../types.js';

type Props = {
  nodes: TurnNode[];
  selectedTurn?: string;
  selectedTraffic?: string;
  page: number;
  hasNext: boolean;
  onPagePrevious: () => void;
  onPageNext: () => void;
  onDeleteUnflaggedPage: () => void;
  onTurn: (id: string) => void;
  onTraffic: (turnId: string, trafficId: string) => void;
  onRename: (id: string, title: string | null) => void;
  onToggleFlag: (id: string, flag: boolean) => void;
  onDelete: (id: string) => void;
};

export function TurnTree({ nodes, selectedTurn, selectedTraffic, page, hasNext, onPagePrevious, onPageNext, onDeleteUnflaggedPage, onTurn, onTraffic, onRename, onToggleFlag, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string>();
  const initialExpansionApplied = useRef(false);

  useEffect(() => {
    if (initialExpansionApplied.current || nodes.length === 0) return;
    setCollapsed(new Set(nodes.slice(1).map((node) => node.id)));
    initialExpansionApplied.current = true;
  }, [nodes]);

  const toggleCollapsed = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <nav className="turn-tree" aria-label="Turn traffic tree">
    <div className="turn-tree-header"><h2>Turns</h2><div className="turn-pagination">
      <button type="button" className="pagination-arrow" disabled={page <= 1} onClick={onPagePrevious} aria-label="Previous page">◀</button>
      <span className="pagination-page">Page {page}</span>
      <button type="button" className="pagination-arrow" disabled={!hasNext} onClick={onPageNext} aria-label="Next page">▶</button>
      <button type="button" className="pagination-trash" onClick={onDeleteUnflaggedPage} aria-label="Delete unflagged turns on this page" title="현재 page의 unflagged turn 삭제">🗑</button>
    </div></div>
    {nodes.length === 0 && <p>표시할 turn이 없습니다.</p>}
    {nodes.map((node) => {
      const isCollapsed = collapsed.has(node.id);
      return <section className="turn-node" key={`${node.kind}:${node.id}`}>
        <div className="turn-node-header">
          <button type="button" className="turn-collapse icon-button" onClick={() => toggleCollapsed(node.id)} aria-label={`${isCollapsed ? '펼치기' : '접기'} ${node.title || node.id}`} aria-expanded={!isCollapsed}>
            {isCollapsed ? '▸' : '▾'}
          </button>
          <button type="button" className={`turn-flag icon-button ${node.flag ? 'flagged' : ''}`} onClick={() => onToggleFlag(node.id, !node.flag)} aria-label={`${node.flag ? 'Unflag' : 'Flag'} ${node.id}`}>{node.flag ? '★' : '☆'}</button>
          <button type="button" className={`turn-title text-button ${selectedTurn === node.id ? 'selected' : ''}`} onClick={() => onTurn(node.id)}>
            {node.kind === 'legacy' ? 'Legacy' : 'Turn'} {node.title || node.id.slice(0, 8)} <span className="turn-meta">· {node.status} ({node.traffic_count})</span>
          </button>
          <div className="turn-menu-wrap">
            <button type="button" className="turn-menu icon-button" aria-label={`${node.title || node.id} 메뉴`} aria-haspopup="menu" aria-expanded={openMenu === node.id} onClick={() => setOpenMenu((current) => current === node.id ? undefined : node.id)}>•••</button>
            {openMenu === node.id && <div className="turn-menu-list" role="menu">
              <button type="button" role="menuitem" onClick={() => { setOpenMenu(undefined); onRename(node.id, window.prompt('Turn 제목', node.title ?? '') || null); }}>이름 변경</button>
              <button type="button" role="menuitem" onClick={() => { setOpenMenu(undefined); onDelete(node.id); }}>삭제</button>
            </div>}
          </div>
        </div>
        {!isCollapsed && <div className="traffic-children">
          {node.traffic.map((traffic) => <button type="button" className={`traffic-child text-button ${selectedTraffic === traffic.id ? 'selected' : ''}`} key={traffic.id} onClick={() => onTraffic(node.id, traffic.id)}>
            <span className="traffic-kind">Traffic</span> {traffic.title || (traffic.turn_sequence ?? '—')} <span className="traffic-meta">· {traffic.status}</span>
          </button>)}
        </div>}
      </section>;
    })}
  </nav>;
}
