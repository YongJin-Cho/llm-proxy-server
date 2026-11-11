import type { ToolInteraction, TurnNote } from '../domain/turn-notes.js';

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function shortText(value: string): string {
  const limit = 120;
  return value.length <= limit ? value : `${value.slice(0, limit)}…`;
}

function displayValue(value: unknown): string {
  const parsed = parseJson(value);
  if (typeof parsed === 'string') return shortText(parsed);
  try { return shortText(JSON.stringify(parsed)); } catch { return shortText(String(parsed)); }
}

function parameterRows(parameters: unknown): string {
  const parsed = parseJson(parameters);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => `${key}=${displayValue(value)}`).join('<br>');
  }
  return displayValue(parsed);
}

function escapeCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function renderToolNotes(interactions: ToolInteraction[]): TurnNote[] {
  if (interactions.length === 0) return [];
  const rows = interactions.map((item, index) => `| ${index + 1} | ${escapeCell(item.functionName)} | ${escapeCell(parameterRows(item.parameters))} | ${item.failed ? 'Failed' : ''} |`);
  const notes: TurnNote[] = [{
    title: '도구 사용 이력',
    content: ['| Sequence | Function | Parameters | Status |', '|---:|---|---|---|', ...rows].join('\n'),
  }];
  for (const [index, item] of interactions.entries()) {
    if (!item.failed) continue;
    notes.push({
      title: `도구 사용 오류: ${index + 1}. ${item.functionName}`,
      content: item.error === undefined ? 'Tool call failed.' : `Error: ${displayValue(item.error)}`,
      call: item.call,
      result: item.result,
    });
  }
  return notes;
}
