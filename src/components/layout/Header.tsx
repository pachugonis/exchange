import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            4EX
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              Главная
            </Link>
            <Link to="/exchange" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              Обмен
            </Link>
            <Link to="/about" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              О нас
            </Link>
            <Link to="/faq" className="text-dark-700 dark:text-dark-300 hover:text-primary-500 transition">
              FAQ
            </Link>
          </nav>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
