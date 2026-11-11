import { ProxyAdapter, type UsageMetadata } from './proxy-adapter.js';
import { emptyUsage, parseSseJsonEvents, stringValues } from './shared.js';

type ResponsesEvent = Record<string, unknown>;
type OutputItem = Record<string, unknown> & { content?: Array<Record<string, unknown>>; arguments?: string };

export class ResponsesAdapter extends ProxyAdapter {
  readonly turnSemantic = {
    hasToolContinuation: (request: unknown) => Array.isArray((request as { input?: unknown[] })?.input) && (request as { input: Array<{ type?: string }> }).input.some((item) => item.type === 'function_call_output'),
    requestToolResultIds: (request: unknown) => stringValues(Array.isArray((request as { input?: unknown })?.input) ? ((request as { input: Array<{ call_id?: unknown }> }).input.map((item) => item.call_id)) : []),
    responseToolCallIds: (response: unknown) => stringValues((response as { output?: Array<{ type?: string; call_id?: unknown }> })?.output?.filter((item) => item.type === 'function_call').map((item) => item.call_id)),
  };
  readonly apiPath = '/responses' as const;
  readonly apiKind = 'responses' as const;

  isComplete(response: string) {
    return response.includes('response.completed') || response.includes('data: [DONE]');
  }

  aggregateResponse(response: string): string {
    const events = parseSseJsonEvents<ResponsesEvent>(response);
    if (events.length === 0) return this.aggregateSseFallback(response);

    let aggregate: Record<string, unknown> = {};
    const output = new Map<number, OutputItem>();
    const outputIndexById = new Map<string, number>();
    let nextOutputIndex = 0;

    for (const event of events) {
      const eventResponse = event.response && typeof event.response === 'object' ? event.response as Record<string, unknown> : undefined;
      if (eventResponse) {
        aggregate = { ...aggregate, ...eventResponse };
        if (Array.isArray(eventResponse.output)) {
          for (const [index, item] of eventResponse.output.entries()) {
            if (item && typeof item === 'object') {
              const copied = cloneOutputItem(item as Record<string, unknown>);
              output.set(index, copied);
              if (typeof copied.id === 'string') outputIndexById.set(copied.id, index);
              nextOutputIndex = Math.max(nextOutputIndex, index + 1);
            }
          }
        }
      }
      if (typeof event.id === 'string' && typeof aggregate.id !== 'string') aggregate.id = event.id;
      if (typeof event.model === 'string' && typeof aggregate.model !== 'string') aggregate.model = event.model;

      if (event.type === 'response.output_item.added' && event.item && typeof event.item === 'object') {
        const item = cloneOutputItem(event.item as Record<string, unknown>);
        const index = numberValue(event.output_index) ?? nextOutputIndex++;
        output.set(index, item);
        if (typeof item.id === 'string') outputIndexById.set(item.id, index);
      } else if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
        const index = numberValue(event.output_index) ?? 0;
        const item = output.get(index) ?? { type: 'message', role: 'assistant', content: [] };
        item.type ??= 'message';
        item.role ??= 'assistant';
        const content = Array.isArray(item.content) ? item.content : [];
        const textPart = content.find((part) => part.type === 'output_text') ?? { type: 'output_text', text: '', annotations: [] };
        textPart.text = `${typeof textPart.text === 'string' ? textPart.text : ''}${event.delta}`;
        if (!content.includes(textPart)) content.push(textPart);
        item.content = content;
        output.set(index, item);
      } else if (event.type === 'response.function_call_arguments.delta' && typeof event.delta === 'string') {
        const index = outputIndex(event, outputIndexById, output);
        const item = output.get(index) ?? { type: 'function_call', arguments: '' };
        item.arguments = `${typeof item.arguments === 'string' ? item.arguments : ''}${event.delta}`;
        output.set(index, item);
      } else if (event.type === 'response.function_call_arguments.done' && typeof event.arguments === 'string') {
        const index = outputIndex(event, outputIndexById, output);
        const item = output.get(index) ?? { type: 'function_call' };
        item.arguments = event.arguments;
        output.set(index, item);
      }

      if (event.usage && typeof event.usage === 'object') aggregate.usage = event.usage;
    }

    if (output.size > 0) aggregate.output = [...output.entries()].sort(([left], [right]) => left - right).map(([, item]) => item);
    if (!aggregate.object) aggregate.object = 'response';
    return JSON.stringify(aggregate);
  }

  usageMetadata(response: string): UsageMetadata {
    try {
      const body = JSON.parse(this.aggregateResponse(response)) as Record<string, unknown>;
      const usage = body.usage && typeof body.usage === 'object' ? body.usage as Record<string, unknown> : undefined;
      const input = typeof usage?.input_tokens === 'number' ? usage.input_tokens : null;
      const inputDetails = usage?.input_tokens_details && typeof usage.input_tokens_details === 'object'
        ? usage.input_tokens_details as Record<string, unknown>
        : undefined;
      const cached = typeof inputDetails?.cached_tokens === 'number' ? inputDetails.cached_tokens : null;
      const output = typeof usage?.output_tokens === 'number' ? usage.output_tokens : null;
      return {
        inputTokens: input,
        cachedInputTokens: cached,
        outputTokens: output,
        totalTokens: input !== null && output !== null ? input + output : null,
        costUsd: typeof usage?.cost === 'number' ? usage.cost : null,
      };
    } catch {
      return emptyUsage();
    }
  }
}

function cloneOutputItem(item: Record<string, unknown>): OutputItem {
  return JSON.parse(JSON.stringify(item)) as OutputItem;
}

function outputIndex(event: ResponsesEvent, byId: Map<string, number>, output: Map<number, OutputItem>): number {
  const direct = numberValue(event.output_index);
  if (direct !== undefined) return direct;
  if (typeof event.item_id === 'string' && byId.has(event.item_id)) return byId.get(event.item_id)!;
  return output.size;
}

function numberValue(value: unknown): number | undefined { return typeof value === 'number' ? value : undefined; }
