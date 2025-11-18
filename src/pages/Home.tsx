import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Clock, Award } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Быстрый и надежный обмен валют
          </h1>
          <p className="text-xl text-dark-600 dark:text-dark-300 mb-8 max-w-2xl mx-auto">
            Обменивайте криптовалюты, электронные деньги и банковские карты по выгодным курсам
          </p>
          <Link to="/exchange">
            <Button size="lg" className="gap-2">
              Начать обмен <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
            <div className="text-dark-600 dark:text-dark-400">
              <div className="text-2xl font-bold text-primary-500">15 000+</div>
              <div>Успешных обменов</div>
            </div>
            <div className="text-dark-600 dark:text-dark-400">
              <div className="text-2xl font-bold text-primary-500">24/7</div>
              <div>Поддержка клиентов</div>
            </div>
            <div className="text-dark-600 dark:text-dark-400">
              <div className="text-2xl font-bold text-primary-500">5-30 мин</div>
              <div>Время обмена</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-dark-50 dark:bg-dark-800/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Почему выбирают нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <Zap className="w-10 h-10 text-primary-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Высокая скорость</h3>
              <p className="text-dark-600 dark:text-dark-400 text-sm">
                Обмен занимает от 5 до 30 минут
              </p>
            </Card>
            
            <Card>
              <Shield className="w-10 h-10 text-primary-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Безопасность</h3>
              <p className="text-dark-600 dark:text-dark-400 text-sm">
                SSL шифрование и AML/KYC проверки
              </p>
            </Card>
            
            <Card>
              <Clock className="w-10 h-10 text-primary-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Круглосуточно</h3>
              <p className="text-dark-600 dark:text-dark-400 text-sm">
                Работаем 24/7 без выходных
              </p>
            </Card>
            
            <Card>
              <Award className="w-10 h-10 text-primary-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Выгодные курсы</h3>
              <p className="text-dark-600 dark:text-dark-400 text-sm">
                Лучшие курсы обмена на рынке
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Готовы начать?</h2>
          <p className="text-dark-600 dark:text-dark-300 mb-8 max-w-2xl mx-auto">
            Создайте заявку прямо сейчас и обменяйте валюту по выгодному курсу
          </p>
          <Link to="/exchange">
            <Button size="lg">Обменять валюту</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
