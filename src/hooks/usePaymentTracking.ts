import { useEffect, useRef } from 'react';
import { useOrderStore } from '../store/orderStore';
import { checkIncomingPayment } from '../api/blockchainAPI';
import { checkOrderAml } from '../api/amlAPI';
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
  // Заявки, по которым сейчас выполняется AML-проверка.
  const amlInFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = async () => {
      const { orders, expireOrder, confirmPayment } = useOrderStore.getState();
      const now = Date.now();

      // AML-скоринг отправителя по заявкам, где оплата уже получена, а
      // проверка ещё не запускалась. Высокий риск переведёт заявку в статус
      // «проверка» (см. applyAmlResult в orderStore).
      const amlPending = orders.filter(
        (o) =>
          o.fromCurrency.type === 'crypto' &&
          o.status === 'payment_received' &&
          (o.amlStatus === undefined || o.amlStatus === 'error')
      );

      for (const order of amlPending) {
        if (amlInFlight.current.has(order.id)) continue;
        amlInFlight.current.add(order.id);

        const { setAmlChecking, applyAmlResult, markAmlError } = useOrderStore.getState();
        setAmlChecking(order.id);

        checkOrderAml(order)
          .then((result) => {
            if (result.status === 'completed') {
              applyAmlResult(order.id, {
                riskScore: result.riskScore,
                riskLevel: result.riskLevel,
                signals: result.signals,
                uid: result.uid,
                pdfReport: result.pdfReport,
                checkedAt: result.checkedAt,
              });
            } else if (result.status === 'disabled' || result.status === 'unsupported') {
              // AML не настроен или валюта не поддерживается — помечаем как
              // пропущено, чтобы не опрашивать повторно.
              useOrderStore.getState().updateOrder(order.id, { amlStatus: 'skipped' });
            } else {
              // error/pending — оставляем для повторной попытки на следующем тике
              markAmlError(order.id);
            }
          })
          .catch((err) => {
            console.error('AML tracking error:', err);
            markAmlError(order.id);
          })
          .finally(() => amlInFlight.current.delete(order.id));
      }

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
