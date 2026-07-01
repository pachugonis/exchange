import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useOrderStore } from '../../store/orderStore';
import { useKYCStore } from '../../store/kycStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { systemAPI } from '../../api/systemAPI';
import { LanguageSelector } from '../ui/LanguageSelector';
import { LayoutDashboard, Settings, ShoppingCart, DollarSign, LogOut, Moon, Sun, Ticket, FileText, Shield, Mail, Star, Megaphone, Users, Globe, Lock } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout, token } = useAdminStore();
  const orders = useOrderStore((state) => state.orders);
  const kycData = useKYCStore((state) => state.kycData);
  const fetchAllKYC = useKYCStore((state) => state.fetchAllKYC);
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  // Подтягиваем KYC-заявки, чтобы счётчик был актуален на любой странице админки.
  React.useEffect(() => {
    fetchAllKYC();
  }, [fetchAllKYC]);

  // Проверяем наличие обновлений системы, чтобы подсветить пункт «Настройки».
  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    systemAPI.checkUpdate(token).then((res) => {
      if (!cancelled) setUpdateAvailable(res.ok && res.data.updateAvailable === true);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Новые необработанные заявки — оплаченные, ожидающие действия администратора.
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'payment_received' || o.status === 'verification'
  ).length;

  // Новые KYC-заявки, ожидающие проверки администратором.
  const pendingKYCCount = Object.values(kycData).filter(
    (k) => k.status === 'pending'
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.navigation.dashboard') },
    { path: '/admin/orders', icon: ShoppingCart, label: t('admin.navigation.orders'), badge: pendingOrdersCount },
    { path: '/admin/users', icon: Users, label: t('admin.navigation.users') },
    { path: '/admin/currencies', icon: DollarSign, label: t('admin.navigation.currencies') },
    { path: '/admin/promos', icon: Ticket, label: t('admin.navigation.promos') },
    { path: '/admin/kyc', icon: Shield, label: t('admin.navigation.kyc'), badge: pendingKYCCount },
    { path: '/admin/content', icon: FileText, label: t('admin.navigation.content') },
    { path: '/admin/announcements', icon: Megaphone, label: t('admin.navigation.announcements') },
    { path: '/admin/newsletter', icon: Mail, label: t('admin.navigation.newsletter') },
    { path: '/admin/reviews', icon: Star, label: t('admin.navigation.reviews') },
    { path: '/admin/site-settings', icon: Globe, label: t('admin.navigation.siteSettings') },
    { path: '/admin/settings', icon: Settings, label: t('admin.navigation.settings'), dot: updateAvailable },
    { path: '/admin/security', icon: Lock, label: t('admin.navigation.security') },
  ];

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin/dashboard" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ExchangeKit Admin
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-dark-600 dark:text-dark-400">
                {username}
              </span>
              
              <LanguageSelector />
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                {t('admin.navigation.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-dark-200 dark:border-dark-700 p-4 sticky top-24">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                        isActive
                          ? 'bg-primary-500 text-white'
                          : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                      {'badge' in item && item.badge ? (
                        <span
                          className={`ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-white text-primary-600'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                      {'dot' in item && item.dot ? (
                        <span className="ml-auto relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-dark-200 dark:border-dark-700">
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-dark-600 dark:text-dark-400 hover:text-primary-500 transition"
                >
                  ← {t('admin.navigation.returnToSite')}
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
