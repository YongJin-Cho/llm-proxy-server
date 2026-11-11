import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import { asArray, asObject, BaseTurnAnalysisAdapter, parseJson, resultFromInteractions, type ToolInteraction, type TurnAnalysisInput, type TurnAnalysisResult } from '../../domain/turn-notes.js';

export class ChatCompletionsTurnAnalysisAdapter extends BaseTurnAnalysisAdapter {
  readonly apiKind: TrafficLogApiKind = 'chat_completions';

  analyze(input: TurnAnalysisInput): TurnAnalysisResult {
    const interactions: ToolInteraction[] = [];
    const results = new Map<string, { failed: boolean; result: unknown; error?: unknown }>();
    for (const traffic of input.traffic) {
      const body = asObject(traffic.request) ?? {};
      for (const message of asArray(body.messages)) {
        const item = asObject(message) ?? {};
        if (item.role === 'tool') {
          const result = asObject(parseJson(item.content));
          const id = typeof item.tool_call_id === 'string' ? item.tool_call_id : '';
          results.set(id, { result: item, failed: Boolean(result && Object.prototype.hasOwnProperty.call(result, 'error')), error: result?.error });
        }
      }
    }
    for (const traffic of input.traffic) {
      const body = asObject(traffic.request) ?? {};
      for (const message of asArray(body.messages)) {
        const item = asObject(message) ?? {};
        for (const call of asArray(item.tool_calls)) {
          const callObject = asObject(call) ?? {};
          const fn = asObject(callObject.function) ?? {};
          const id = typeof callObject.id === 'string' ? callObject.id : '';
          const result = results.get(id);
          interactions.push({ id, functionName: typeof fn.name === 'string' ? fn.name : 'tool', parameters: fn.arguments ?? {}, call: callObject, result: result?.result, failed: result?.failed ?? false, error: result?.error });
        }
      }
    }
    return resultFromInteractions(interactions);
  }
}
