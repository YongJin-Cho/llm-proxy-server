import type { TrafficLogFilters, TrafficLogReader } from '../domain/traffic-log.js';

export class TrafficLogQueryService {
  constructor(private readonly reader: TrafficLogReader) {}

  list(filters: TrafficLogFilters) {
    return this.reader.list(filters);
  }

  get(id: string) {
    return this.reader.get(id);
  }
}
