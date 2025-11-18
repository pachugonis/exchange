import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { 
  RateChart, 
  PromoCodeInput, 
  FavoriteButton, 
  FavoritesList 
} from '../components/exchange';
import { useExchangeStore } from '../store/exchangeStore';
import { TrendingUp, Tag, Star, BarChart3 } from 'lucide-react';

export const NewFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const { currencies } = useExchangeStore();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Новые возможности 4EX</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Улучшенный функционал для удобного обмена валют
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'chart', label: 'График курсов', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'promo', label: 'Промокоды', icon: <Tag className="w-4 h-4" /> },
            { id: 'favorites', label: 'Избранное', icon: <Star className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-8"
        />

        <TabPanel isActive={activeTab === 'chart'}>
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-500" />
                График истории курсов
              </h2>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Отслеживайте изменения курсов в реальном времени на удобных графиках.
                Выбирайте период от 1 часа до 30 дней для анализа трендов.
              </p>
            </Card>

            <RateChart fromCurrency="BTC" toCurrency="USDT" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RateChart fromCurrency="ETH" toCurrency="BTC" />
              <RateChart fromCurrency="USDT" toCurrency="RUB" />
            </div>
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'promo'}>
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Tag className="w-6 h-6 text-primary-500" />
                Система промокодов
              </h2>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Используйте промокоды для получения скидок на комиссию или бонусов к обмену.
                Промокоды действуют при соблюдении минимальной суммы обмена.
              </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-semibold mb-4">Применить промокод</h3>
                <PromoCodeInput
                  amount={1000}
                  onApply={(discount, type, bonusAmount) => {
                    console.log('Promo applied:', { discount, type, bonusAmount });
                  }}
                />
              </Card>

              <Card>
                <h3 className="font-semibold mb-4">Доступные промокоды</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        WELCOME10
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        -10% комиссия
                      </span>
                    </div>
                    <p className="text-sm text-dark-600 dark:text-dark-400">
                      Скидка 10% на комиссию. Мин. сумма: 100
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        BONUS50
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                        +50 бонус
                      </span>
                    </div>
                    <p className="text-sm text-dark-600 dark:text-dark-400">
                      Бонус +50 к сумме обмена. Мин. сумма: 1000
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        VIP20
                      </span>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                        -20% комиссия
                      </span>
                    </div>
                    <p className="text-sm text-dark-600 dark:text-dark-400">
                      VIP скидка 20% на комиссию. Мин. сумма: 500
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'favorites'}>
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                Избранные направления
              </h2>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Сохраняйте часто используемые пары валют для быстрого доступа.
                Избранное синхронизируется автоматически и доступно на всех устройствах.
              </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-semibold mb-4">Добавить в избранное</h3>
                <p className="text-sm text-dark-600 dark:text-dark-400 mb-4">
                  Нажмите на кнопку со звездочкой, чтобы добавить пару в избранное:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <span className="text-sm">BTC → USDT</span>
                    <FavoriteButton fromCurrency="BTC" toCurrency="USDT_TRC20" showLabel />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <span className="text-sm">ETH → BTC</span>
                    <FavoriteButton fromCurrency="ETH" toCurrency="BTC" showLabel />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <span className="text-sm">USDT → RUB</span>
                    <FavoriteButton fromCurrency="USDT_TRC20" toCurrency="CARD_RUB" showLabel />
                  </div>
                </div>
              </Card>

              <FavoritesList
                onSelect={(from, to) => {
                  console.log('Selected favorite:', from, to);
                  // Здесь можно перенаправить на страницу обмена
                }}
              />
            </div>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
