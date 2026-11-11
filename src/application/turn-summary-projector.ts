import type { TrafficLog, TrafficLogStatus, TurnSummary, TurnSummaryProjector, TurnSummaryTraffic } from '../domain/traffic-log.js';

function parseJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
}

function lastUserMessage(messages: unknown): Record<string, unknown> | null {
  if (!Array.isArray(messages)) return null;
  const message = [...messages].reverse().find((item) => (item as { role?: string } | null)?.role === 'user');
  return message && typeof message === 'object' ? message as Record<string, unknown> : null;
}

function lastContentText(content: unknown, type: string): unknown | null {
  if (!Array.isArray(content)) return null;
  const item = [...content].reverse().find((part) => (part as { type?: string } | null)?.type === type);
  return item && typeof item === 'object' && 'text' in item ? (item as { text?: unknown }).text ?? null : null;
}

function extractUserInput(value: Record<string, unknown> | null, apiKind: string | undefined): unknown | null {
  if (!value) return null;
  if (typeof value.input === 'string') return value.input;
  if (apiKind === 'responses') {
    const input = Array.isArray(value.input) ? value.input.at(-1) as { role?: string; content?: unknown } | undefined : undefined;
    return input?.role === 'user' ? lastContentText(input.content, 'input_text') : null;
  }
  const message = lastUserMessage(value.messages);
  return message?.content ?? null;
}

function extractAiOutput(value: Record<string, unknown> | null, apiKind: string | undefined): unknown | null {
  if (!value) return null;
  if (typeof value.output_text === 'string') return value.output_text;
  if (apiKind === 'responses') {
    const output = Array.isArray(value.output) ? value.output.at(-1) as { role?: string; content?: unknown } | undefined : undefined;
    return output?.role === 'assistant' ? lastContentText(output.content, 'output_text') : null;
  }
  if (apiKind === 'chat_completions') {
    const choice = Array.isArray(value.choices) ? value.choices[0] as { message?: { role?: string; content?: unknown } } | undefined : undefined;
    return choice?.message?.role === 'assistant' ? choice.message.content ?? null : null;
  }
  if (apiKind === 'messages') return value.role === 'assistant' ? lastContentText(value.content, 'text') : null;
  return null;
}

export class ApiTurnSummaryProjector implements TurnSummaryProjector {
  project(traffic: TurnSummaryTraffic[], status: TrafficLogStatus): TurnSummary {
    const completed = traffic.filter((item) => item.status === 'completed');
    const first = traffic[0];
    const lastCompleted = completed.at(-1);
    const values = ['input_tokens', 'cached_input_tokens', 'output_tokens', 'total_tokens', 'cost_usd'] as const;
    const usage = Object.fromEntries(values.map((field) => [field, traffic.some((item) => item[field] !== null && item[field] !== undefined) ? traffic.reduce((sum, item) => sum + (item[field] ?? 0), 0) : null])) as Record<typeof values[number], number | null>;
    const started = Date.parse(first?.started_at ?? '') || 0;
    const finished = Date.parse((lastCompleted ?? traffic.at(-1))?.finished_at ?? '') || 0;
    const requestEnvelope = parseJson(first?.request_json ?? null);
    const requestBody = requestEnvelope?.body && typeof requestEnvelope.body === 'object' ? requestEnvelope.body as Record<string, unknown> : requestEnvelope;
    const finalTraffic = lastCompleted ?? traffic.at(-1);
    return {
      start_user_input: extractUserInput(requestBody, first?.api_kind),
      end_ai_output: extractAiOutput(parseJson(finalTraffic?.response_json ?? null), finalTraffic?.api_kind),
      model: first?.model ?? null,
      provider: first?.provider ?? null,
      execution_environment: null,
      status,
      traffic_count: traffic.length,
      duration_ms: started && finished ? Math.max(0, finished - started) : null,
      usage: { ...usage, partial: traffic.some((item) => item.input_tokens === null || item.output_tokens === null || item.total_tokens === null) },
    };
  }
}
