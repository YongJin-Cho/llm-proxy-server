import { useMemo, useState, type ReactNode } from 'react';
import JsonView from '@uiw/react-json-view';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { curatedLanguages, parseJsonContent, resolveSelection, serializeViewerContent, type ViewerMode, type ViewerSelection } from '../data-query/content-viewer';

loader.config({ monaco });

type Props = { label: string; content?: unknown; hint?: string };
type StringTarget = { path: string; value: string };

const modeLabels: Array<[ViewerMode, string]> = [
  ['auto', 'Auto'], ['json', 'JSON'], ['markdown', 'Markdown'], ['code', 'Code'], ['plain-text', 'Plain text'],
];

function byteLength(content: string) {
  return new TextEncoder().encode(content).byteLength.toLocaleString();
}

function StringLeaf({ path, value, onOpen }: { path: string; value: string; onOpen: (target: StringTarget) => void }) {
  const isTruncated = value.length > 160;
  const preview = isTruncated ? `${value.slice(0, 160)}…` : value;
  return <span className="json-string-leaf">
    <span className="json-string-preview">&quot;{preview}&quot;</span>
    {isTruncated && <button type="button" className="icon-button json-string-expand" onClick={() => onOpen({ path, value })} aria-label={`${path} 문자열 전체 보기`} title="문자열 확대">
      <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
    </button>}
  </span>;
}

function JsonContainerNode({ path, value, onOpen }: { path: string; value: unknown; onOpen: (target: StringTarget) => void }): ReactNode {
  if (typeof value === 'string') return <StringLeaf path={path} value={value} onOpen={onOpen} />;
  if (value === null || typeof value !== 'object') return <span>{String(value)}</span>;
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
  return <details className="json-container-node" open>
    <summary>{Array.isArray(value) ? `Array(${entries.length})` : `Object(${entries.length})`}</summary>
    <div className="json-container-children">
      {entries.map(([key, child]) => <div className="json-container-row" key={`${path}.${key}`}><strong>{key}: </strong>{JsonContainerNode({ path: `${path}.${key}`, value: child, onOpen })}</div>)}
    </div>
  </details>;
}

function PopupViewer({ target, onClose }: { target: StringTarget; onClose: () => void }) {
  const [selection, setSelection] = useState<ViewerSelection>({ mode: 'auto' });
  const resolved = useMemo(() => resolveSelection(target.value, selection), [target.value, selection]);
  const changeMode = (mode: ViewerMode) => setSelection(mode === 'code' ? { mode, language: resolved.language ?? 'plaintext' } : { mode });
  const changeLanguage = (language: string) => setSelection({ mode: 'code', language });

  return <div className="viewer-popup-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="viewer-popup" role="dialog" aria-modal="true" aria-label={`문자열 viewer: ${target.path}`}>
      <header className="viewer-popup-header">
        <div className="viewer-controls">
          <label><select aria-label="표시 형식" value={selection.mode} onChange={(event) => changeMode(event.target.value as ViewerMode)}>{modeLabels.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
          {selection.mode === 'code' && <label><select aria-label="언어" value={selection.language ?? 'plaintext'} onChange={(event) => changeLanguage(event.target.value)}>{curatedLanguages.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select></label>}
          <span className="viewer-size">{byteLength(target.value)} bytes</span>
        </div>
        <button type="button" className="viewer-popup-close" onClick={onClose} aria-label="문자열 viewer 닫기" title="닫기">×</button>
      </header>
      <div className="viewer-body">
        {resolved.selectedMode === 'json' && resolved.parsedJson !== undefined && <JsonView value={resolved.parsedJson as object} displayDataTypes={false} enableClipboard={false} />}
        {resolved.selectedMode === 'markdown' && <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{target.value}</ReactMarkdown>}
        {resolved.selectedMode === 'code' && <Editor height="420px" language={resolved.language ?? 'plaintext'} value={target.value} theme="light" options={{ readOnly: true, minimap: { enabled: false }, domReadOnly: true, contextmenu: false, wordWrap: 'on' }} />}
        {resolved.selectedMode === 'plain-text' && <pre>{target.value}</pre>}
      </div>
    </section>
  </div>;
}

export function ContentViewer({ label, content, hint }: Props) {
  const [target, setTarget] = useState<StringTarget>();
  const [selection, setSelection] = useState<ViewerSelection>({ mode: 'auto' });
  const source = useMemo(() => serializeViewerContent(content), [content]);
  const parsed = useMemo(() => parseJsonContent(source), [source]);
  const isJsonContainer = (label === 'request' || label === 'response') && parsed !== undefined && typeof parsed === 'object' && parsed !== null;
  const resolved = useMemo(() => resolveSelection(source, selection, hint), [source, selection, hint]);
  if (!content) return <section className="content-viewer"><h4>{label}</h4><p>—</p></section>;

  if (isJsonContainer) return <section className="content-viewer json-container-viewer" aria-label={`${label} JSON tree`}>
    <div className="viewer-body json-container-body">
      <div className="json-container-row json-container-root-row"><strong>{label}: </strong><JsonContainerNode path="$" value={parsed} onOpen={setTarget} /></div>
    </div>
    {target && <PopupViewer key={target.path} target={target} onClose={() => setTarget(undefined)} />}
  </section>;

  const changeMode = (mode: ViewerMode) => setSelection(mode === 'code' ? { mode, language: resolved.language ?? 'plaintext' } : { mode });
  const changeLanguage = (language: string) => setSelection({ mode: 'code', language });
  return <section className="content-viewer" aria-label={`${label} content viewer`}>
    <div className="viewer-header"><h4>{label}</h4><div className="viewer-controls">
      <label>표시 형식<select value={selection.mode} onChange={(event) => changeMode(event.target.value as ViewerMode)} aria-label={`${label} 표시 형식`}>{modeLabels.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
      {selection.mode === 'code' && <label><select aria-label={`${label} 코드 언어`} value={selection.language ?? 'plaintext'} onChange={(event) => changeLanguage(event.target.value)}>{curatedLanguages.map(({ id, label: text }) => <option key={id} value={id}>{text}</option>)}</select></label>}
      <span className="viewer-meta">감지: {resolved.detectedMode}{resolved.fallbackReason ? ` · fallback: ${resolved.fallbackReason}` : ''}</span>
    </div></div>
    <details open><summary>전체 보기 ({byteLength(source)} bytes)</summary><div className="viewer-body">
      {resolved.selectedMode === 'json' && resolved.parsedJson !== undefined && <JsonView value={resolved.parsedJson as object} displayDataTypes={false} enableClipboard={false} />}
      {resolved.selectedMode === 'markdown' && <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{source}</ReactMarkdown>}
      {resolved.selectedMode === 'code' && <Editor height="420px" language={resolved.language ?? 'plaintext'} value={source} theme="light" options={{ readOnly: true, minimap: { enabled: false }, domReadOnly: true, contextmenu: false, wordWrap: 'on' }} />}
      {resolved.selectedMode === 'plain-text' && <pre>{source}</pre>}
    </div></details>
  </section>;
}
