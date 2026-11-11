import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import { asArray, asObject, BaseTurnAnalysisAdapter, parseJson, resultFromInteractions, type ToolInteraction, type TurnAnalysisInput, type TurnAnalysisResult } from '../../domain/turn-notes.js';

export class MessagesTurnAnalysisAdapter extends BaseTurnAnalysisAdapter {
  readonly apiKind: TrafficLogApiKind = 'messages';

  analyze(input: TurnAnalysisInput): TurnAnalysisResult {
    const results = new Map<string, { failed: boolean; error?: unknown }>();
    for (const traffic of input.traffic) {
      const body = asObject(traffic.request) ?? {};
      for (const message of asArray(body.messages)) {
        const item = asObject(message) ?? {};
        for (const block of asArray(item.content)) {
          const value = asObject(block) ?? {};
          if (value.type !== 'tool_result') continue;
          const result = asObject(parseJson(value.content));
          const id = typeof value.tool_use_id === 'string' ? value.tool_use_id : '';
          results.set(id, { failed: Boolean(result && Object.prototype.hasOwnProperty.call(result, 'error')), error: result?.error });
        }
      }
    }
    const interactions: ToolInteraction[] = [];
    for (const traffic of input.traffic) {
      const body = asObject(traffic.request) ?? {};
      for (const message of asArray(body.messages)) {
        const item = asObject(message) ?? {};
        if (item.role !== 'assistant') continue;
        for (const block of asArray(item.content)) {
          const value = asObject(block) ?? {};
          if (value.type !== 'tool_use') continue;
          const id = typeof value.id === 'string' ? value.id : '';
          const result = results.get(id);
          interactions.push({ id, functionName: typeof value.name === 'string' ? value.name : 'tool', parameters: value.input ?? {}, failed: result?.failed ?? false, error: result?.error });
        }
      }
    }
    return resultFromInteractions(interactions);
  }
}
