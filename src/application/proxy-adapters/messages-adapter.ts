import { ProxyAdapter, type UsageMetadata } from './proxy-adapter.js';

type MessagesEvent = Record<string, unknown>;
type ContentBlock = { type: string; text?: string; id?: string; name?: string; input?: unknown; partialInput?: string };

export class MessagesAdapter extends ProxyAdapter {
  readonly turnSemantic = {
    hasToolContinuation: (request: unknown) => Array.isArray((request as { messages?: unknown[] })?.messages) && (request as { messages: Array<{ content?: unknown }> }).messages.some((item) => Array.isArray(item.content) && item.content.some((part) => (part as { type?: string })?.type === 'tool_result')),
    requestToolResultIds: (request: unknown) => stringValues((request as { messages?: Array<{ content?: unknown }> })?.messages?.flatMap((item) => Array.isArray(item.content) ? (item.content as Array<{ tool_use_id?: unknown }>).map((part) => part.tool_use_id) : [])),
    responseToolCallIds: (response: unknown) => stringValues((response as { content?: Array<{ type?: string; id?: unknown }> })?.content?.filter((item) => item.type === 'tool_use').map((item) => item.id)),
  };
  readonly apiPath = '/messages' as const;
  readonly apiKind = 'messages' as const;

  isComplete(response: string) {
    return response.includes('message_stop');
  }

  aggregateResponse(response: string): string {
    const events = parseSseEvents(response);
    if (events.length === 0) return super.aggregateResponse(response);

    let aggregate: Record<string, unknown> = {};
    const content = new Map<number, ContentBlock>();

    for (const event of events) {
      const message = event.message && typeof event.message === 'object' ? event.message as Record<string, unknown> : undefined;
      if (message) {
        aggregate = { ...aggregate, ...message };
        if (Array.isArray(message.content)) {
          for (const [index, block] of message.content.entries()) {
            if (block && typeof block === 'object') content.set(index, cloneBlock(block as Record<string, unknown>));
          }
        }
      }

      if (event.type === 'content_block_start' && event.content_block && typeof event.content_block === 'object') {
        content.set(numberValue(event.index) ?? content.size, cloneBlock(event.content_block as Record<string, unknown>));
      } else if (event.type === 'content_block_delta' && event.delta && typeof event.delta === 'object') {
        const index = numberValue(event.index) ?? 0;
        const delta = event.delta as Record<string, unknown>;
        const block = content.get(index) ?? { type: delta.type === 'input_json_delta' ? 'tool_use' : 'text' };
        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          block.text = `${block.text ?? ''}${delta.text}`;
        } else if (delta.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
          block.partialInput = `${block.partialInput ?? ''}${delta.partial_json}`;
        }
        content.set(index, block);
      } else if (event.type === 'content_block_stop') {
        const block = content.get(numberValue(event.index) ?? 0);
        if (block?.partialInput !== undefined) {
          block.input = parseInput(block.partialInput);
          delete block.partialInput;
        }
      }

      if (event.usage && typeof event.usage === 'object') aggregate.usage = { ...(aggregate.usage as Record<string, unknown> | undefined), ...(event.usage as Record<string, unknown>) };
      if (event.type === 'message_delta' && event.delta && typeof event.delta === 'object') {
        const delta = event.delta as Record<string, unknown>;
        if ('stop_reason' in delta) aggregate.stop_reason = delta.stop_reason;
        if ('stop_sequence' in delta) aggregate.stop_sequence = delta.stop_sequence;
      }
    }

    if (content.size > 0) aggregate.content = [...content.entries()].sort(([left], [right]) => left - right).map(([, block]) => {
      const { partialInput: _partialInput, ...finalBlock } = block;
      if (finalBlock.type === 'text') return { type: 'text', text: finalBlock.text ?? '' };
      if (finalBlock.type === 'tool_use') return { type: 'tool_use', id: finalBlock.id, name: finalBlock.name, input: finalBlock.input ?? parseInput(block.partialInput ?? '') };
      return finalBlock;
    });
    if (!aggregate.type) aggregate.type = 'message';
    return JSON.stringify(aggregate);
  }

  usageMetadata(response: string): UsageMetadata {
    try {
      const body = JSON.parse(this.aggregateResponse(response)) as Record<string, unknown>;
      const usage = body.usage && typeof body.usage === 'object' ? body.usage as Record<string, unknown> : undefined;
      const input = typeof usage?.input_tokens === 'number' ? usage.input_tokens : null;
      const cached = typeof usage?.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : null;
      const output = typeof usage?.output_tokens === 'number' ? usage.output_tokens : null;
      return {
        inputTokens: input,
        cachedInputTokens: cached,
        outputTokens: output,
        totalTokens: input !== null && output !== null ? input + output : null,
        costUsd: typeof body.cost_usd === 'number' ? body.cost_usd : null,
      };
    } catch {
      return emptyUsage();
    }
  }
}

function parseSseEvents(response: string): MessagesEvent[] {
  return response.split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter((data) => data && data !== '[DONE]')
    .flatMap((data) => {
      try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object' ? [parsed as MessagesEvent] : [];
      } catch {
        return [];
      }
    });
}

function cloneBlock(block: Record<string, unknown>): ContentBlock {
  return JSON.parse(JSON.stringify(block)) as ContentBlock;
}
function parseInput(value: string): unknown {
  try { return JSON.parse(value); } catch { return value; }
}
function numberValue(value: unknown): number | undefined { return typeof value === 'number' ? value : undefined; }
function stringValues(values: unknown[] | undefined): string[] { return (values ?? []).filter((value): value is string => typeof value === 'string' && value.length > 0); }
function emptyUsage(): UsageMetadata { return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null }; }
