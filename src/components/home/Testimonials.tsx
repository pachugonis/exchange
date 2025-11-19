import React from 'react';
import { Star, MessageCircle, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { useReviewStore } from '../../store/reviewStore';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export const Testimonials: React.FC = () => {
  const { getPublishedReviews } = useReviewStore();
  const allReviews = getPublishedReviews();
  
  // Get 6 most recent reviews
  const recentReviews = allReviews.slice(0, 6);
  
  // Calculate average rating from all reviews
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : '0';

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Отзывы наших клиентов</h2>
          <p className="text-dark-600 dark:text-dark-400">
            Более 15 000 довольных пользователей доверяют нам свои средства
          </p>
        </div>

        {recentReviews.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <Alert variant="info">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-primary-500" />
                <p className="font-medium mb-2">Пока нет отзывов</p>
                <p className="text-sm text-dark-600 dark:text-dark-400">
                  Станьте первым, кто оставит отзыв о нашем сервисе после успешного обмена!
                </p>
              </div>
            </Alert>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentReviews.map((review) => (
                <Card key={review.id} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{review.userName}</div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-dark-300 dark:text-dark-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Exchange Direction */}
                  {review.exchangeDirection && (
                    <div className="mb-3 pb-3 border-b border-dark-200 dark:border-dark-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {review.exchangeDirection.fromAmount} {review.exchangeDirection.fromCurrency}
                        </span>
                        <ArrowRight className="w-4 h-4 text-dark-400" />
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {review.exchangeDirection.toAmount} {review.exchangeDirection.toCurrency}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-dark-600 dark:text-dark-300 text-sm flex-grow">
                    {review.comment}
                  </p>
                  {review.isVerified && (
                    <div className="mt-3 pt-3 border-t border-dark-200 dark:border-dark-700">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ Проверенный обмен
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-dark-100 dark:bg-dark-800 rounded-full">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{avgRating}</span>
                <span className="text-dark-600 dark:text-dark-400">
                  из 5 на основе {allReviews.length} {allReviews.length === 1 ? 'отзыва' : allReviews.length < 5 ? 'отзывов' : 'отзывов'}
                </span>
              </div>
              
              {allReviews.length > 6 && (
                <Link to="/reviews">
                  <button className="text-primary-500 hover:text-primary-600 font-medium text-sm transition">
                    Посмотреть все отзывы →
                  </button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
