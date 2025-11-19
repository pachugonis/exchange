import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useThemeStore } from '../../store/themeStore';
import { LayoutDashboard, Settings, ShoppingCart, DollarSign, LogOut, Moon, Sun, Ticket, FileText, Shield, Mail } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAdminStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Панель' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Заявки' },
    { path: '/admin/currencies', icon: DollarSign, label: 'Валюты' },
    { path: '/admin/promos', icon: Ticket, label: 'Промокоды' },
    { path: '/admin/kyc', icon: Shield, label: 'KYC' },
    { path: '/admin/content', icon: FileText, label: 'Контент' },
    { path: '/admin/newsletter', icon: Mail, label: 'Рассылки' },
    { path: '/admin/settings', icon: Settings, label: 'Настройки' },
  ];

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin/dashboard" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              4EX Admin
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-dark-600 dark:text-dark-400">
                {username}
              </span>
              
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
                Выход
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
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-dark-200 dark:border-dark-700">
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-dark-600 dark:text-dark-400 hover:text-primary-500 transition"
                >
                  ← Вернуться на сайт
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
