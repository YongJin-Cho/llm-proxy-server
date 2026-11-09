export function bounded(value: string, maxBytes: number) {
  return value.length <= maxBytes ? value : value.slice(0, maxBytes);
}

export function maskedHeaders(headers: Record<string, string | string[] | undefined>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = /authorization|api[-_]key|cookie|set-cookie/i.test(key) ? '[REDACTED]' : String(value);
  }
  return result;
}
