import type { UsageMetadata } from './proxy-adapter.js';

export function parseSseJsonEvents<T extends Record<string, unknown> = Record<string, unknown>>(response: string): T[] {
  return response.split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter((data) => data && data !== '[DONE]')
    .flatMap((data) => {
      try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object' ? [parsed as T] : [];
      } catch {
        return [];
      }
    });
}

export function stringValues(values: unknown[] | undefined): string[] {
  return (values ?? []).filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export function emptyUsage(): UsageMetadata {
  return { inputTokens: null, cachedInputTokens: null, outputTokens: null, totalTokens: null, costUsd: null };
}
