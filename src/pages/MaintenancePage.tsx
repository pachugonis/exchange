import React from 'react';
import { Settings, Wrench } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-full mb-6 animate-pulse">
            <Wrench className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Технические работы
          </h1>
          
          <p className="text-xl text-dark-600 dark:text-dark-400 mb-8">
            Сайт временно недоступен в связи с проведением технического обслуживания
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start gap-4 text-left">
            <Settings className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Что происходит?</h3>
              <p className="text-dark-600 dark:text-dark-400 mb-4">
                Мы проводим плановые технические работы для улучшения качества сервиса. 
                Все ваши данные и заявки в безопасности.
              </p>
              
              <h3 className="font-semibold text-lg mb-2">Когда вернемся?</h3>
              <p className="text-dark-600 dark:text-dark-400">
                Работы будут завершены в ближайшее время. Пожалуйста, попробуйте зайти через несколько минут.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-dark-600 dark:text-dark-400">
            Если у вас есть срочные вопросы, свяжитесь с нами:
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:support@exchangekit.cc"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              📧 support@exchangekit.cc
            </a>
            
            <a
              href="https://t.me/exchangekit_support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              📱 @exchangekit_support
            </a>
          </div>
        </div>

        <div className="mt-12 text-sm text-dark-500 dark:text-dark-400">
          <p>Спасибо за ваше терпение и понимание!</p>
          <p className="mt-2">© 2025 ExchangeKit. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
};
