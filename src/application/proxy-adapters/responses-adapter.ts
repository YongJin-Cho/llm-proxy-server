import { ProxyAdapter, type UsageMetadata } from './proxy-adapter.js';

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

  usageMetadata(response: string): UsageMetadata {
    try {
      const body = JSON.parse(response) as Record<string, unknown>;
      const usage = body.usage && typeof body.usage === 'object' ? body.usage as Record<string, unknown> : undefined;
      const input = typeof usage?.input_tokens === 'number' ? usage.input_tokens : null;
      const cached = typeof usage?.cached_input_tokens === 'number' ? usage.cached_input_tokens : null;
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

function stringValues(values: unknown[] | undefined): string[] { return (values ?? []).filter((value): value is string => typeof value === 'string' && value.length > 0); }

function emptyUsage(): UsageMetadata {
  return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null };
}
