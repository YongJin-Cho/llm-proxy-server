import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import { BaseTurnAnalysisAdapter } from './turn-analysis-adapter.js';
export class MessagesTurnAnalysisAdapter extends BaseTurnAnalysisAdapter { readonly apiKind: TrafficLogApiKind = 'messages'; }
