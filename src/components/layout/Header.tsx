import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useUserStore } from '../../store/userStore';
import { useSiteSettingsStore } from '../../store/siteSettingsStore';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated } = useUserStore();
  const { settings } = useSiteSettingsStore();

  return (
    <header className="bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            {settings.siteLogo ? (
              <img src={settings.siteLogo} alt={settings.siteName} className="h-8 object-contain" />
            ) : (
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {settings.siteName}
              </span>
            )}
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              Главная
            </Link>
            <Link to="/exchange" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              Обмен
            </Link>
            <Link to="/tracking" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              Отслеживание
            </Link>
            <Link to="/about" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              О нас
            </Link>
            <Link to="/faq" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link
                to="/user/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                <User className="w-4 h-4" />
                {user.name}
              </Link>
            ) : (
              <Link
                to="/user/login"
                className="flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
              >
                <User className="w-4 h-4" />
                Войти
              </Link>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
