import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Direction {
  id: number;
  from: {
    code: string;
    name: string;
    icon: string;
  };
  to: {
    code: string;
    name: string;
    icon: string;
  };
  rate: string;
  trend?: 'up' | 'down';
  popular?: boolean;
}

const popularDirections: Direction[] = [
  {
    id: 1,
    from: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    to: { code: 'USDT', name: 'Tether', icon: '₮' },
    rate: '1 BTC = 42,150 USDT',
    trend: 'up',
    popular: true,
  },
  {
    id: 2,
    from: { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    to: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    rate: '1 ETH = 0.058 BTC',
    trend: 'up',
    popular: true,
  },
  {
    id: 3,
    from: { code: 'USDT', name: 'Tether', icon: '₮' },
    to: { code: 'RUB', name: 'Рубли', icon: '₽' },
    rate: '1 USDT = 92.5 RUB',
    popular: true,
  },
  {
    id: 4,
    from: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    to: { code: 'RUB', name: 'Рубли', icon: '₽' },
    rate: '1 BTC = 3,898,875 RUB',
    trend: 'up',
  },
  {
    id: 5,
    from: { code: 'PAYEER', name: 'Payeer USD', icon: 'P' },
    to: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    rate: '1000 USD = 0.0237 BTC',
  },
  {
    id: 6,
    from: { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    to: { code: 'USDT', name: 'Tether', icon: '₮' },
    rate: '1 ETH = 2,445 USDT',
    trend: 'up',
  },
  {
    id: 7,
    from: { code: 'PM', name: 'Perfect Money', icon: 'PM' },
    to: { code: 'USDT', name: 'Tether', icon: '₮' },
    rate: '100 USD = 99.5 USDT',
  },
  {
    id: 8,
    from: { code: 'CARD', name: 'Visa/MC RUB', icon: '💳' },
    to: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    rate: '100,000 RUB = 0.0257 BTC',
  },
];

export const PopularDirections: React.FC = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Популярные направления обмена</h2>
          <p className="text-dark-600 dark:text-dark-400">
            Самые востребованные пары для обмена с актуальными курсами
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularDirections.map((direction) => (
            <Link key={direction.id} to="/exchange">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
                <div className="flex flex-col h-full">
                  {direction.popular && (
                    <div className="mb-3">
                      <Badge variant="info" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Популярно
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{direction.from.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{direction.from.code}</div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">
                          {direction.from.name}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />

                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{direction.to.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{direction.to.code}</div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">
                          {direction.to.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-xs text-dark-500 dark:text-dark-400 mb-1">
                      Курс обмена
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{direction.rate}</span>
                      {direction.trend && (
                        <TrendingUp
                          className={`w-4 h-4 ${
                            direction.trend === 'up'
                              ? 'text-green-500'
                              : 'text-red-500 rotate-180'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/exchange">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
              Посмотреть все направления
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};
