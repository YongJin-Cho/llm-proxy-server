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

  usageMetadata(response: string): UsageMetadata {
    try {
      const body = JSON.parse(response) as Record<string, unknown>;
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
        costUsd: typeof body.cost_usd === 'number' ? body.cost_usd : null,
      };
    } catch {
      return emptyUsage();
    }
  }
}

function stringValues(values: unknown[] | undefined): string[] { return (values ?? []).filter((value): value is string => typeof value === 'string' && value.length > 0); }

function emptyUsage(): UsageMetadata {
  return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null };
}
