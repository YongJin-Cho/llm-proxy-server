import { useMemo, useState } from 'react';
import JsonView from '@uiw/react-json-view';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { curatedLanguages, resolveSelection, type ViewerMode, type ViewerSelection } from '../data-query/content-viewer';

loader.config({ monaco });

type Props = { label: string; content?: string | null; hint?: string };

const modeLabels: Array<[ViewerMode, string]> = [
  ['auto', 'Auto'], ['json', 'JSON'], ['markdown', 'Markdown'], ['code', 'Code'], ['plain-text', 'Plain text'],
];

export function ContentViewer({ label, content, hint }: Props) {
  const [selection, setSelection] = useState<ViewerSelection>({ mode: 'auto' });
  const source = content ?? '';
  const resolved = useMemo(() => resolveSelection(source, selection, hint), [source, selection, hint]);
  if (!content) return <section className="content-viewer"><h4>{label}</h4><p>—</p></section>;

  const changeMode = (mode: ViewerMode) => setSelection(mode === 'code' ? { mode, language: resolved.language ?? 'plaintext' } : { mode });
  const changeLanguage = (language: string) => setSelection({ mode: 'code', language });
  const common = <>
    <label>표시 형식
      <select value={selection.mode} onChange={(event) => changeMode(event.target.value as ViewerMode)} aria-label={`${label} 표시 형식`}>
        {modeLabels.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
    {selection.mode === 'code' && <label>언어
      <select value={selection.language ?? 'plaintext'} onChange={(event) => changeLanguage(event.target.value)} aria-label={`${label} 코드 언어`}>
        {curatedLanguages.map(({ id, label: text }) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>}
    <span className="viewer-meta">감지: {resolved.detectedMode}{resolved.fallbackReason ? ` · fallback: ${resolved.fallbackReason}` : ''}</span>
  </>;

  return <section className="content-viewer" aria-label={`${label} content viewer`}>
    <div className="viewer-header"><h4>{label}</h4><div className="viewer-controls">{common}</div></div>
    <details open>
      <summary>전체 보기 ({new TextEncoder().encode(source).byteLength.toLocaleString()} bytes)</summary>
      <div className="viewer-body">
        {resolved.selectedMode === 'json' && resolved.parsedJson !== undefined && <JsonView value={resolved.parsedJson as object} displayDataTypes={false} enableClipboard={false} />}
        {resolved.selectedMode === 'markdown' && <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{source}</ReactMarkdown>}
        {resolved.selectedMode === 'code' && <Editor height="420px" language={resolved.language ?? 'plaintext'} value={source} theme="light" options={{ readOnly: true, minimap: { enabled: false }, domReadOnly: true, contextmenu: false, wordWrap: 'on' }} />}
        {resolved.selectedMode === 'plain-text' && <pre>{source}</pre>}
      </div>
    </details>
  </section>;
}
