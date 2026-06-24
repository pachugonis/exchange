import { API_BASE } from './base';

export interface LicenseState {
  status: 'active' | 'suspended' | 'revoked' | 'expired' | 'unknown';
  message: string;
  locked: boolean;
}

/**
 * Текущее состояние лицензии с бэкенда. Используется для полноэкранной
 * блокировки сайта при отозванной/истёкшей лицензии.
 */
export async function fetchLicenseState(): Promise<LicenseState> {
  const res = await fetch(`${API_BASE}/api/system/license`);
  if (!res.ok) throw new Error('license check failed');
  return res.json();
}
