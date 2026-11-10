import { useEffect, useState } from 'react';
import { deleteTurn, fetchLog, fetchTurns, updateTurnMetadata } from '../data-query/log-api';
import { TrafficView } from '../components/TrafficView';
import { TurnTree } from '../components/TurnTree';
import { TurnView } from '../components/TurnView';
import { type Log, type TurnNode } from '../types';

const limit = 20;
type TurnFilter = 'all' | 'flagged';

type Selection = { turn?: string; traffic?: string };

function readSelection(): Selection {
  const params = new URLSearchParams(window.location.search);
  return { turn: params.get('turn') ?? undefined, traffic: params.get('traffic') ?? undefined };
}
function writeSelection(turn?: string, traffic?: string) {
  const params = new URLSearchParams();
  if (turn) params.set('turn', turn);
  if (traffic) params.set('traffic', traffic);
  window.history.pushState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
}

export function TrafficPage() {
  const [detail, setDetail] = useState<Log>();
  const [turns, setTurns] = useState<TurnNode[]>([]);
  const [turnFilter, setTurnFilter] = useState<TurnFilter>('all');
  const [turnPage, setTurnPage] = useState(1);
  const [turnHasNext, setTurnHasNext] = useState(false);
  const [selection, setSelection] = useState<Selection>(readSelection);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [treeLoading, setTreeLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTurns = (page = turnPage, filter = turnFilter) => fetchTurns(page, limit, filter).then((result) => {
    if (result.data.length === 0 && page > 1) { setTurnPage(page - 1); return; }
    setTurns(result.data);
    setTurnHasNext(result.has_next);
    if (!selection.turn && result.data[0]) {
      writeSelection(result.data[0].id);
      setSelection({ turn: result.data[0].id });
    }
  }).catch((reason: Error) => setError(reason.message));

  useEffect(() => {
    setTreeLoading(true);
    setError('');
    loadTurns().finally(() => setTreeLoading(false));
  }, [turnPage, turnFilter]);

  useEffect(() => {
    const onPopState = () => {
      setSelection(readSelection());
      setDetail(undefined);
      setDetailError('');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!selection.traffic) {
      setDetail(undefined);
      setDetailError('');
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    fetchLog(selection.traffic)
      .then(setDetail)
      .catch((reason: Error) => { setDetail(undefined); setDetailError(reason.message); })
      .finally(() => setDetailLoading(false));
  }, [selection.traffic]);

  const changeTurnFilter = (next: TurnFilter) => { setTurnFilter(next); setTurnPage(1); };
  const selectTurn = (id: string) => { writeSelection(id); setSelection({ turn: id }); };
  const selectTraffic = (turnId: string, id: string) => { writeSelection(turnId, id); setSelection({ turn: turnId, traffic: id }); };
  const renameTurn = (id: string, title: string | null) => updateTurnMetadata(id, { title }).then(() => loadTurns()).catch((reason: Error) => setError(reason.message));
  const toggleTurnFlag = (id: string, flag: boolean) => updateTurnMetadata(id, { flag }).then(() => loadTurns()).catch((reason: Error) => setError(reason.message));
  const removeTurn = (id: string) => {
    if (!window.confirm('이 turn과 child traffic을 삭제할까요?')) return;
    deleteTurn(id).then(() => { if (selection.turn === id) { writeSelection(); setSelection({}); } return loadTurns(); }).catch((reason: Error) => setError(reason.message));
  };
  const selectedTurn = turns.find((turn) => turn.id === selection.turn);

  const sidebar = <aside>
    <div className="turn-filter" role="group" aria-label="Turn filter">
      <button type="button" className={turnFilter === 'all' ? 'selected' : ''} onClick={() => changeTurnFilter('all')}>전체</button>
      <button type="button" className={turnFilter === 'flagged' ? 'selected' : ''} onClick={() => changeTurnFilter('flagged')}>Flagged</button>
    </div>
    <TurnTree nodes={turns} selectedTurn={selection.turn} selectedTraffic={selection.traffic} page={turnPage} hasNext={turnHasNext} onPagePrevious={() => setTurnPage((page) => Math.max(1, page - 1))} onPageNext={() => setTurnPage((page) => page + 1)} onTurn={selectTurn} onTraffic={selectTraffic} onRename={renameTurn} onToggleFlag={toggleTurnFlag} onDelete={removeTurn} />
  </aside>;

  return <main className="traffic-layout">{sidebar}
    <section className="traffic-content">
      {selection.traffic
        ? <TrafficView log={detail} loading={detailLoading} error={detailError} onBack={() => { writeSelection(selection.turn); setSelection({ turn: selection.turn }); }} />
        : <TurnView turn={selectedTurn} loading={treeLoading} onTraffic={selectTraffic} />}
      {error && <p className="error">{error}</p>}
    </section>
  </main>;
}
