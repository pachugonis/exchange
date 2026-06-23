/** Client for the server-side KYC API (server/routes/kyc.ts). */
import type { KYCData } from '../types/kyc';
import { API_BASE } from './base';

const API = `${API_BASE}/api/kyc`;

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T & { error?: string };
}

async function request<T>(
  path: string,
  { method = 'GET', body, token }: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, status: 0, data: { error: 'Сервер недоступен' } as ApiResult<T>['data'] };
  }
  const data = (await res.json().catch(() => ({}))) as ApiResult<T>['data'];
  return { ok: res.ok, status: res.status, data };
}

export const kycAPI = {
  getMine: (token: string) => request<{ kyc: KYCData | null }>('/me', { token }),

  submit: (
    body: { level: number; documents?: unknown[] } & Partial<KYCData>,
    token: string,
  ) => request<{ success: boolean; kyc: KYCData }>('/submit', { method: 'POST', body, token }),

  list: (token: string) => request<{ submissions: KYCData[] }>('/', { token }),

  review: (
    userId: string,
    body: { action: 'approve' | 'reject'; reason?: string },
    token: string,
  ) => request<{ success: boolean; kyc: KYCData }>(`/${userId}/review`, { method: 'POST', body, token }),
};
