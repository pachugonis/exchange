/**
 * Клиент AML-проверки транзакций.
 *
 * Запрос к AMLBot выполняется на бэкенде (server/routes/aml.ts) — здесь
 * только обращение к нему, чтобы accessKey AMLBot не попадал в браузер.
 */

import type { Order } from '../types';
import { API_BASE } from './base';

export type AmlRiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface AmlSignal {
  name: string;
  share: number;
}

export type AmlCheckResult =
  | { status: 'disabled' } // AMLBot не настроен на сервере
  | { status: 'unsupported' } // валюта/сеть не поддерживается
  | { status: 'error'; message: string } // сбой — можно повторить
  | { status: 'pending'; uid: string } // проверка ещё идёт в AMLBot
  | {
      status: 'completed';
      uid: string;
      riskScore: number;
      riskLevel: AmlRiskLevel;
      signals: AmlSignal[];
      pdfReport?: string;
      checkedAt: number;
    };

/**
 * Проверить отправителя заявки через AMLBot.
 * Проверяется адрес отправителя (paymentDetails.fromWallet); если известен
 * хэш входящей транзакции — он передаётся для точного KYT-скоринга.
 */
export async function checkOrderAml(order: Order): Promise<AmlCheckResult> {
  const address = order.paymentDetails.fromWallet;
  if (!address) return { status: 'unsupported' };

  try {
    const response = await fetch(`${API_BASE}/api/aml/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: order.fromCurrency.code,
        network: order.fromCurrency.networks?.[0],
        address,
        hash: order.txHash,
      }),
    });

    if (!response.ok) return { status: 'error', message: `Сервер ответил ${response.status}` };
    return (await response.json()) as AmlCheckResult;
  } catch (error) {
    console.error('AML check request failed:', error);
    return { status: 'error', message: 'Сеть недоступна' };
  }
}
