import type { TrafficLogApiKind } from '../domain/traffic-log.js';
import type { TurnAnalysisAdapter } from '../domain/turn-notes.js';
import { ChatCompletionsTurnAnalysisAdapter } from './turn-analysis-adapters/chat-completions-turn-analysis-adapter.js';
import { MessagesTurnAnalysisAdapter } from './turn-analysis-adapters/messages-turn-analysis-adapter.js';
import { ResponsesTurnAnalysisAdapter } from './turn-analysis-adapters/responses-turn-analysis-adapter.js';
import { ChatCompletionsAdapter } from './proxy-adapters/chat-completions-adapter.js';
import { MessagesAdapter } from './proxy-adapters/messages-adapter.js';
import { ProxyAdapter, type ProxyApiPath } from './proxy-adapters/proxy-adapter.js';
import { ResponsesAdapter } from './proxy-adapters/responses-adapter.js';

export type ApiAdapterDefinition = {
  readonly proxy: ProxyAdapter;
  readonly analysis: TurnAnalysisAdapter;
};

const definitions: readonly ApiAdapterDefinition[] = [
  { proxy: new ResponsesAdapter(), analysis: new ResponsesTurnAnalysisAdapter() },
  { proxy: new ChatCompletionsAdapter(), analysis: new ChatCompletionsTurnAnalysisAdapter() },
  { proxy: new MessagesAdapter(), analysis: new MessagesTurnAnalysisAdapter() },
];

export const apiAdapters = Object.freeze({
  definitions,
  byPath: new Map<ProxyApiPath, ApiAdapterDefinition>(definitions.map((definition) => [definition.proxy.apiPath, definition])),
  byKind: new Map<TrafficLogApiKind, ApiAdapterDefinition>(definitions.map((definition) => [definition.proxy.apiKind, definition])),
});

export const proxyApiPaths = definitions.map(({ proxy }) => proxy.apiPath) as readonly ProxyApiPath[];
