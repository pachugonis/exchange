import React from 'react';
import { Search, ArrowDownUp, Send, CheckCircle } from 'lucide-react';

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    icon: <Search className="w-8 h-8" />,
    title: 'Выберите валюты',
    description: 'Укажите что хотите обменять и что получить',
  },
  {
    id: 2,
    icon: <ArrowDownUp className="w-8 h-8" />,
    title: 'Проверьте курс',
    description: 'Убедитесь, что курс вас устраивает',
  },
  {
    id: 3,
    icon: <Send className="w-8 h-8" />,
    title: 'Отправьте средства',
    description: 'Переведите средства на указанный адрес',
  },
  {
    id: 4,
    icon: <CheckCircle className="w-8 h-8" />,
    title: 'Получите валюту',
    description: 'Средства поступят на ваш счет за 5-30 минут',
  },
];

export const ExchangeSteps: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-dark-50 dark:bg-dark-800/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Как работает обмен</h2>
          <p className="text-dark-600 dark:text-dark-400">
            Простой процесс обмена в 4 шага
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 -translate-x-1/2 z-0" />
              )}

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-primary text-white">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
                  {step.id}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-white dark:bg-dark-800 rounded-lg border border-dark-200 dark:border-dark-700 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary-500" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-2">Гарантия безопасности</h4>
                <p className="text-sm text-dark-600 dark:text-dark-400">
                  Все операции защищены SSL-шифрованием. Мы не храним ваши приватные ключи
                  и не имеем доступа к вашим кошелькам. Ваши средства в полной безопасности
                  на каждом этапе обмена.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
