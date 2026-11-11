import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import { asArray, asObject, BaseTurnAnalysisAdapter, parseJson, resultFromInteractions, type ToolInteraction, type TurnAnalysisInput, type TurnAnalysisResult } from '../../domain/turn-notes.js';

export class ResponsesTurnAnalysisAdapter extends BaseTurnAnalysisAdapter {
  readonly apiKind: TrafficLogApiKind = 'responses';

  analyze(input: TurnAnalysisInput): TurnAnalysisResult {
    const results = new Map<string, { failed: boolean; error?: unknown }>();
    for (const traffic of input.traffic) {
      const body = asObject(traffic.request) ?? {};
      for (const item of asArray(body.input)) {
        const value = asObject(item) ?? {};
        if (value.type === 'function_call_output') {
          const result = asObject(parseJson(value.output));
          const id = typeof value.call_id === 'string' ? value.call_id : '';
          results.set(id, { failed: Boolean(result && Object.prototype.hasOwnProperty.call(result, 'error')), error: result?.error });
        }
      }
    }
    const interactions: ToolInteraction[] = [];
    for (const traffic of input.traffic) {
      const body = asObject(traffic.request) ?? {};
      for (const item of asArray(body.input)) {
        const value = asObject(item) ?? {};
        if (value.type !== 'function_call') continue;
        const id = typeof value.call_id === 'string' ? value.call_id : '';
        const result = results.get(id);
        interactions.push({ id, functionName: typeof value.name === 'string' ? value.name : 'tool', parameters: value.arguments ?? {}, failed: result?.failed ?? false, error: result?.error });
      }
    }
    return resultFromInteractions(interactions);
  }
}
