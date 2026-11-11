import type { TrafficLogApiKind } from '../domain/traffic-log.js';
import type { TurnAnalysisAdapter, TurnAnalysisPersistence } from '../domain/turn-notes.js';
import { apiAdapters } from './api-adapters.js';

export class TurnAnalysisService {
  private readonly adapters: ReadonlyMap<TrafficLogApiKind, TurnAnalysisAdapter>;
  private readonly analysisVersion = 1;
  constructor(private readonly persistence: TurnAnalysisPersistence) {
    this.adapters = new Map<TrafficLogApiKind, TurnAnalysisAdapter>([...apiAdapters.byKind.entries()].map(([kind, definition]) => [kind, definition.analysis]));
    for (const pending of persistence.listPendingTurnAnalyses()) this.schedule(pending.turnId, pending.analysisVersion);
  }
  enqueue(turnId: string) {
    if (this.persistence.ensureTurnNotePending(turnId, this.analysisVersion)) this.schedule(turnId, this.analysisVersion);
  }
  private schedule(turnId: string, analysisVersion: number) {
    queueMicrotask(() => this.run(turnId, analysisVersion));
  }
  private run(turnId: string, analysisVersion: number) {
    const input = this.persistence.getTurnForAnalysis(turnId);
    if (!input) {
      this.persistence.saveTurnNoteResult({ turnId, analysisVersion, result: { status: 'failed', notes: [], errorCode: 'note_unavailable', errorMessage: 'turn analysis input unavailable', retryable: false } });
      return;
    }
    const kinds = new Set(input.traffic.map((traffic) => traffic.apiKind));
    const adapterKind = [...kinds][0];
    const adapter = adapterKind ? this.adapters.get(adapterKind) : undefined;
    if (!adapter) {
      this.persistence.saveTurnNoteResult({ turnId, analysisVersion, result: { status: 'failed', notes: [], errorCode: 'unsupported_api_kind', errorMessage: 'turn analysis adapter unavailable', retryable: false } });
      return;
    }
    try {
      const result = adapter.analyze(input);
      this.persistence.saveTurnNoteResult({ turnId, analysisVersion, result });
    } catch (error) {
      this.persistence.saveTurnNoteResult({ turnId, analysisVersion, result: { status: 'failed', notes: [], errorCode: 'analysis_failed', errorMessage: error instanceof Error ? error.message.slice(0, 256) : 'turn analysis failed', retryable: true } });
    }
  }
}
