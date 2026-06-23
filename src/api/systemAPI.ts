/** Client for the server-side system/update API (server/routes/system.ts). */

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:4000';

const API = `${BASE_URL}/api/system`;

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T & { error?: string };
}

async function request<T>(
  path: string,
  { method = 'GET', token }: { method?: string; token?: string | null } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { method, headers });
  } catch {
    return { ok: false, status: 0, data: { error: 'Сервер недоступен' } as ApiResult<T>['data'] };
  }
  const data = (await res.json().catch(() => ({}))) as ApiResult<T>['data'];
  return { ok: res.ok, status: res.status, data };
}

export interface UpdateCheck {
  updateAvailable: boolean;
  behind?: number;
  branch?: string;
  current?: string;
  latest?: string;
  currentSubject?: string;
  latestSubject?: string;
  error?: string;
}

export interface UpdateStatus {
  state: 'idle' | 'running' | 'success' | 'error';
  startedAt?: string;
  finishedAt?: string;
  code?: number;
}

export const systemAPI = {
  checkUpdate: (token: string) => request<UpdateCheck>('/update/check', { token }),
  startUpdate: (token: string) => request<{ started: boolean }>('/update', { method: 'POST', token }),
  updateStatus: (token: string) => request<UpdateStatus>('/update/status', { token }),
  updateLog: (token: string) => request<{ log: string }>('/update/log', { token }),
};
