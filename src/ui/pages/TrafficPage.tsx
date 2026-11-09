import { useEffect, useState } from 'react';
import { fetchLog, fetchLogs } from '../data-query/log-api';
import { Filters } from '../components/Filters';
import { LogDetail } from '../components/LogDetail';
import { LogTable } from '../components/LogTable';
import { emptyFilters, type Filters as FiltersValue, type Log } from '../types';

const limit = 20;

export function TrafficPage() {
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [offset, setOffset] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [detail, setDetail] = useState<Log>();
  const [error, setError] = useState('');

  const load = () => fetchLogs(filters, offset, limit)
    .then(setLogs)
    .catch((reason: Error) => setError(reason.message));

  useEffect(() => {
    if (!detail) load();
  }, [filters, offset, detail]);

  const changeFilters = (next: FiltersValue) => {
    setFilters(next);
    setOffset(0);
  };

  const selectLog = (id: string) => fetchLog(id)
    .then(setDetail)
    .catch((reason: Error) => setError(reason.message));

  if (detail) return <main><LogDetail log={detail} onBack={() => setDetail(undefined)} /></main>;

  return <main><h1>LLM Proxy Traffic</h1>
    <Filters value={filters} onChange={changeFilters} onReset={() => changeFilters(emptyFilters)} />
    {error && <p className="error">{error}</p>}
    <LogTable logs={logs} offset={offset} limit={limit} onSelect={selectLog} onPrevious={() => setOffset(Math.max(0, offset - limit))} onNext={() => setOffset(offset + limit)} />
  </main>;
}
