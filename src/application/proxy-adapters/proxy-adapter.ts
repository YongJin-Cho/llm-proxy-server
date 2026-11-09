import type { ProviderConfig } from '../../configuration.js';
import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import type { TurnSemantic } from '../../domain/turn.js';
export type { TurnSemantic } from '../../domain/turn.js';

export type ProxyApiPath = '/responses' | '/chat/completions' | '/messages';

export type UsageMetadata = {
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
};

export abstract class ProxyAdapter {
  abstract readonly apiPath: ProxyApiPath;
  abstract readonly apiKind: TrafficLogApiKind;

  providerEndpoint(provider: ProviderConfig) {
    return `${provider.baseUrl.replace(/\/$/, '')}${this.apiPath}`;
  }

  abstract isComplete(response: string): boolean;
  abstract usageMetadata(response: string): UsageMetadata;
  abstract readonly turnSemantic: TurnSemantic;

  aggregateResponse(response: string): string {
    const events = response.split(/\r?\n/).filter((line) => line.startsWith('data: ')).map((line) => line.slice(6).trim()).filter((data) => data && data !== '[DONE]');
    if (events.length === 0) return response;
    for (let index = events.length - 1; index >= 0; index -= 1) {
      try {
        const parsed = JSON.parse(events[index]) as Record<string, unknown>;
        if (parsed.response && typeof parsed.response === 'object') return JSON.stringify(parsed.response);
        if (parsed.message && typeof parsed.message === 'object') return JSON.stringify(parsed.message);
        if (parsed.choices || parsed.output || parsed.content || parsed.usage) return JSON.stringify(parsed);
      } catch { /* ignore non-JSON SSE data */ }
    }
    return events[events.length - 1];
  }
}
