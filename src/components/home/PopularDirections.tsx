import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { useTranslation } from '../../hooks/useTranslation';
import { Badge } from '../ui/Badge';
import { useOrderStore } from '../../store/orderStore';
import { formatNumber } from '../../utils/formatters';
import type { Order } from '../../types';

interface Direction {
  id: string;
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

// Статичные направления — используются как запасной вариант, пока на площадке
// ещё нет реальных обменов (например, сразу после установки).
const fallbackDirections: Direction[] = [
  {
    id: 'fb-1',
    from: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    to: { code: 'CARD_RUB', name: 'Visa/MC RUB', icon: '💳' },
    rate: '1 BTC ≈ 9 850 000 RUB',
    trend: 'up',
    popular: true,
  },
  {
    id: 'fb-2',
    from: { code: 'USDT', name: 'Tether TRC20', icon: '₮' },
    to: { code: 'CARD_RUB', name: 'Visa/MC RUB', icon: '💳' },
    rate: '1 USDT ≈ 101,5 RUB',
    popular: true,
  },
  {
    id: 'fb-3',
    from: { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    to: { code: 'CARD_RUB', name: 'Visa/MC RUB', icon: '💳' },
    rate: '1 ETH ≈ 375 000 RUB',
    trend: 'up',
    popular: true,
  },
  {
    id: 'fb-4',
    from: { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    to: { code: 'USDT', name: 'Tether', icon: '₮' },
    rate: '1 BTC ≈ 97 000 USDT',
    trend: 'up',
  },
];

const MAX_DIRECTIONS = 8;

// Форматируем курс вида «1 BTC ≈ 9 850 000 RUB», подбирая число знаков после
// запятой в зависимости от величины курса.
const formatRate = (fromCode: string, toCode: string, rate: number): string => {
  if (!isFinite(rate) || rate <= 0) return '';
  const decimals = rate >= 1000 ? 0 : rate >= 1 ? 2 : 6;
  return `1 ${fromCode} ≈ ${formatNumber(rate, decimals)} ${toCode}`;
};

// Строим список популярных направлений из реальных заявок: группируем по паре
// «отдал → получил», считаем частоту, самые частые показываем первыми.
const buildDirectionsFromOrders = (orders: Order[]): Direction[] => {
  // Учитываем только заявки, по которым была реальная оплата (не брошенные
  // и не отменённые до оплаты).
  const relevant = orders.filter(
    (o) => o.status !== 'waiting_payment' && o.status !== 'cancelled'
  );

  interface Group {
    key: string;
    from: Order['fromCurrency'];
    to: Order['toCurrency'];
    count: number;
    latest: Order;
  }

  const groups = new Map<string, Group>();
  for (const order of relevant) {
    if (!order.fromCurrency || !order.toCurrency) continue;
    const key = `${order.fromCurrency.code}->${order.toCurrency.code}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      if (order.createdAt > existing.latest.createdAt) existing.latest = order;
    } else {
      groups.set(key, {
        key,
        from: order.fromCurrency,
        to: order.toCurrency,
        count: 1,
        latest: order,
      });
    }
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.latest.createdAt - a.latest.createdAt;
  });

  const maxCount = sorted.length > 0 ? sorted[0].count : 0;

  return sorted.slice(0, MAX_DIRECTIONS).map((group) => {
    const { from, to, latest } = group;
    const rate =
      latest.rate ||
      (latest.fromAmount ? latest.toAmount / latest.fromAmount : 0);
    return {
      id: group.key,
      from: { code: from.code, name: from.name, icon: from.icon },
      to: { code: to.code, name: to.name, icon: to.icon },
      rate: formatRate(from.code, to.code, rate),
      // «Популярно» — направления с максимальной (и не единичной) частотой.
      popular: group.count === maxCount && maxCount > 1,
    };
  });
};

export const PopularDirections: React.FC = () => {
  const { t } = useTranslation();
  const orders = useOrderStore((state) => state.orders);

  const directions = useMemo(() => {
    const fromOrders = buildDirectionsFromOrders(orders);
    return fromOrders.length > 0 ? fromOrders : fallbackDirections;
  }, [orders]);

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('home.popularDirections.title')}</h2>
          <p className="text-dark-600 dark:text-dark-400">
            {t('home.popularDirections.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {directions.map((direction) => (
            <Link key={direction.id} to="/exchange">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
                <div className="flex flex-col h-full">
                  {direction.popular && (
                    <div className="mb-3">
                      <Badge variant="info" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {t('home.popularDirections.popular')}
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
                      {t('home.popularDirections.exchangeRate')}
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
              {t('home.popularDirections.viewAll')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};
