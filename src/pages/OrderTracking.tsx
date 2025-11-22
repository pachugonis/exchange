import React, { useState, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { ExchangeStatus, ExchangeProgress } from '../components/exchange';
import { ReviewForm } from '../components/exchange/ReviewForm';
import { useOrderStore } from '../store/orderStore';
import { useReviewStore } from '../store/reviewStore';
import { formatDate } from '../utils/formatters';

export const OrderTracking: React.FC = () => {
  const [searchId, setSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const { getOrderById, orders } = useOrderStore();
  const { getOrderReview } = useReviewStore();

  // Auto-refresh orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(Date.now());
      
      // If user is viewing a specific order, update it
      if (searchedOrder && searchId) {
        const updatedOrder = getOrderById(searchId);
        if (updatedOrder) {
          setSearchedOrder(updatedOrder);
        }
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [searchedOrder, searchId, getOrderById]);

  const handleSearch = () => {
    if (!searchId.trim()) {
      return;
    }

    const order = getOrderById(searchId.trim());
    setSearchedOrder(order || null);
    setHasSearched(true);
  };

  const recentOrders = orders.slice(-5).reverse();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Отслеживание заявки</h1>
          <div className="flex items-center justify-between">
            <p className="text-dark-600 dark:text-dark-400">
              Введите номер заявки для проверки статуса обмена
            </p>
            <p className="text-xs text-dark-500">
              Обновлено: {new Date(lastUpdateTime).toLocaleTimeString('ru-RU')}
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <Input
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  setHasSearched(false);
                }}
                placeholder="Введите номер заявки (например: ORD-1234567890123)"
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>Найти</Button>
          </div>
        </Card>

        {/* Search Results */}
        {hasSearched && searchedOrder === null && (
          <Alert variant="warning" className="mb-8">
            Заявка с номером <strong>{searchId}</strong> не найдена.
            Проверьте правильность номера.
          </Alert>
        )}

        {searchedOrder && (
          <Card className="mb-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Заявка {searchedOrder.id}</h2>
                  <p className="text-sm text-dark-500 dark:text-dark-400">
                    Создана: {formatDate(searchedOrder.createdAt)}
                  </p>
                </div>
                <ExchangeStatus status={searchedOrder.status} />
              </div>

              <ExchangeProgress
                status={searchedOrder.status}
                currentStep={searchedOrder.statusHistory.length}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3">Детали обмена</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-600 dark:text-dark-400">Отдаете:</span>
                    <span className="font-medium">
                      {searchedOrder.fromAmount} {searchedOrder.fromCurrency.code} ({searchedOrder.fromCurrency.name})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-600 dark:text-dark-400">Получаете:</span>
                    <span className="font-medium">
                      {searchedOrder.toAmount} {searchedOrder.toCurrency.code} ({searchedOrder.toCurrency.name})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-600 dark:text-dark-400">Курс:</span>
                    <span className="font-medium">{searchedOrder.rate.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Контакты</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-600 dark:text-dark-400">Email:</span>
                    <span className="font-medium blur-sm select-none" title="Конфиденциальная информация">
                      {searchedOrder.contactInfo.email}
                    </span>
                  </div>
                  {searchedOrder.contactInfo.telegram && (
                    <div className="flex justify-between">
                      <span className="text-dark-600 dark:text-dark-400">Telegram:</span>
                      <span className="font-medium blur-sm select-none" title="Конфиденциальная информация">
                        @{searchedOrder.contactInfo.telegram}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-dark-500 dark:text-dark-400 italic">
                  * Контактная информация скрыта для защиты конфиденциальности
                </div>
              </div>
            </div>

            {/* Status History */}
            <div>
              <h3 className="font-semibold mb-3">История статусов</h3>
              <div className="space-y-2">
                {searchedOrder.statusHistory.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-lg"
                  >
                    <Clock className="w-4 h-4 text-primary-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {item.status.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-dark-500 dark:text-dark-400">
                        {formatDate(item.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Review Section - Only show for completed orders */}
        {searchedOrder && searchedOrder.status === 'completed' && !searchedOrder.hasReview && (
          <div className="mb-8">
            {!showReviewForm ? (
              <Card>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Обмен завершен успешно!</h3>
                  <p className="text-dark-600 dark:text-dark-400 mb-4">
                    Пожалуйста, оставьте отзыв о вашем опыте обмена
                  </p>
                  <Button onClick={() => setShowReviewForm(true)}>
                    Оставить отзыв
                  </Button>
                </div>
              </Card>
            ) : (
              <ReviewForm 
                order={searchedOrder} 
                onSubmitSuccess={() => {
                  setShowReviewForm(false);
                  // Update the searched order to reflect the review
                  const updatedOrder = getOrderById(searchedOrder.id);
                  setSearchedOrder(updatedOrder);
                }}
              />
            )}
          </div>
        )}

        {/* Show existing review if already submitted */}
        {searchedOrder && searchedOrder.hasReview && (() => {
          const review = getOrderReview(searchedOrder.id);
          return review ? (
            <Card className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Ваш отзыв</h3>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= review.rating ? 'text-yellow-400' : 'text-dark-300'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-dark-600 dark:text-dark-400 mb-2">{review.comment}</p>
              <p className="text-sm text-dark-500">
                Отзыв оставлен {formatDate(review.createdAt)}
              </p>
              {review.response && (
                <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Ответ администрации:</p>
                  <p className="text-sm text-dark-600 dark:text-dark-400">{review.response.text}</p>
                  <p className="text-xs text-dark-500 mt-1">
                    {review.response.author} • {formatDate(review.response.createdAt)}
                  </p>
                </div>
              )}
            </Card>
          ) : null;
        })()}

        {/* Recent Orders */}
        {recentOrders.length > 0 && !searchId && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Последние заявки</h2>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => {
                    setSearchId(order.id);
                    setSearchedOrder(order);
                    setHasSearched(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{order.id}</div>
                      <div className="text-sm text-dark-600 dark:text-dark-400">
                        {order.fromAmount} {order.fromCurrency.code} ({order.fromCurrency.name}) →{' '}
                        {order.toAmount} {order.toCurrency.code} ({order.toCurrency.name})
                      </div>
                      <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <ExchangeStatus status={order.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {recentOrders.length === 0 && !searchId && (
          <Alert variant="info">
            У вас пока нет заявок. Создайте первую заявку на обмен!
          </Alert>
        )}
      </div>
    </div>
  );
};
