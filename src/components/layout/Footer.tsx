import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Shield, Send } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNewsletterStore } from '../../store/newsletterStore';
import toast from 'react-hot-toast';

export const Footer: React.FC = () => {
  const { addSubscriber } = useNewsletterStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const result = await addSubscriber(email);
    setLoading(false);

    if (result.success) {
      toast.success('Вы успешно подписались на рассылку!');
      setEmail('');
    } else {
      toast.error(result.error || 'Ошибка подписки');
    }
  };

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
        
        {/* Newsletter Subscription */}
        <div className="border-t border-dark-700 mt-8 pt-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-semibold mb-2">Подписывайтесь на рассылку</h4>
            <p className="text-dark-400 text-sm mb-4">
              Получайте новости и специальные предложения
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-dark-800 border-dark-600"
                required
              />
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? 'Отправка...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Подписаться
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Banners Section */}
        <div className="border-t border-dark-700 mt-8 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className="w-[88px] h-[31px] bg-dark-800 border border-dark-700 rounded flex items-center justify-center hover:border-primary-500 transition cursor-pointer"
                title={`Баннер ${index}`}
              >
                <span className="text-xs text-dark-500">{88}×{31}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-dark-500 text-sm">
          <p>© 2024 4EX Currency Exchange. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};
