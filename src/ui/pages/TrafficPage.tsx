import { useEffect, useState } from 'react';
import { fetchLog, fetchLogs, fetchTurns } from '../data-query/log-api';
import { Filters } from '../components/Filters';
import { LogDetail } from '../components/LogDetail';
import { LogTable } from '../components/LogTable';
import { TurnTree } from '../components/TurnTree';
import { emptyFilters, type Filters as FiltersValue, type Log, type TurnNode } from '../types';

const limit = 20;

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
  const [selection, setSelection] = useState(readSelection);
  const [error, setError] = useState('');
  const [treeLoading, setTreeLoading] = useState(true);

  const load = () => fetchLogs(filters, offset, limit).then(setLogs).catch((reason: Error) => setError(reason.message));

  useEffect(() => {
    setTreeLoading(true);
    fetchTurns().then((page) => setTurns(page.data)).catch((reason: Error) => setError(reason.message)).finally(() => setTreeLoading(false));
  }, []);
  useEffect(() => { if (!detail) load(); }, [filters, offset, detail]);
  useEffect(() => {
    const onPopState = () => setSelection(readSelection());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const changeFilters = (next: FiltersValue) => { setFilters(next); setOffset(0); };
  const selectTurn = (id: string) => { writeSelection(id); setSelection({ turn: id }); setDetail(undefined); };
  const selectTraffic = (turnId: string, id: string) => { writeSelection(turnId, id); setSelection({ turn: turnId, traffic: id }); fetchLog(id).then(setDetail).catch((reason: Error) => setError(reason.message)); };

  const sidebar = <TurnTree nodes={turns} selectedTurn={selection.turn} selectedTraffic={selection.traffic} onTurn={selectTurn} onTraffic={selectTraffic} />;

  if (detail) return <main className="traffic-layout">{sidebar}
    <section className="traffic-content"><LogDetail log={detail} onBack={() => { writeSelection(selection.turn); setSelection({ turn: selection.turn }); setDetail(undefined); }} /></section>
  </main>;

  return <main className="traffic-layout">{sidebar}
    <section className="traffic-content"><h1>LLM Proxy Traffic</h1>
      {treeLoading && <p>turn을 불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {selection.turn && <p className="card">선택한 turn: {selection.turn} · sidebar에서 traffic을 선택하면 상세를 조회합니다.</p>}
      <Filters value={filters} onChange={changeFilters} onReset={() => changeFilters(emptyFilters)} />
      <LogTable logs={logs} offset={offset} limit={limit} onSelect={selectTraffic} onPrevious={() => setOffset(Math.max(0, offset - limit))} onNext={() => setOffset(offset + limit)} />
    </section>
  </main>;
}
