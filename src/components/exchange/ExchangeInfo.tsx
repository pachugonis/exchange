import React from 'react';
import { Info, Shield, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { CurrencyIcon } from '../ui/CurrencyIcon';
import type { Currency } from '../../types';

interface ExchangeInfoProps {
  fromCurrency?: Currency;
  toCurrency?: Currency;
  className?: string;
}

export const ExchangeInfo: React.FC<ExchangeInfoProps> = ({
  fromCurrency,
  toCurrency,
  className = '',
}) => {
  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-primary-500" />
        Информация об обмене
      </h3>

      <div className="space-y-4">
        {fromCurrency && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <CurrencyIcon currency={fromCurrency} size="sm" />
              {fromCurrency.name}
            </h4>
            <div className="space-y-1 text-sm text-dark-600 dark:text-dark-400">
              <div className="flex justify-between">
                <span>Минимум:</span>
                <span className="font-medium">
                  {fromCurrency.minAmount} {fromCurrency.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Максимум:</span>
                <span className="font-medium">
                  {fromCurrency.maxAmount.toLocaleString()} {fromCurrency.code}
                </span>
              </div>
              {fromCurrency.networks && fromCurrency.networks.length > 0 && (
                <div className="flex justify-between">
                  <span>Сети:</span>
                  <span className="font-medium">{fromCurrency.networks.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {toCurrency && (
          <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <CurrencyIcon currency={toCurrency} size="sm" />
              {toCurrency.name}
            </h4>
            <div className="space-y-1 text-sm text-dark-600 dark:text-dark-400">
              <div className="flex justify-between">
                <span>Резерв:</span>
                <span className="font-medium text-green-500">
                  {toCurrency.reserve.toLocaleString()} {toCurrency.code}
                </span>
              </div>
              {toCurrency.networks && toCurrency.networks.length > 0 && (
                <div className="flex justify-between">
                  <span>Сети:</span>
                  <span className="font-medium">{toCurrency.networks.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-dark-200 dark:border-dark-700 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">Время обмена</div>
              <div className="text-dark-600 dark:text-dark-400">
                От 5 до 30 минут в зависимости от выбранных валют
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">Безопасность</div>
              <div className="text-dark-600 dark:text-dark-400">
                SSL шифрование и AML/KYC проверки
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">Важно</div>
              <div className="text-dark-600 dark:text-dark-400">
                Проверьте правильность реквизитов перед отправкой средств
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
