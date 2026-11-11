import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import { BaseTurnAnalysisAdapter } from './turn-analysis-adapter.js';
export class ChatCompletionsTurnAnalysisAdapter extends BaseTurnAnalysisAdapter { readonly apiKind: TrafficLogApiKind = 'chat_completions'; }
