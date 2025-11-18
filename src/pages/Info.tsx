import React from 'react';
import { Card } from '../components/ui/Card';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">О нас</h1>
        <Card>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-4">
              4EX - это надежный сервис обмена криптовалют и электронных денег, работающий с 2020 года.
            </p>
            <p className="mb-4">
              Мы предоставляем быстрый и безопасный обмен различных валют по выгодным курсам. Наша цель - сделать процесс обмена максимально простым и удобным для каждого клиента.
            </p>
            <h2 className="text-2xl font-bold mt-6 mb-4">Наши преимущества:</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Высокая скорость обработки заявок (5-30 минут)</li>
              <li>Низкие комиссии</li>
              <li>Круглосуточная поддержка</li>
              <li>Безопасность и конфиденциальность</li>
              <li>Широкий выбор направлений обмена</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Часто задаваемые вопросы</h1>
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-lg mb-2">Как работает обмен валют?</h3>
            <p className="text-dark-600 dark:text-dark-400">
              Выберите валюты для обмена, укажите сумму, заполните контактные данные и реквизиты. После подтверждения заявки переведите средства на указанный адрес.
            </p>
          </Card>
          
          <Card>
            <h3 className="font-semibold text-lg mb-2">Нужна ли регистрация?</h3>
            <p className="text-dark-600 dark:text-dark-400">
              Нет, регистрация не требуется. Для обмена достаточно указать email для связи.
            </p>
          </Card>
          
          <Card>
            <h3 className="font-semibold text-lg mb-2">Как долго выполняется обмен?</h3>
            <p className="text-dark-600 dark:text-dark-400">
              Обычно обмен занимает от 5 до 30 минут после подтверждения оплаты.
            </p>
          </Card>
          
          <Card>
            <h3 className="font-semibold text-lg mb-2">Какая комиссия за обмен?</h3>
            <p className="text-dark-600 dark:text-dark-400">
              Комиссия составляет 1-3% в зависимости от направления обмена. Все комиссии отображаются при расчете.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
