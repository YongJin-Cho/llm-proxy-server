import hljs from 'highlight.js/lib/common';

export type ViewerMode = 'auto' | 'json' | 'markdown' | 'code' | 'plain-text';
export type ViewerSelection = { mode: ViewerMode; language?: string };
export type Detection = {
  detectedMode: Exclude<ViewerMode, 'auto'>;
  language?: string;
  parsedJson?: unknown;
  fallbackReason?: string;
};

export const curatedLanguages = [
  { id: 'plaintext', label: 'Plain text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'shell', label: 'Bash / Shell' },
  { id: 'sql', label: 'SQL' },
  { id: 'yaml', label: 'YAML' },
  { id: 'xml', label: 'HTML / XML' },
  { id: 'css', label: 'CSS' },
] as const;

const languageAliases: Record<string, string> = {
  bash: 'shell', sh: 'shell', html: 'xml', md: 'markdown', ts: 'typescript', js: 'javascript', yml: 'yaml',
};

const supportedLanguages: Set<string> = new Set(curatedLanguages.map(({ id }) => id));
const markdownPattern = /(^#{1,6}\s|```[\s\S]*```|(^|\n)\s*[-*+]\s+|\[[^\]]+\]\([^\)]+\)|(^|\n)>\s)/m;

export function parseJsonContent(content: string): unknown | undefined {
  try { return JSON.parse(content) as unknown; } catch { return undefined; }
}

function explicitHint(hint?: string): { mode?: Exclude<ViewerMode, 'auto'>; language?: string } {
  if (!hint) return {};
  const normalized = hint.toLowerCase().replace(/^\./, '');
  if (normalized === 'json') return { mode: 'json' };
  if (normalized === 'markdown' || normalized === 'md') return { mode: 'markdown' };
  const language = languageAliases[normalized] ?? normalized;
  return supportedLanguages.has(language) ? { mode: language === 'plaintext' ? 'plain-text' : 'code', language } : {};
}

export function detectContent(content: string, hint?: string): Detection {
  const hinted = explicitHint(hint);
  if (hinted.mode === 'json') {
    const parsedJson = parseJsonContent(content);
    return parsedJson === undefined ? { detectedMode: 'plain-text', fallbackReason: 'JSON hint could not be parsed' } : { detectedMode: 'json', parsedJson };
  }
  if (hinted.mode === 'markdown') return { detectedMode: 'markdown' };
  if (hinted.mode === 'code') return { detectedMode: 'code', language: hinted.language };
  if (hinted.mode === 'plain-text') return { detectedMode: 'plain-text' };

  const parsedJson = parseJsonContent(content);
  if (parsedJson !== undefined) return { detectedMode: 'json', parsedJson };
  if (markdownPattern.test(content)) return { detectedMode: 'markdown' };

  const highlighted = hljs.highlightAuto(content);
  const language = highlighted.language ? languageAliases[highlighted.language] ?? highlighted.language : undefined;
  if (language && supportedLanguages.has(language) && (highlighted.relevance ?? 0) >= 3) return { detectedMode: 'code', language };
  return { detectedMode: 'plain-text', fallbackReason: 'No confident supported format was detected' };
}

export function resolveSelection(content: string, selection: ViewerSelection, hint?: string): Detection & { selectedMode: Exclude<ViewerMode, 'auto'>; language?: string } {
  const detected = detectContent(content, hint);
  if (selection.mode === 'auto') return { ...detected, selectedMode: detected.detectedMode };
  if (selection.mode === 'json') {
    const parsedJson = parseJsonContent(content);
    return parsedJson === undefined
      ? { ...detected, selectedMode: 'plain-text', fallbackReason: 'Selected JSON mode could not parse this content' }
      : { ...detected, parsedJson, selectedMode: 'json' };
  }
  if (selection.mode === 'markdown') return { ...detected, selectedMode: 'markdown' };
  if (selection.mode === 'plain-text') return { ...detected, selectedMode: 'plain-text' };
  const language = selection.language && supportedLanguages.has(selection.language) ? selection.language : undefined;
  return language && language !== 'plaintext'
    ? { ...detected, selectedMode: 'code', language }
    : { ...detected, selectedMode: 'plain-text', fallbackReason: 'Unsupported code language selection' };
}

export function utf8ByteLength(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}
