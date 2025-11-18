import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useOrderStore } from '../../store/orderStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, XCircle, Search } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { orders } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contactInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      waiting_payment: 'yellow',
      payment_pending: 'yellow',
      payment_received: 'blue',
      verification: 'blue',
      sending: 'blue',
      completed: 'green',
      cancelled: 'red',
      refund: 'orange',
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status: OrderStatus): string => {
    const texts: Record<OrderStatus, string> = {
      waiting_payment: 'Ожидание оплаты',
      payment_pending: 'Проверка оплаты',
      payment_received: 'Оплата получена',
      verification: 'Проверка',
      sending: 'Отправка',
      completed: 'Завершено',
      cancelled: 'Отменено',
      refund: 'Возврат',
    };
    return texts[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление заявками</h1>
        <p className="text-dark-600 dark:text-dark-400">
          Просмотр и управление всеми заявками обмена
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="ID заявки или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все статусы</option>
              <option value="waiting_payment">Ожидание оплаты</option>
              <option value="payment_pending">Проверка оплаты</option>
              <option value="payment_received">Оплата получена</option>
              <option value="verification">Проверка</option>
              <option value="sending">Отправка</option>
              <option value="completed">Завершено</option>
              <option value="cancelled">Отменено</option>
              <option value="refund">Возврат</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-dark-500">Заявки не найдены</p>
            </div>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Order Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-sm text-dark-500">#{order.id}</p>
                      <p className="text-xs text-dark-400">
                        {new Date(order.createdAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(order.status) as any}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-dark-500">Email:</span>{' '}
                      <span className="font-medium">{order.contactInfo.email}</span>
                    </p>
                    <p>
                      <span className="text-dark-500">Обмен:</span>{' '}
                      <span className="font-medium">
                        {order.fromAmount} {order.fromCurrency.code} → {order.toAmount}{' '}
                        {order.toCurrency.code}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Wallets */}
                <div className="text-sm">
                  <p className="text-dark-500 text-xs mb-1">Кошелек отправителя:</p>
                  <p className="font-mono text-xs break-all mb-2">
                    {order.paymentDetails.fromWallet}
                  </p>
                  <p className="text-dark-500 text-xs mb-1">Кошелек получателя:</p>
                  <p className="font-mono text-xs break-all">
                    {order.paymentDetails.toWallet}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      <Button size="sm" variant="outline">
                        Подтвердить
                      </Button>
                      <Button size="sm" variant="outline">
                        Отменить
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost">
                    Подробнее
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">
                {orders.filter((o) => o.status === 'waiting_payment').length}
              </p>
              <p className="text-sm text-dark-500">Ожидают оплаты</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {
                  orders.filter((o) =>
                    ['payment_pending', 'verification', 'sending'].includes(o.status)
                  ).length
                }
              </p>
              <p className="text-sm text-dark-500">В обработке</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {orders.filter((o) => o.status === 'completed').length}
              </p>
              <p className="text-sm text-dark-500">Завершено</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
