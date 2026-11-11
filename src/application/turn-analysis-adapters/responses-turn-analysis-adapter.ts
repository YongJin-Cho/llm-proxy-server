import type { TrafficLogApiKind } from '../../domain/traffic-log.js';
import { BaseTurnAnalysisAdapter } from './turn-analysis-adapter.js';
export class ResponsesTurnAnalysisAdapter extends BaseTurnAnalysisAdapter { readonly apiKind: TrafficLogApiKind = 'responses'; }
