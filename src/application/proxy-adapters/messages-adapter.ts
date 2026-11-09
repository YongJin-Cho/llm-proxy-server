import { ProxyAdapter, type UsageMetadata } from './proxy-adapter.js';

export class MessagesAdapter extends ProxyAdapter {
  readonly apiPath = '/messages' as const;
  readonly apiKind = 'messages' as const;

  isComplete(response: string) {
    return response.includes('message_stop');
  }

  usageMetadata(response: string): UsageMetadata {
    try {
      const body = JSON.parse(response) as Record<string, unknown>;
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

function emptyUsage(): UsageMetadata {
  return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null };
}
