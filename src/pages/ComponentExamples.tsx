/**
 * Примеры использования новых компонентов
 * 
 * Этот файл демонстрирует как использовать все реализованные компоненты
 */

import React, { useState } from 'react';
import { 
  Testimonials, 
  FAQ, 
  PopularDirections 
} from '../components/home';

import { 
  ExchangeSteps, 
  ExchangeStatus, 
  ExchangeProgress,
  ExchangeCalculator,
  ExchangeInfo 
} from '../components/exchange';

import { 
  Alert, 
  Loader, 
  Spinner, 
  Tabs, 
  TabPanel,
  Modal,
  Badge,
  Card,
  Button
} from '../components/ui';

import { currencies } from '../data/currencies';
import type { OrderStatus } from '../types/order';

export const ComponentExamples: React.FC = () => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [showModal, setShowModal] = useState(false);
  const [orderStatus] = useState<OrderStatus>('payment_pending');

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Примеры компонентов ExchangeKit
        </h1>

        {/* Tabs Navigation */}
        <Tabs
          tabs={[
            { id: 'alerts', label: 'Alerts & Loaders' },
            { id: 'exchange', label: 'Exchange Components' },
            { id: 'sections', label: 'Home Sections' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-8"
        />

        {/* Alert & Loader Examples */}
        <TabPanel isActive={activeTab === 'alerts'}>
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
              <div className="space-y-4">
                <Alert variant="info" title="Информация">
                  Это информационное сообщение с важной информацией для пользователя.
                </Alert>
                
                <Alert variant="success" title="Успех">
                  Операция выполнена успешно! Ваши средства отправлены.
                </Alert>
                
                <Alert variant="warning" title="Внимание">
                  Пожалуйста, проверьте правильность введенных данных.
                </Alert>
                
                <Alert variant="error" title="Ошибка">
                  Произошла ошибка при обработке запроса. Попробуйте еще раз.
                </Alert>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Badges</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Loaders</h2>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-sm mb-2">Small</p>
                  <Loader size="sm" />
                </div>
                <div>
                  <p className="text-sm mb-2">Medium</p>
                  <Loader size="md" />
                </div>
                <div>
                  <p className="text-sm mb-2">Large</p>
                  <Loader size="lg" />
                </div>
              </div>
              
              <div className="mt-8">
                <Spinner text="Загрузка данных..." />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Modal</h2>
              <Button onClick={() => setShowModal(true)}>
                Открыть модальное окно
              </Button>
              
              <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Пример модального окна"
                size="md"
              >
                <div className="space-y-4">
                  <p>Это содержимое модального окна.</p>
                  <Alert variant="info">
                    Вы можете добавить любой контент в модальное окно.
                  </Alert>
                  <Button onClick={() => setShowModal(false)}>
                    Закрыть
                  </Button>
                </div>
              </Modal>
            </section>
          </div>
        </TabPanel>

        {/* Exchange Components */}
        <TabPanel isActive={activeTab === 'exchange'}>
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Exchange Status</h2>
              <div className="flex flex-wrap gap-4">
                <ExchangeStatus status="waiting_payment" />
                <ExchangeStatus status="payment_pending" />
                <ExchangeStatus status="payment_received" />
                <ExchangeStatus status="verification" />
                <ExchangeStatus status="sending" />
                <ExchangeStatus status="completed" />
                <ExchangeStatus status="cancelled" />
                <ExchangeStatus status="refund" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Exchange Progress</h2>
              <Card>
                <ExchangeProgress status={orderStatus} currentStep={2} />
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Exchange Calculator</h2>
              <div className="max-w-md">
                <ExchangeCalculator
                  currencies={currencies}
                  onExchange={(from, to, amount) => {
                    console.log('Exchange:', from, to, amount);
                  }}
                />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Exchange Info</h2>
              <div className="max-w-md">
                <ExchangeInfo
                  fromCurrency={currencies[0]}
                  toCurrency={currencies[1]}
                />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Exchange Steps Process</h2>
              <ExchangeSteps />
            </section>
          </div>
        </TabPanel>

        {/* Home Sections */}
        <TabPanel isActive={activeTab === 'sections'}>
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Popular Directions</h2>
              <PopularDirections />
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Testimonials</h2>
              <Testimonials />
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
              <FAQ />
            </section>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};

export default ComponentExamples;
