import type { MetadataUpdate } from '../domain/traffic-log.js';

export type TurnListQuery = { page: number; limit: number; filter: 'all' | 'flagged' };
export type LogListQuery = { status?: string; model?: string; from?: string; to?: string; limit: number; offset: number };

function positiveInteger(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return max === undefined ? parsed : Math.min(parsed, max);
}

export function parseTurnListQuery(url: URL): TurnListQuery {
  return {
    page: positiveInteger(url.searchParams.get('page'), 1),
    limit: positiveInteger(url.searchParams.get('limit'), 20, 100),
    filter: url.searchParams.get('filter') === 'flagged' ? 'flagged' : 'all',
  };
}

export function parseLogListQuery(url: URL): LogListQuery {
  const optional = (name: string) => url.searchParams.get(name) || undefined;
  return {
    status: optional('status'),
    model: optional('model'),
    from: optional('from'),
    to: optional('to'),
    limit: positiveInteger(url.searchParams.get('limit'), 20, 100),
    offset: Math.max(Number(url.searchParams.get('offset') ?? 0), 0),
  };
}

export function parseMetadataUpdate(body: unknown): MetadataUpdate {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const value = body as Record<string, unknown>;
  return {
    ...(typeof value.title === 'string' || value.title === null ? { title: value.title } : {}),
    ...(typeof value.flag === 'boolean' ? { flag: value.flag } : {}),
  };
}
