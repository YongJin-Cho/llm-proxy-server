import { ProxyAdapter, type UsageMetadata } from './proxy-adapter.js';

export class ChatCompletionsAdapter extends ProxyAdapter {
  readonly turnSemantic = {
    hasToolContinuation: (request: unknown) => Array.isArray((request as { messages?: unknown[] })?.messages) && (request as { messages: Array<{ role?: string }> }).messages.some((item) => item.role === 'tool'),
    requestToolResultIds: (request: unknown) => stringValues((request as { messages?: Array<{ tool_call_id?: unknown }> })?.messages?.map((item) => item.tool_call_id)),
    responseToolCallIds: (response: unknown) => stringValues((response as { choices?: Array<{ message?: { tool_calls?: Array<{ id?: unknown }> } }> })?.choices?.flatMap((choice) => choice.message?.tool_calls?.map((call) => call.id) ?? [])),
  };
  readonly apiPath = '/chat/completions' as const;
  readonly apiKind = 'chat_completions' as const;

  isComplete(response: string) {
    return response.includes('data: [DONE]');
  }

  aggregateResponse(response: string): string {
    const events = parseSseEvents(response);
    if (events.length === 0) return super.aggregateResponse(response);

    const choices = new Map<number, AggregatedChoice>();
    let id: string | undefined;
    let model: string | undefined;
    let systemFingerprint: string | undefined;
    let usage: Record<string, unknown> | undefined;

    for (const event of events) {
      if (typeof event.id === 'string') id = event.id;
      if (typeof event.model === 'string') model = event.model;
      if (typeof event.system_fingerprint === 'string') systemFingerprint = event.system_fingerprint;
      if (event.usage && typeof event.usage === 'object') usage = event.usage as Record<string, unknown>;
      if (!Array.isArray(event.choices)) continue;

      for (const rawChoice of event.choices) {
        if (!rawChoice || typeof rawChoice !== 'object') continue;
        const choice = rawChoice as Record<string, unknown>;
        const index = typeof choice.index === 'number' ? choice.index : 0;
        const aggregate = choices.get(index) ?? { role: 'assistant', content: '', toolCalls: new Map<number, AggregatedToolCall>(), finishReason: null };
        const delta = choice.delta && typeof choice.delta === 'object' ? choice.delta as Record<string, unknown> : undefined;
        if (typeof delta?.role === 'string') aggregate.role = delta.role;
        if (typeof delta?.content === 'string') aggregate.content += delta.content;
        if (Array.isArray(delta?.tool_calls)) mergeToolCalls(aggregate.toolCalls, delta.tool_calls);
        if (typeof choice.finish_reason === 'string' || choice.finish_reason === null) aggregate.finishReason = choice.finish_reason as string | null;
        choices.set(index, aggregate);
      }
    }

    const body = {
      id,
      object: 'chat.completion',
      model,
      ...(systemFingerprint ? { system_fingerprint: systemFingerprint } : {}),
      choices: [...choices.entries()].sort(([left], [right]) => left - right).map(([index, choice]) => ({
        index,
        message: {
          role: choice.role,
          content: choice.content || null,
          ...(choice.toolCalls.size ? { tool_calls: [...choice.toolCalls.entries()].sort(([left], [right]) => left - right).map(([, toolCall]) => toolCall) } : {}),
        },
        finish_reason: choice.finishReason,
      })),
      ...(usage ? { usage } : {}),
    };
    return JSON.stringify(body);
  }

  usageMetadata(response: string): UsageMetadata {
    try {
      const body = JSON.parse(this.aggregateResponse(response)) as Record<string, unknown>;
      const usage = body.usage && typeof body.usage === 'object' ? body.usage as Record<string, unknown> : undefined;
      const input = typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null;
      const cached = typeof usage?.prompt_tokens_details === 'object' && usage.prompt_tokens_details !== null
        && typeof (usage.prompt_tokens_details as Record<string, unknown>).cached_tokens === 'number'
        ? (usage.prompt_tokens_details as Record<string, number>).cached_tokens : null;
      const output = typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : null;
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

type AggregatedChoice = { role: string; content: string; toolCalls: Map<number, AggregatedToolCall>; finishReason: string | null };
type AggregatedToolCall = { id?: string; type?: string; function: { name?: string; arguments: string } };

function parseSseEvents(response: string): Record<string, unknown>[] {
  return response.split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter((data) => data && data !== '[DONE]')
    .flatMap((data) => {
      try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object' ? [parsed as Record<string, unknown>] : [];
      } catch {
        return [];
      }
    });
}

function mergeToolCalls(target: Map<number, AggregatedToolCall>, rawCalls: unknown[]) {
  for (const rawCall of rawCalls) {
    if (!rawCall || typeof rawCall !== 'object') continue;
    const call = rawCall as Record<string, unknown>;
    const index = typeof call.index === 'number' ? call.index : target.size;
    const current = target.get(index) ?? { function: { arguments: '' } };
    if (typeof call.id === 'string') current.id = call.id;
    if (typeof call.type === 'string') current.type = call.type;
    if (call.function && typeof call.function === 'object') {
      const functionPart = call.function as Record<string, unknown>;
      if (typeof functionPart.name === 'string') current.function.name = functionPart.name;
      if (typeof functionPart.arguments === 'string') current.function.arguments += functionPart.arguments;
    }
    target.set(index, current);
  }
}

function stringValues(values: unknown[] | undefined): string[] { return (values ?? []).filter((value): value is string => typeof value === 'string' && value.length > 0); }

function emptyUsage(): UsageMetadata {
  return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null };
}
