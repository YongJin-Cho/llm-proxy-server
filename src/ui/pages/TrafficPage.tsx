import { useEffect, useState } from 'react';
import { deleteTurn, fetchLog, fetchLogs, fetchTurns, updateTurnMetadata } from '../data-query/log-api';
import { Filters } from '../components/Filters';
import { LogDetail } from '../components/LogDetail';
import { LogTable } from '../components/LogTable';
import { TurnTree } from '../components/TurnTree';
import { emptyFilters, type Filters as FiltersValue, type Log, type TurnNode } from '../types';

const limit = 20;
type TurnFilter = 'all' | 'flagged';

function readSelection() {
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
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [offset, setOffset] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [detail, setDetail] = useState<Log>();
  const [turns, setTurns] = useState<TurnNode[]>([]);
  const [turnFilter, setTurnFilter] = useState<TurnFilter>('all');
  const [turnPage, setTurnPage] = useState(1);
  const [turnHasNext, setTurnHasNext] = useState(false);
  const [selection, setSelection] = useState(readSelection);
  const [error, setError] = useState('');
  const [treeLoading, setTreeLoading] = useState(true);

  const load = () => fetchLogs(filters, offset, limit).then(setLogs).catch((reason: Error) => setError(reason.message));
  const loadTurns = (page = turnPage, filter = turnFilter) => fetchTurns(page, limit, filter).then((result) => {
    if (result.data.length === 0 && page > 1) { setTurnPage(page - 1); return; }
    setTurns(result.data);
    setTurnHasNext(result.has_next);
  }).catch((reason: Error) => setError(reason.message));

  useEffect(() => { setTreeLoading(true); loadTurns().finally(() => setTreeLoading(false)); }, [turnPage, turnFilter]);
  useEffect(() => { if (!detail) load(); }, [filters, offset, detail]);
  useEffect(() => {
    const onPopState = () => setSelection(readSelection());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const changeFilters = (next: FiltersValue) => { setFilters(next); setOffset(0); };
  const changeTurnFilter = (next: TurnFilter) => { setTurnFilter(next); setTurnPage(1); };
  const selectTurn = (id: string) => { writeSelection(id); setSelection({ turn: id }); setDetail(undefined); };
  const selectTraffic = (turnId: string, id: string) => { writeSelection(turnId, id); setSelection({ turn: turnId, traffic: id }); fetchLog(id).then(setDetail).catch((reason: Error) => setError(reason.message)); };
  const renameTurn = (id: string, title: string | null) => updateTurnMetadata(id, { title }).then(() => loadTurns()).catch((reason: Error) => setError(reason.message));
  const toggleTurnFlag = (id: string, flag: boolean) => updateTurnMetadata(id, { flag }).then(() => loadTurns()).catch((reason: Error) => setError(reason.message));
  const removeTurn = (id: string) => {
    if (!window.confirm('이 turn과 child traffic을 삭제할까요?')) return;
    deleteTurn(id).then(() => { if (selection.turn === id) { writeSelection(); setSelection({}); setDetail(undefined); } return loadTurns(); }).catch((reason: Error) => setError(reason.message));
  };
  const selectedTurn = turns.find((turn) => turn.id === selection.turn);

  const sidebar = <aside>
    <div className="turn-filter" role="group" aria-label="Turn filter">
      <button type="button" className={turnFilter === 'all' ? 'selected' : ''} onClick={() => changeTurnFilter('all')}>전체</button>
      <button type="button" className={turnFilter === 'flagged' ? 'selected' : ''} onClick={() => changeTurnFilter('flagged')}>Flagged</button>
    </div>
    <TurnTree nodes={turns} selectedTurn={selection.turn} selectedTraffic={selection.traffic} onTurn={selectTurn} onTraffic={selectTraffic} onRename={renameTurn} onToggleFlag={toggleTurnFlag} onDelete={removeTurn} />
    <div className="turn-pagination">
      <button type="button" disabled={turnPage <= 1} onClick={() => setTurnPage((page) => Math.max(1, page - 1))}>이전</button>
      <span>Page {turnPage}</span>
      <button type="button" disabled={!turnHasNext} onClick={() => setTurnPage((page) => page + 1)}>다음</button>
    </div>
  </aside>;

  if (detail) return <main className="traffic-layout">{sidebar}
    <section className="traffic-content"><LogDetail log={detail} onBack={() => { writeSelection(selection.turn); setSelection({ turn: selection.turn }); setDetail(undefined); }} /></section>
  </main>;

  return <main className="traffic-layout">{sidebar}
    <section className="traffic-content"><h1>LLM Proxy Traffic</h1>
      {treeLoading && <p>turn을 불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {selectedTurn && <section className="card" aria-label="Turn summary">
        <h2>{selectedTurn.title || `Turn ${selectedTurn.id.slice(0, 8)}`}</h2>
        <p>상태: {selectedTurn.summary.status} · traffic: {selectedTurn.summary.traffic_count} · 모델: {selectedTurn.summary.model || '—'} · 처리 시간: {selectedTurn.summary.duration_ms ?? '—'}ms</p>
        <p>Usage: input {selectedTurn.summary.usage.input_tokens ?? '—'} · output {selectedTurn.summary.usage.output_tokens ?? '—'} · total {selectedTurn.summary.usage.total_tokens ?? '—'} · cost {selectedTurn.summary.usage.cost_usd ?? '—'} {selectedTurn.summary.usage.partial ? '(partial)' : ''}</p>
        {selectedTurn.summary.start_user_input !== null && <pre>{JSON.stringify(selectedTurn.summary.start_user_input, null, 2)}</pre>}
        {selectedTurn.summary.end_ai_output !== null && <pre>{JSON.stringify(selectedTurn.summary.end_ai_output, null, 2)}</pre>}
      </section>}
      <Filters value={filters} onChange={changeFilters} onReset={() => changeFilters(emptyFilters)} />
      <LogTable logs={logs} offset={offset} limit={limit} onSelect={selectTraffic} onPrevious={() => setOffset(Math.max(0, offset - limit))} onNext={() => setOffset(offset + limit)} />
    </section>
  </main>;
}
