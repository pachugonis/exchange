import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: 'Как долго происходит обмен?',
    answer: 'Обычно обмен занимает от 5 до 30 минут. Время зависит от выбранных валют и загруженности сети. Криптовалютные транзакции могут занять больше времени из-за необходимости подтверждений в блокчейне.',
  },
  {
    id: 2,
    question: 'Какие комиссии берет сервис?',
    answer: 'Все комиссии уже включены в курс обмена. Вы видите итоговую сумму, которую получите, без каких-либо скрытых платежей. Дополнительно может взиматься только комиссия сети при переводе криптовалюты.',
  },
  {
    id: 3,
    question: 'Нужна ли регистрация для обмена?',
    answer: 'Нет, регистрация не требуется для обмена. Однако для некоторых направлений обмена может потребоваться базовая верификация (KYC) в соответствии с требованиями законодательства.',
  },
  {
    id: 4,
    question: 'Какой минимальный и максимальный объем обмена?',
    answer: 'Лимиты зависят от выбранных валют. Минимальная сумма обычно составляет от 10$ для электронных валют и от 0.001 BTC для криптовалют. Максимальные суммы указаны для каждого направления обмена.',
  },
  {
    id: 5,
    question: 'Что делать, если обмен задерживается?',
    answer: 'Если обмен задерживается более 30 минут, свяжитесь с нашей службой поддержки через чат на сайте или по email. Укажите номер вашей заявки, и мы оперативно решим проблему.',
  },
  {
    id: 6,
    question: 'Безопасно ли пользоваться сервисом?',
    answer: 'Да, мы используем SSL-шифрование для защиты данных, проводим AML/KYC проверки и следуем всем требованиям безопасности. Ваши средства защищены на всех этапах обмена.',
  },
  {
    id: 7,
    question: 'Можно ли отменить заявку?',
    answer: 'Вы можете отменить заявку до момента отправки средств. После отправки средств отмена невозможна. Если возникли проблемы, обратитесь в службу поддержки.',
  },
  {
    id: 8,
    question: 'Работает ли сервис круглосуточно?',
    answer: 'Да, наш сервис работает 24/7 без выходных. Служба поддержки также доступна круглосуточно для решения любых вопросов.',
  },
];

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleItem = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-20 px-4 bg-dark-50 dark:bg-dark-800/50">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Часто задаваемые вопросы</h2>
          <p className="text-dark-600 dark:text-dark-400">
            Ответы на популярные вопросы о работе сервиса
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-dark-800 rounded-lg border border-dark-200 dark:border-dark-700 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-50 dark:hover:bg-dark-700/50 transition"
              >
                <span className="font-semibold pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-dark-500 transition-transform flex-shrink-0 ${
                    openId === item.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openId === item.id && (
                <div className="px-6 pb-4 text-dark-600 dark:text-dark-300">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
          <h3 className="font-semibold mb-2">Не нашли ответ на свой вопрос?</h3>
          <p className="text-dark-600 dark:text-dark-400 mb-4">
            Свяжитесь с нашей службой поддержки, мы работаем 24/7
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:support@4ex.com"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              support@4ex.com
            </a>
            <span className="text-dark-400">•</span>
            <a
              href="https://t.me/4ex_support"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Telegram: @4ex_support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
