import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { TurnNoteProjection } from '../types';

type Props = { notes?: TurnNoteProjection | null };

export function NoteCard({ notes }: Props) {
  const items = notes?.notes ?? [];
  return <>{items.map((note, index) => <section className="card turn-note-card" aria-label={note.title} key={`${note.title}-${index}`}>
    <h2>{note.title}</h2>
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{note.content}</ReactMarkdown>
  </section>)}</>;
}
