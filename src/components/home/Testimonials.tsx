import React from 'react';
import { Star } from 'lucide-react';
import { Card } from '../ui/Card';

interface Testimonial {
  id: number;
  name: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Александр М.',
    rating: 5,
    text: 'Отличный сервис! Обмен прошел быстро, курс выгодный. Буду пользоваться еще.',
    date: '15.11.2025',
  },
  {
    id: 2,
    name: 'Мария К.',
    rating: 5,
    text: 'Очень довольна! Первый раз меняла криптовалюту, все понятно объяснили. Деньги пришли за 10 минут.',
    date: '12.11.2025',
  },
  {
    id: 3,
    name: 'Дмитрий П.',
    rating: 5,
    text: 'Пользуюсь уже полгода. Надежный обменник, всегда выгодные курсы и быстрая поддержка.',
    date: '08.11.2025',
  },
  {
    id: 4,
    name: 'Елена С.',
    rating: 4,
    text: 'Хороший сервис, обмен прошел без проблем. Единственное - иногда долго отвечает поддержка.',
    date: '05.11.2025',
  },
  {
    id: 5,
    name: 'Игорь В.',
    rating: 5,
    text: 'Лучший обменник! Меняю здесь BTC на рубли регулярно. Все четко и без задержек.',
    date: '01.11.2025',
  },
  {
    id: 6,
    name: 'Анна Л.',
    rating: 5,
    text: 'Рекомендую! Обменяла USDT на карту, все прошло отлично. Курс реально выгодный.',
    date: '28.10.2025',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Отзывы наших клиентов</h2>
          <p className="text-dark-600 dark:text-dark-400">
            Более 15 000 довольных пользователей доверяют нам свои средства
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">
                      {testimonial.date}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-dark-300 dark:text-dark-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-dark-600 dark:text-dark-300 text-sm flex-grow">
                {testimonial.text}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-dark-100 dark:bg-dark-800 rounded-full">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">4.9</span>
            <span className="text-dark-600 dark:text-dark-400">
              из 5 на основе 1,247 отзывов
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
