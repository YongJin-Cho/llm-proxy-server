import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { TurnNoteProjection } from '../types';

type Props = { notes?: TurnNoteProjection | null };

export function NoteCard({ notes }: Props) {
  const projection = notes ?? { status: 'pending' as const, notes: [], error_message: null, retryable: false };
  return <section className="card turn-note-card" aria-label="Turn analysis notes">
    <div className="note-card-header"><h2>Turn notes</h2><span className={`status note-${projection.status}`}>{projection.status}</span></div>
    {projection.status === 'pending' && <p>도구 사용 이력을 분석하는 중입니다…</p>}
    {projection.status === 'empty' && <p>도구 사용 이력이 없습니다.</p>}
    {projection.status === 'failed' && <p className="error">분석을 완료하지 못했습니다.{projection.error_message ? ` ${projection.error_message}` : ''}{projection.retryable ? ' 재시도 예정입니다.' : ''}</p>}
    {projection.status === 'ready' && projection.notes.map((note, index) => <article className="turn-note" key={`${note.title}-${index}`}><h3>{note.title}</h3><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{note.content}</ReactMarkdown></article>)}
  </section>;
}
