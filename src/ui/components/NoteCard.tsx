import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { TurnNote, TurnNoteProjection } from '../types';
import { ContentViewer } from './ContentViewer';

type Props = { notes?: TurnNoteProjection | null };

function NoteBody({ note }: { note: TurnNote }) {
  return <>
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{note.content}</ReactMarkdown>
    {note.call !== undefined && <div className="note-tool-payloads">
      <ContentViewer label="call" content={note.call} hint="json" />
      <ContentViewer label="result" content={note.result} hint="json" />
    </div>}
  </>;
}

export function NoteCard({ notes }: Props) {
  const items = notes?.notes ?? [];
  if (items.length === 0) return null;

  return <>{items.map((note, index) => <section className="card turn-note-card" aria-label={note.title} key={`${note.title}-${index}`}>
    <h2>{note.title}</h2>
    <NoteBody note={note} />
  </section>)}</>;
}
