import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Settings,
  LogOut,
  Mail,
  Calendar,
  ArrowUpDown,
  Star,
  Shield,
  TrendingUp,
  Clock,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { ExchangeStatus } from '../../components/exchange';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUserStore();
  const { orders } = useOrderStore();
  const { favorites } = useFavoriteStore();
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/user/login');
    }
  }, [isAuthenticated, user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из аккаунта');
    // Use window.location for hard redirect to ensure clean state
    window.location.href = '/';
  };

  const userOrders = orders
    .filter(order => order.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first
  
  // Pagination calculations
  const totalPages = Math.ceil(userOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = userOrders.slice(startIndex, endIndex);
  const totalVolume = orders
    .filter(order => order.userId === user.id)
    .reduce((sum, order) => sum + order.fromAmount, 0);
  const completedOrders = orders.filter(
    (o) => o.userId === user.id && o.status === 'completed'
  ).length;
  const registeredDays = Math.floor(
    (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
  );

  const stats = [
    {
      icon: ArrowUpDown,
      label: 'Всего обменов',
      value: orders.filter(o => o.userId === user.id).length,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: TrendingUp,
      label: 'Объем обменов',
      value: `$${totalVolume.toFixed(2)}`,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Star,
      label: 'Избранное',
      value: favorites.length,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      icon: Calendar,
      label: 'С нами',
      value: `${registeredDays} дн.`,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Личный кабинет</h1>
              <p className="text-dark-600 dark:text-dark-400">
                Добро пожаловать, {user.name}!
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" />
                  На главную
                </Button>
              </Link>
              <Link to="/user/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Настройки
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Выход
              </Button>
            </div>
          </div>

          {!user.emailVerified && (
            <Alert variant="warning">
              Ваш email не подтвержден. Проверьте почту для подтверждения аккаунта.
            </Alert>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-dark-600 dark:text-dark-400">
                    {stat.label}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-dark-600 dark:text-dark-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-dark-500" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                    {user.emailVerified ? 'Подтвержден' : 'Не подтвержден'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-dark-500" />
                    <span className="text-sm">KYC</span>
                  </div>
                  <Badge
                    variant={
                      user.kycStatus === 'verified'
                        ? 'success'
                        : user.kycStatus === 'pending'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {user.kycStatus === 'verified'
                      ? 'Verified'
                      : user.kycStatus === 'pending'
                      ? 'Pending'
                      : 'None'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-dark-500" />
                    <span className="text-sm">Регистрация</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>

              <Link to="/user/settings">
                <Button variant="outline" className="w-full mt-6">
                  Редактировать профиль
                </Button>
              </Link>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Мои заявки</h3>
                <Link to="/tracking">
                  <Button variant="outline" size="sm">
                    Отследить заявку
                  </Button>
                </Link>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-dark-300 dark:text-dark-600 mb-3" />
                  <h4 className="font-semibold mb-2">Нет заявок</h4>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-4">
                    Вы еще не создали ни одной заявки на обмен
                  </p>
                  <Link to="/exchange">
                    <Button>Создать заявку</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 border border-dark-200 dark:border-dark-700 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{order.id}</div>
                        <ExchangeStatus status={order.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-dark-600 dark:text-dark-400">
                          {order.fromAmount} {order.fromCurrency.code} →{' '}
                          {order.toAmount} {order.toCurrency.code}
                        </div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-6 border-t border-dark-200 dark:border-dark-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-dark-600 dark:text-dark-400">
                        Показано {startIndex + 1}-{Math.min(endIndex, userOrders.length)} из {userOrders.length} записей
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
                  </div>
                )}
              </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
