import React, { useState, useEffect } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Currency } from '../../types';

interface ExchangeCalculatorProps {
  currencies: Currency[];
  onExchange?: (fromCurrency: string, toCurrency: string, amount: number) => void;
  className?: string;
}

export const ExchangeCalculator: React.FC<ExchangeCalculatorProps> = ({
  currencies,
  onExchange,
  className = '',
}) => {
  const [fromCurrency, setFromCurrency] = useState<string>('');
  const [toCurrency, setToCurrency] = useState<string>('');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [rate, setRate] = useState<number>(1);

  useEffect(() => {
    if (fromCurrency && toCurrency && fromAmount) {
      // Mock calculation - в реальном приложении здесь будет API запрос
      const calculatedRate = 1.05; // Примерный курс
      setRate(calculatedRate);
      const calculated = parseFloat(fromAmount) * calculatedRate;
      setToAmount(calculated.toFixed(2));
    }
  }, [fromCurrency, toCurrency, fromAmount]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.icon} ${c.name}`,
  }));

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold mb-4">Калькулятор обмена</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Вы отдаете</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1"
            />
            <Select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              options={currencyOptions}
              className="w-48"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
            type="button"
          >
            <ArrowDownUp className="w-5 h-5 text-primary-500" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Вы получаете</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-dark-50 dark:bg-dark-700"
            />
            <Select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              options={currencyOptions}
              className="w-48"
            />
          </div>
        </div>

        {fromCurrency && toCurrency && (
          <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-600 dark:text-dark-400">Курс обмена</span>
              <span className="font-semibold">
                1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-600 dark:text-dark-400">Комиссия</span>
              <span className="font-semibold text-green-500">Включена в курс</span>
            </div>
          </div>
        )}

        {onExchange && fromCurrency && toCurrency && fromAmount && (
          <button
            onClick={() => onExchange(fromCurrency, toCurrency, parseFloat(fromAmount))}
            className="w-full py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            Обменять
          </button>
        )}
      </div>
    </Card>
  );
};
