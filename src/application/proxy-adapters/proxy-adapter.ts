import type { ProviderConfig } from '../../configuration.js';
import type { TrafficLogApiKind } from '../../domain/traffic-log.js';

export type ProxyApiPath = '/responses' | '/chat/completions' | '/messages';

export abstract class ProxyAdapter {
  abstract readonly apiPath: ProxyApiPath;
  abstract readonly apiKind: TrafficLogApiKind;

  providerEndpoint(provider: ProviderConfig) {
    return `${provider.baseUrl.replace(/\/$/, '')}${this.apiPath}`;
  }

  abstract isComplete(response: string): boolean;
}
