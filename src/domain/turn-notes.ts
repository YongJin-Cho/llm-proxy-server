import type { TrafficLogApiKind } from './traffic-log.js';

export type TurnNote = { title: string; content: string };
export type TurnNoteStatus = 'pending' | 'ready' | 'empty' | 'failed';

export type TurnAnalysisTraffic = {
  apiKind: TrafficLogApiKind;
  sequence: number;
  status: string;
  request: unknown;
  response: unknown;
};

export type TurnAnalysisInput = { turnId: string; analysisVersion: number; traffic: TurnAnalysisTraffic[] };
export type TurnAnalysisResult = {
  status: Exclude<TurnNoteStatus, 'pending'>;
  notes: TurnNote[];
  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;
};

export interface TurnAnalysisAdapter {
  readonly apiKind: TrafficLogApiKind;
  analyze(input: TurnAnalysisInput): TurnAnalysisResult;
}

export type TurnNoteProjection = {
  turn_id: string;
  analysis_version: number;
  status: TurnNoteStatus;
  notes: TurnNote[];
  error_code: string | null;
  error_message: string | null;
  retryable: boolean;
  attempt_count: number;
  updated_at: string;
};

export type StoredTurnAnalysis = { turnId: string; analysisVersion: number; traffic: TurnAnalysisTraffic[] };

export interface TurnAnalysisPersistence {
  getTurnForAnalysis(turnId: string): StoredTurnAnalysis | undefined;
  listPendingTurnAnalyses(): Array<{ turnId: string; analysisVersion: number }>;
  ensureTurnNotePending(turnId: string, analysisVersion: number): boolean;
  saveTurnNoteResult(input: { turnId: string; analysisVersion: number; result: TurnAnalysisResult }): void;
  getTurnNote(turnId: string): TurnNoteProjection | null;
}

function objects(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}
function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try { return JSON.stringify(value); } catch { return String(value); }
}
function toolCalls(value: unknown): Array<{ name: string; input: string; id: string }> {
  const found: Array<{ name: string; input: string; id: string }> = [];
  const walk = (node: unknown) => {
    const entries = Array.isArray(node) ? objects(node) : (node && typeof node === 'object' ? [node as Record<string, unknown>] : []);
    for (const item of entries) {
      const type = typeof item.type === 'string' ? item.type : '';
      if (type === 'function_call' || type === 'tool_use' || type === 'tool_call') {
        const fn = item.function && typeof item.function === 'object' ? item.function as Record<string, unknown> : item;
        found.push({ name: asText(item.name ?? fn.name ?? 'tool'), input: asText(item.arguments ?? item.input ?? fn.arguments ?? fn.input ?? ''), id: asText(item.call_id ?? item.id ?? '') });
      }
      if (item.tool_calls) for (const call of objects(item.tool_calls)) {
        const fn = call.function && typeof call.function === 'object' ? call.function as Record<string, unknown> : call;
        found.push({ name: asText(fn.name ?? call.name ?? 'tool'), input: asText(fn.arguments ?? call.arguments ?? ''), id: asText(call.id ?? '') });
      }
      walk(item.output); walk(item.content); walk(item.message); walk(item.choices); walk(item.input); walk(item.messages);
    }
  };
  walk(value);
  return found;
}

export function createMarkdownNotes(input: TurnAnalysisInput): TurnAnalysisResult {
  const calls = input.traffic.flatMap((traffic) => toolCalls(traffic.response));
  const results = input.traffic.flatMap((traffic) => toolCalls(traffic.request));
  if (calls.length === 0 && results.length === 0) return { status: 'empty', notes: [] };
  const lines = ['도구 사용 이력', ''];
  if (calls.length > 0) {
    lines.push('### 호출');
    calls.forEach((call, index) => {
      lines.push(`${index + 1}. **${call.name}**${call.id ? ` (id: \`${call.id}\`)` : ''}`);
      if (call.input) lines.push(`   - 입력: \`${call.input.replace(/`/g, '\\`')}\``);
    });
  }
  if (results.length > 0) {
    lines.push('', '### 도구 결과/메시지', `- 관찰된 결과 항목: ${results.length}개`);
  }
  return { status: 'ready', notes: [{ title: '도구 사용 이력', content: lines.join('\n') }] };
}

export abstract class BaseTurnAnalysisAdapter implements TurnAnalysisAdapter {
  abstract readonly apiKind: TrafficLogApiKind;
  analyze(input: TurnAnalysisInput) { return createMarkdownNotes(input); }
}
