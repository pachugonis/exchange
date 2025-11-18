import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-900 text-dark-100 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              4EX
            </h3>
            <p className="text-dark-400 text-sm">
              Надежный сервис обмена криптовалют и электронных денег
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2 text-dark-400">
              <li><Link to="/" className="hover:text-primary-400">Главная</Link></li>
              <li><Link to="/exchange" className="hover:text-primary-400">Обмен</Link></li>
              <li><Link to="/about" className="hover:text-primary-400">О нас</Link></li>
              <li><Link to="/faq" className="hover:text-primary-400">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-dark-400">
              <li><Link to="/rules" className="hover:text-primary-400">Правила</Link></li>
              <li><Link to="/reviews" className="hover:text-primary-400">Отзывы</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400">Контакты</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-3 text-dark-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                support@4ex.cash
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                @4ex_support
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                SSL Secure
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-dark-500 text-sm">
          <p>© 2024 4EX Currency Exchange. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};
