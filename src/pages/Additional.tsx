import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useReviewStore } from '../store/reviewStore';
import { formatDate } from '../utils/formatters';

export const Rules: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Правила обмена</h1>
        
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4">Общие положения</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>Используя сервис 4EX, вы соглашаетесь с настоящими правилами обмена.</p>
              <p>Сервис предоставляет услуги обмена электронных валют в автоматическом и полуавтоматическом режиме.</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">Процесс обмена</h2>
            <div className="prose dark:prose-invert max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>Выберите направление обмена и укажите сумму</li>
                <li>Заполните контактные данные и реквизиты</li>
                <li>Подтвердите заявку и переведите средства</li>
                <li>Дождитесь подтверждения оплаты</li>
                <li>Получите обменянные средства</li>
              </ol>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">Сроки выполнения</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>Обработка заявок осуществляется в течение 5-30 минут после подтверждения оплаты.</p>
              <p>В редких случаях обработка может занять до 3 часов.</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">AML/KYC политика</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>Мы соблюдаем международные стандарты по противодействию отмыванию денег (AML) и проверке клиентов (KYC).</p>
              <p>Для обменов на крупные суммы может потребоваться дополнительная верификация.</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">Комиссии и лимиты</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>Комиссия сервиса составляет 1-3% в зависимости от направления обмена.</p>
              <p>Минимальные и максимальные суммы обмена указаны для каждого направления отдельно.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Reviews: React.FC = () => {
  const { getPublishedReviews } = useReviewStore();
  const reviews = getPublishedReviews();
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 20;

  // Scroll to top on component mount and page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add pages around current
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Отзывы</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Отзывы наших клиентов о работе сервиса
          </p>
          {reviews.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="text-2xl font-bold">{avgRating}</div>
              <div className="flex gap-1 text-yellow-400 text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {star <= Math.round(parseFloat(avgRating)) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <div className="text-dark-500">
                {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
              </div>
            </div>
          )}
        </div>
        
        {reviews.length === 0 ? (
          <Alert variant="info">
            Пока нет отзывов. Станьте первым, кто оставит отзыв о нашем сервисе!
          </Alert>
        ) : (
          <>
            <div className="space-y-4">
              {currentReviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{review.userName}</h3>
                        {review.isVerified && (
                          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            ✓ Проверенный обмен
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-500">{formatDate(review.createdAt)}</p>
                    </div>
                    <div className="flex gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-xl">
                          {star <= review.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Exchange Direction */}
                  {review.exchangeDirection && (
                    <div className="mb-3 pb-3 border-b border-dark-200 dark:border-dark-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {review.exchangeDirection.fromAmount} {review.exchangeDirection.fromCurrency}
                          {review.exchangeDirection.fromCurrencyName && (
                            <span className="text-dark-500"> ({review.exchangeDirection.fromCurrencyName})</span>
                          )}
                        </span>
                        <ArrowRight className="w-4 h-4 text-dark-400" />
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {review.exchangeDirection.toAmount} {review.exchangeDirection.toCurrency}
                          {review.exchangeDirection.toCurrencyName && (
                            <span className="text-dark-500"> ({review.exchangeDirection.toCurrencyName})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-dark-600 dark:text-dark-300 mb-3">{review.comment}</p>
                  
                  {/* Admin Response */}
                  {review.response && (
                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-l-4 border-primary-500">
                      <p className="text-sm font-medium mb-1">Ответ администрации:</p>
                      <p className="text-sm text-dark-600 dark:text-dark-400">{review.response.text}</p>
                      <p className="text-xs text-dark-500 mt-1">
                        {review.response.author} • {formatDate(review.response.createdAt)}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>

                <div className="flex gap-1">
                  {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-2 text-dark-500">...</span>
                      ) : (
                        <Button
                          variant={currentPage === page ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <div className="mt-4 text-center text-sm text-dark-500">
                Страница {currentPage} из {totalPages} • Показано {indexOfFirstReview + 1}-{Math.min(indexOfLastReview, reviews.length)} из {reviews.length} отзывов
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Контакты</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold mb-4">Служба поддержки</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-dark-500 mb-1">Email</p>
                <p className="font-medium">support@4ex.cash</p>
              </div>
              <div>
                <p className="text-sm text-dark-500 mb-1">Telegram</p>
                <p className="font-medium">@4ex_support</p>
              </div>
              <div>
                <p className="text-sm text-dark-500 mb-1">Рабочие часы</p>
                <p className="font-medium">24/7 (круглосуточно)</p>
              </div>
              <div>
                <p className="text-sm text-dark-500 mb-1">Среднее время ответа</p>
                <p className="font-medium">2-5 минут</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold mb-4">Онлайн операторы</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">3 оператора онлайн</span>
            </div>
            <p className="text-dark-600 dark:text-dark-400">
              Наши операторы готовы помочь вам в любое время суток. Свяжитесь с нами удобным для вас способом.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
