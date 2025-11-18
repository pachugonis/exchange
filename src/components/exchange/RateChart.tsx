import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { Loader } from '../ui/Loader';
import { Button } from '../ui/Button';
import type { RateHistoryPoint } from '../../types/chart';

interface RateChartProps {
  fromCurrency: string;
  toCurrency: string;
  className?: string;
}

type Period = '1h' | '24h' | '7d' | '30d';

// Mock data generator for demonstration
const generateMockData = (period: Period): RateHistoryPoint[] => {
  const points: RateHistoryPoint[] = [];
  const now = Date.now();
  let intervals: number;
  let step: number;

  switch (period) {
    case '1h':
      intervals = 12;
      step = 5 * 60 * 1000; // 5 minutes
      break;
    case '24h':
      intervals = 24;
      step = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      intervals = 7;
      step = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '30d':
      intervals = 30;
      step = 24 * 60 * 60 * 1000; // 1 day
      break;
  }

  const baseRate = 1.0;
  for (let i = intervals; i >= 0; i--) {
    const timestamp = now - i * step;
    const variation = (Math.random() - 0.5) * 0.1;
    const rate = baseRate + variation;
    
    const date = new Date(timestamp);
    const dateStr =
      period === '1h'
        ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : period === '24h'
        ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });

    points.push({
      timestamp,
      rate,
      date: dateStr,
    });
  }

  return points;
};

export const RateChart: React.FC<RateChartProps> = ({
  fromCurrency,
  toCurrency,
  className = '',
}) => {
  const [period, setPeriod] = useState<Period>('24h');
  const [data, setData] = useState<RateHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData(period));
      setLoading(false);
    }, 500);
  }, [period, fromCurrency, toCurrency]);

  const periods: { value: Period; label: string }[] = [
    { value: '1h', label: '1 час' },
    { value: '24h', label: '24 часа' },
    { value: '7d', label: '7 дней' },
    { value: '30d', label: '30 дней' },
  ];

  const currentRate = data.length > 0 ? data[data.length - 1].rate : 0;
  const previousRate = data.length > 1 ? data[0].rate : 0;
  const change = currentRate - previousRate;
  const changePercent = previousRate ? (change / previousRate) * 100 : 0;

  return (
    <Card className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              График курса {fromCurrency}/{toCurrency}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">
                {currentRate.toFixed(4)}
              </span>
              <span
                className={`text-sm font-medium ${
                  change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {change >= 0 ? '+' : ''}
                {changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                variant={period === p.value ? 'primary' : 'outline'}
                size="sm"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-dark-200 dark:stroke-dark-700" />
            <XAxis
              dataKey="date"
              className="text-xs fill-dark-600 dark:fill-dark-400"
            />
            <YAxis
              domain={['auto', 'auto']}
              className="text-xs fill-dark-600 dark:fill-dark-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'var(--text-primary, #000)' }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 text-xs text-dark-500 dark:text-dark-400">
        * Данные обновляются каждые 60 секунд
      </div>
    </Card>
  );
};
