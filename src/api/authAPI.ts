/**
 * Client for the server-side authentication API (server/).
 * All credential handling now happens on the backend; the frontend only
 * stores the issued JWT access token.
 */

import { API_BASE } from './base';

const API = `${API_BASE}/api/auth`;

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T & { error?: string; requires2FA?: boolean };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T = Record<string, unknown>>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  telegram?: string;
  createdAt: number;
  emailVerified: boolean;
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycLevel?: number;
  twoFactorEnabled?: boolean;
  isBanned?: boolean;
  banReason?: string;
  role?: string;
}

interface SessionResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export const authAPI = {
  register: (body: { name: string; email: string; password: string; confirmPassword?: string }) =>
    request<SessionResponse>('/register', { method: 'POST', body }),

  login: (body: { email: string; password: string; twoFactorCode?: string }) =>
    request<SessionResponse>('/login', { method: 'POST', body }),

  adminLogin: (body: { email: string; password: string; twoFactorCode?: string }) =>
    request<SessionResponse>('/admin/login', { method: 'POST', body }),

  me: (token: string) => request<{ user: AuthUser }>('/me', { token }),

  updateProfile: (body: { name?: string; phone?: string; telegram?: string }, token: string) =>
    request<{ user: AuthUser }>('/me', { method: 'PATCH', body, token }),

  setup2FA: (token: string) =>
    request<{ secret: string; otpauthUrl: string }>('/2fa/setup', { method: 'POST', token }),

  enable2FA: (code: string, token: string) =>
    request('/2fa/enable', { method: 'POST', body: { code }, token }),

  disable2FA: (code: string, token: string) =>
    request('/2fa/disable', { method: 'POST', body: { code }, token }),

  changePassword: (body: { currentPassword: string; newPassword: string }, token: string) =>
    request('/password/change', { method: 'POST', body, token }),

  forgotPassword: (email: string) =>
    request('/password/forgot', { method: 'POST', body: { email } }),

  resetPassword: (body: { token: string; newPassword: string }) =>
    request('/password/reset', { method: 'POST', body }),

  verifyEmail: (token: string) =>
    request('/verify-email', { method: 'POST', body: { token } }),
};
