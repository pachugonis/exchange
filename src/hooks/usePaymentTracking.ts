import { useEffect, useRef } from 'react';
import { useOrderStore } from '../store/orderStore';
import { checkIncomingPayment } from '../api/blockchainAPI';
import { PAYMENT_CHECK_INTERVAL } from '../utils/constants';

/**
 * Глобальное отслеживание оплаты заявок.
 *
 * Периодически проверяет все заявки, ожидающие оплату:
 *  - если на платёжный адрес поступил перевод — переводит заявку в
 *    «оплата получена» (или «проверка оплаты», если транзакция ещё не
 *    подтверждена сетью);
 *  - если перевод не поступил до крайнего срока (30 минут) — помечает
 *    заявку как отменённую.
 *
 * Монтируется один раз на уровне приложения.
 */
export function usePaymentTracking(): void {
  // Адреса/заявки, для которых сейчас выполняется запрос к блокчейну,
  // чтобы не запускать параллельные проверки одной и той же заявки.
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = async () => {
      const { orders, expireOrder, confirmPayment } = useOrderStore.getState();
      const now = Date.now();

      const pendingOrders = orders.filter(
        (o) => o.status === 'waiting_payment' || o.status === 'payment_pending'
      );

      for (const order of pendingOrders) {
        const isCrypto = order.fromCurrency.type === 'crypto';

        // Авто-отмена по таймауту — только для криптовалют, где оплату можно
        // отследить в блокчейне. Для карт/наличных/e-кошельков статус меняет
        // оператор вручную, поэтому такие заявки по таймауту не отменяем.
        // Если транзакция уже найдена (статус payment_pending) — тоже не
        // отменяем: средства в пути, ждём подтверждения.
        if (
          isCrypto &&
          order.status === 'waiting_payment' &&
          now > order.paymentDeadline
        ) {
          expireOrder(order.id);
          continue;
        }

        // Опрашиваем блокчейн только для криптовалют
        if (!isCrypto) continue;

        if (inFlight.current.has(order.id)) continue;
        inFlight.current.add(order.id);

        checkIncomingPayment(order)
          .then((result) => {
            if (result.status === 'confirmed') {
              confirmPayment(order.id, result.txHash, true);
            } else if (result.status === 'pending') {
              confirmPayment(order.id, result.txHash, false);
            }
            // none/unsupported/error — оставляем как есть; таймаут отработает отдельно
          })
          .catch((err) => console.error('Payment tracking error:', err))
          .finally(() => inFlight.current.delete(order.id));
      }
    };

    // Запускаем сразу и затем по интервалу
    tick();
    const interval = setInterval(tick, PAYMENT_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}
