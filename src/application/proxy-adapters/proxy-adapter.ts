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

  abstract aggregateResponse(response: string): string;

  protected aggregateSseFallback(response: string): string {
    const events = response.split(/\r?\n/)
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6).trim())
      .filter((data) => data && data !== '[DONE]');
    return events.length === 0 ? response : events[events.length - 1];
  }
  }
