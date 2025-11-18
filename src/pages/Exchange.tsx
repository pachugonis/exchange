import React from 'react';
import { useExchangeStore } from '../store/exchangeStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const Exchange: React.FC = () => {
  const {
    currencies,
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    rate,
    commission,
    setFromCurrency,
    setToCurrency,
    setFromAmount,
    swapCurrencies,
  } = useExchangeStore();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">Обмен валют</h1>
        
        <Card>
          <div className="space-y-6">
            {/* From Currency */}
            <div>
              <label className="block text-sm font-medium mb-2">Отдаю</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={fromCurrency?.id || ''}
                  onChange={(e) => {
                    const currency = currencies.find(c => c.id === e.target.value);
                    setFromCurrency(currency || null);
                  }}
                >
                  <option value="">Выберите валюту</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
                
                <Input
                  type="number"
                  placeholder="Сумма"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  min={fromCurrency?.minAmount || 0}
                  max={fromCurrency?.maxAmount || undefined}
                />
              </div>
              {fromCurrency && (
                <p className="text-sm text-dark-500 mt-1">
                  Мин: {fromCurrency.minAmount} | Макс: {fromCurrency.maxAmount} | Резерв: {fromCurrency.reserve}
                </p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapCurrencies}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
                aria-label="Swap currencies"
              >
                <ArrowLeftRight className="w-6 h-6" />
              </button>
            </div>

            {/* To Currency */}
            <div>
              <label className="block text-sm font-medium mb-2">Получаю</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={toCurrency?.id || ''}
                  onChange={(e) => {
                    const currency = currencies.find(c => c.id === e.target.value);
                    setToCurrency(currency || null);
                  }}
                >
                  <option value="">Выберите валюту</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
                
                <Input
                  type="text"
                  placeholder="Рассчитанная сумма"
                  value={toAmount}
                  readOnly
                  className="bg-dark-50 dark:bg-dark-900"
                />
              </div>
              {toCurrency && (
                <p className="text-sm text-dark-500 mt-1">
                  Резерв: {formatCurrency(toCurrency.reserve, toCurrency.symbol)}
                </p>
              )}
            </div>

            {/* Exchange Info */}
            {rate > 0 && (
              <div className="bg-dark-50 dark:bg-dark-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Курс обмена:</span>
                  <span className="font-semibold">1 {fromCurrency?.code} = {rate.toFixed(2)} {toCurrency?.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Комиссия:</span>
                  <span className="font-semibold">{(commission * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary-500">
                  <span>Вы получите:</span>
                  <span>{toAmount} {toCurrency?.symbol}</span>
                </div>
              </div>
            )}

            {/* Exchange Button */}
            <Button
              size="lg"
              className="w-full"
              disabled={!fromCurrency || !toCurrency || !fromAmount || parseFloat(fromAmount) <= 0}
            >
              Обменять
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
