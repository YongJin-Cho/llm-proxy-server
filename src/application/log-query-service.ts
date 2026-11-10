import type { MetadataUpdate, TrafficLogFilters, TrafficLogManager, TrafficLogReader } from '../domain/traffic-log.js';

export class TrafficLogQueryService {
  constructor(private readonly reader: TrafficLogReader & TrafficLogManager) {}

  list(filters: TrafficLogFilters) {
    return this.reader.list(filters);
  }

  get(id: string) {
    return this.reader.get(id);
  }

  listTurns(page: number, limit: number, filter: 'all' | 'flagged' = 'all') {
    return this.reader.listTurns(page, limit, filter);
  }

  updateTurnMetadata(id: string, update: MetadataUpdate) {
    this.reader.updateTurnMetadata(id, update);
  }

  updateTrafficMetadata(id: string, update: MetadataUpdate) {
    this.reader.updateTrafficMetadata(id, update);
  }

  deleteTurn(id: string) {
    this.reader.deleteTurn(id);
  }
}
