import type { Filters, Log, TurnPage } from '../types.js';

export async function fetchLogs(filters: Filters, offset: number, limit = 20): Promise<Log[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  (Object.entries(filters) as Array<[string, string]>).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const response = await fetch(`/api/v1/logs?${params}`);
  if (!response.ok) throw new Error(`로그 목록 조회 실패 (${response.status})`);
  return (await response.json()).data;
}

export async function fetchTurns(page = 1, limit = 20, filter: 'all' | 'flagged' = 'all'): Promise<TurnPage> {
  const response = await fetch(`/api/v1/turns?page=${page}&limit=${limit}&filter=${filter}`);
  if (!response.ok) throw new Error(`turn 목록 조회 실패 (${response.status})`);
  return response.json();
}

export async function fetchLog(id: string): Promise<Log> {
  const response = await fetch(`/api/v1/logs/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`로그 상세 조회 실패 (${response.status})`);
  return response.json();
}

async function sendMetadata(path: string, update: { title?: string | null; flag?: boolean }) {
  const response = await fetch(path, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(update) });
  if (!response.ok) throw new Error(`관리 메타데이터 변경 실패 (${response.status})`);
}

export function updateTurnMetadata(id: string, update: { title?: string | null; flag?: boolean }) {
  return sendMetadata(`/api/v1/turns/${encodeURIComponent(id)}`, update);
}

export function updateTrafficMetadata(id: string, update: { title?: string | null; flag?: boolean }) {
  return sendMetadata(`/api/v1/logs/${encodeURIComponent(id)}`, update);
}

export async function deleteTurn(id: string) {
  const response = await fetch(`/api/v1/turns/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`turn 삭제 실패 (${response.status})`);
}
