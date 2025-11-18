import React, { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { Card } from '../../components/ui/Card';
import { TrendingUp, Clock, CheckCircle, Users, DollarSign, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { isAuthenticated, stats, loadStats } = useAdminStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, loadStats]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const statCards = [
    {
      title: 'Всего заявок',
      value: stats.totalOrders,
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'В обработке',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: 'Завершено',
      value: stats.completedOrders,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Активных пользователей',
      value: stats.activeUsers,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
        <p className="text-dark-600 dark:text-dark-400">
          Обзор активности платформы обмена
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/orders">
          <Card className="hover:border-primary-500 transition cursor-pointer">
            <div className="text-center py-6">
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary-500" />
              <h3 className="font-semibold text-lg mb-1">Управление заявками</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                Просмотр и обработка всех заявок
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/settings">
          <Card className="hover:border-primary-500 transition cursor-pointer">
            <div className="text-center py-6">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary-500" />
              <h3 className="font-semibold text-lg mb-1">Настройки</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                Комиссии, адреса и параметры
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/currencies">
          <Card className="hover:border-primary-500 transition cursor-pointer">
            <div className="text-center py-6">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-primary-500" />
              <h3 className="font-semibold text-lg mb-1">Валюты</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                Управление списком валют
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Volume Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-lg mb-4">Объем за сегодня</h3>
          <div className="text-3xl font-bold text-primary-500">
            ${stats.todayVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">Общий объем</h3>
          <div className="text-3xl font-bold text-primary-500">
            ${stats.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </Card>
      </div>
    </div>
  );
};
