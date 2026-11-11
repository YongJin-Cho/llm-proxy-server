import type { TrafficLogApiKind } from './traffic-log.js';

export type TurnNote = { title: string; content: string; call?: unknown; result?: unknown };
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

export type ToolInteraction = {
  id: string;
  functionName: string;
  parameters: unknown;
  call: unknown;
  result?: unknown;
  failed: boolean;
  error?: unknown;
};

export function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

export type TurnNoteRenderer = (interactions: ToolInteraction[]) => TurnNote[];

export function resultFromInteractions(interactions: ToolInteraction[], render: TurnNoteRenderer): TurnAnalysisResult {
  const notes = render(interactions);
  return notes.length === 0 ? { status: 'empty', notes: [] } : { status: 'ready', notes };
}

export abstract class BaseTurnAnalysisAdapter implements TurnAnalysisAdapter {
  abstract readonly apiKind: TrafficLogApiKind;
  abstract analyze(input: TurnAnalysisInput): TurnAnalysisResult;
}
