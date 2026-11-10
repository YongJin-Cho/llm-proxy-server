import type { Log } from '../types';
import { LogDetail } from './LogDetail';

type Props = {
  log?: Log;
  loading?: boolean;
  error?: string;
  onBack: () => void;
};

export function TrafficView({ log, loading, error, onBack }: Props) {
  if (loading) return <section className="card" aria-label="Traffic view loading"><button type="button" onClick={onBack}>← turn</button><p>traffic를 불러오는 중…</p></section>;
  if (error) return <section className="card" aria-label="Traffic view error"><button type="button" onClick={onBack}>← turn</button><p className="error">{error}</p></section>;
  if (!log) return <section className="card" aria-label="Traffic view empty"><button type="button" onClick={onBack}>← turn</button><p>traffic를 선택하세요.</p></section>;
  return <LogDetail log={log} onBack={onBack} />;
}
