/**
 * Клиент отслеживания платежей.
 *
 * Сами запросы к блокчейн-эксплинерам выполняются на бэкенде
 * (server/routes/payments.ts) — здесь только обращение к нему.
 * Это снимает ограничения CORS/лимиты эксплореров в браузере и держит
 * ключ Etherscan на сервере.
 */

import type { Order } from '../types';
import { API_BASE } from './base';

export type PaymentCheckResult =
  | { status: 'unsupported' } // сеть не отслеживается автоматически
  | { status: 'error' } // сервер/эксплорер недоступен — повторим позже
  | { status: 'none' } // оплата ещё не обнаружена
  | { status: 'pending'; txHash: string; amount: number } // транзакция найдена, не подтверждена
  | { status: 'confirmed'; txHash: string; amount: number }; // оплата подтверждена

/**
 * Проверить через бэкенд, поступила ли оплата по заявке.
 */
export async function checkIncomingPayment(order: Order): Promise<PaymentCheckResult> {
  if (!order.paymentAddress) return { status: 'unsupported' };

  try {
    const response = await fetch(`${API_BASE}/api/payments/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: order.fromCurrency.code,
        network: order.fromCurrency.networks?.[0],
        address: order.paymentAddress,
        amount: order.fromAmount,
        createdAt: order.createdAt,
      }),
    });

    if (!response.ok) return { status: 'error' };
    return (await response.json()) as PaymentCheckResult;
  } catch (error) {
    console.error('Payment check request failed:', error);
    return { status: 'error' };
  }
}
