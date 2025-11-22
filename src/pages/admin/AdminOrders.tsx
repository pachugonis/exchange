import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useOrderStore } from '../../store/orderStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, XCircle, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminOrders: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { orders, updateOrderStatus } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Debug: Log orders when component mounts or orders change
  useEffect(() => {
    console.log('AdminOrders - Total orders:', orders.length);
    // Check for STRK orders specifically
    const strkOrders = orders.filter(o => 
      o.fromCurrency?.code === 'STRK' || o.toCurrency?.code === 'STRK'
    );
    console.log('AdminOrders - STRK orders found:', strkOrders.length);
    if (strkOrders.length > 0) {
      console.log('AdminOrders - STRK orders:', strkOrders);
    }
  }, [orders]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const filteredOrders = orders.filter((order) => {
    // Safety check for order structure
    if (!order || !order.id || !order.contactInfo) {
      console.warn('AdminOrders - Invalid order structure:', order);
      return false;
    }
    
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contactInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matches = matchesSearch && matchesStatus;
    
    return matches;
  }).sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

  const getStatusBgColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      waiting_payment: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      payment_pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      payment_received: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      verification: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      sending: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
      refund: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
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

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Статус заявки обновлен на "${getStatusText(newStatus)}"`);
  };

  // Update selectedOrder when orders change
  React.useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder]);

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
          paginatedOrders.map((order) => (
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
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBgColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-dark-500">Email:</span>{' '}
                      <span className="font-medium">{order.contactInfo.email}</span>
                    </p>
                    <p>
                      <span className="text-dark-500">Обмен:</span>{' '}
                      <span className="font-medium">
                        {order.fromAmount} {order.fromCurrency.code} ({order.fromCurrency.name || order.fromCurrency.code}) → {order.toAmount}{' '}
                        {order.toCurrency.code} ({order.toCurrency.name || order.toCurrency.code})
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(order.id, 'completed')}
                      >
                        Подтвердить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                      >
                        Отменить
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleShowDetails(order)}
                  >
                    Подробнее
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-dark-600 dark:text-dark-400">
              Показано {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} из {filteredOrders.length} записей
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-dark-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

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

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Детали заявки #{selectedOrder.id}</h2>
              <button
                onClick={handleCloseDetails}
                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Статус заявки</label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
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

              {/* General Info */}
              <Card>
                <h3 className="font-semibold mb-4">Общая информация</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dark-500">ID заявки</p>
                    <p className="font-mono font-medium">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-dark-500">Дата создания</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-500">Текущий статус</p>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getStatusBgColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Exchange Details */}
              <Card>
                <h3 className="font-semibold mb-4">Детали обмена</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-500">Отдаете:</span>
                    <span className="font-medium">
                      {selectedOrder.fromAmount} {selectedOrder.fromCurrency.code} ({selectedOrder.fromCurrency.name || selectedOrder.fromCurrency.code})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Получаете:</span>
                    <span className="font-medium">
                      {selectedOrder.toAmount} {selectedOrder.toCurrency.code} ({selectedOrder.toCurrency.name || selectedOrder.toCurrency.code})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Курс:</span>
                    <span className="font-medium">{selectedOrder.rate.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Комиссия:</span>
                    <span className="font-medium">{(selectedOrder.commission * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </Card>

              {/* Contact Info */}
              <Card>
                <h3 className="font-semibold mb-4">Контактная информация</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-dark-500">Email</p>
                    <p className="font-medium">{selectedOrder.contactInfo.email}</p>
                  </div>
                  {selectedOrder.contactInfo.telegram && (
                    <div>
                      <p className="text-dark-500">Telegram</p>
                      <p className="font-medium">{selectedOrder.contactInfo.telegram}</p>
                    </div>
                  )}
                  {selectedOrder.contactInfo.promoCode && (
                    <div>
                      <p className="text-dark-500">Промокод</p>
                      <p className="font-medium">{selectedOrder.contactInfo.promoCode}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Payment Details */}
              <Card>
                <h3 className="font-semibold mb-4">Платежные реквизиты</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-dark-500 mb-1">Кошелек отправителя ({selectedOrder.fromCurrency.code})</p>
                    <p className="font-mono text-xs bg-dark-100 dark:bg-dark-700 p-2 rounded break-all">
                      {selectedOrder.paymentDetails.fromWallet}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-500 mb-1">Кошелек получателя ({selectedOrder.toCurrency.code})</p>
                    <p className="font-mono text-xs bg-dark-100 dark:bg-dark-700 p-2 rounded break-all">
                      {selectedOrder.paymentDetails.toWallet}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCloseDetails}>
                  Закрыть
                </Button>
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, 'cancelled');
                      }}
                    >
                      Отменить заявку
                    </Button>
                    <Button 
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, 'completed');
                      }}
                    >
                      Завершить заявку
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
