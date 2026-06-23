import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Order } from '../../types';

interface PaymentCountdownProps {
  order: Pick<Order, 'status' | 'paymentDeadline'>;
  className?: string;
}

/**
 * Таймер обратного отсчёта до крайнего срока оплаты заявки.
 * Показывает оставшееся время, а после поступления оплаты или истечения
 * срока — соответствующее сообщение.
 */
export const PaymentCountdown: React.FC<PaymentCountdownProps> = ({
  order,
  className = '',
}) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() => order.paymentDeadline - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(order.paymentDeadline - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [order.paymentDeadline]);

  // Оплата уже получена/в обработке
  if (order.status !== 'waiting_payment') {
    if (order.status === 'cancelled') {
      return (
        <div
          className={`flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300 ${className}`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{t('exchange.wizard.paymentExpired')}</span>
        </div>
      );
    }
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-300 ${className}`}
      >
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{t('exchange.wizard.paymentDetected')}</span>
      </div>
    );
  }

  // Срок истёк (отмена произойдёт при ближайшей проверке)
  if (remaining <= 0) {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300 ${className}`}
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">{t('exchange.wizard.paymentExpired')}</span>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  // Меньше 5 минут — подсвечиваем предупреждением
  const isUrgent = remaining < 5 * 60 * 1000;

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 ${
        isUrgent
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
      } ${className}`}
    >
      <Clock className="w-5 h-5" />
      <span className="font-medium">{t('exchange.wizard.paymentTimeLeft')}</span>
      <span className="font-mono font-bold tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
