import React, { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../../components/ui/Card';
import { TrendingUp, Clock, CheckCircle, Users, DollarSign } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { isAuthenticated, stats, loadStats } = useAdminStore();
  const { t } = useTranslation();

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
      title: t('admin.dashboard.stats.totalOrders'),
      value: stats.totalOrders,
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: t('admin.dashboard.stats.pendingOrders'),
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: t('admin.dashboard.stats.completedOrders'),
      value: stats.completedOrders,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: t('admin.dashboard.stats.activeUsers'),
      value: stats.activeUsers,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('admin.dashboard.title')}</h1>
        <p className="text-dark-600 dark:text-dark-400">
          {t('admin.dashboard.subtitle')}
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
              <h3 className="font-semibold text-lg mb-1">{t('admin.dashboard.quickActions.manageOrders')}</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                {t('admin.dashboard.quickActions.manageOrdersDesc')}
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/settings">
          <Card className="hover:border-primary-500 transition cursor-pointer">
            <div className="text-center py-6">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary-500" />
              <h3 className="font-semibold text-lg mb-1">{t('admin.dashboard.quickActions.settings')}</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                {t('admin.dashboard.quickActions.settingsDesc')}
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/currencies">
          <Card className="hover:border-primary-500 transition cursor-pointer">
            <div className="text-center py-6">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-primary-500" />
              <h3 className="font-semibold text-lg mb-1">{t('admin.dashboard.quickActions.currencies')}</h3>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                {t('admin.dashboard.quickActions.currenciesDesc')}
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Volume Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-lg mb-4">{t('admin.dashboard.stats.todayVolume')}</h3>
          <div className="text-3xl font-bold text-primary-500">
            ${stats.todayVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">{t('admin.dashboard.stats.totalVolume')}</h3>
          <div className="text-3xl font-bold text-primary-500">
            ${stats.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </Card>
      </div>
    </div>
  );
};
