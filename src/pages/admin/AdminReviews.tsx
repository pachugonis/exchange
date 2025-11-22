import React, { useState } from 'react';
import { Star, Eye, EyeOff, Trash2, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useReviewStore } from '../../store/reviewStore';
import { useAdminStore } from '../../store/adminStore';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminReviews: React.FC = () => {
  const { getAllReviews, updateReviewStatus, addAdminResponse, deleteReview } = useReviewStore();
  const { username } = useAdminStore();
  const reviews = getAllReviews();
  
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [showResponseForm, setShowResponseForm] = useState<{ [key: string]: boolean }>({});

  const handleTogglePublish = (reviewId: string, currentStatus: boolean) => {
    updateReviewStatus(reviewId, !currentStatus);
    toast.success(currentStatus ? 'Отзыв скрыт' : 'Отзыв опубликован');
  };

  const handleDelete = (reviewId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      deleteReview(reviewId);
      toast.success('Отзыв удален');
    }
  };

  const handleAddResponse = (reviewId: string) => {
    const text = responseText[reviewId]?.trim();
    if (!text) {
      toast.error('Введите текст ответа');
      return;
    }

    addAdminResponse(reviewId, text, username || 'Admin');
    setResponseText({ ...responseText, [reviewId]: '' });
    setShowResponseForm({ ...showResponseForm, [reviewId]: false });
    toast.success('Ответ добавлен');
  };

  const stats = {
    total: reviews.length,
    published: reviews.filter(r => r.isPublished).length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление отзывами</h1>
        <p className="text-dark-600 dark:text-dark-400">
          Просмотр, модерация и ответы на отзывы клиентов
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">{stats.total}</div>
            <div className="text-sm text-dark-500">Всего отзывов</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{stats.published}</div>
            <div className="text-sm text-dark-500">Опубликовано</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">{stats.avgRating}</div>
            <div className="text-sm text-dark-500">Средняя оценка</div>
          </div>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Alert variant="info">
          Пока нет отзывов
        </Alert>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{review.userName}</h3>
                    {review.isVerified && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        ✓ Проверенный обмен
                      </span>
                    )}
                    {!review.isPublished && (
                      <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                        Скрыт
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-500">
                    <span>{review.userEmail}</span>
                    <span>•</span>
                    <span>{formatDate(review.createdAt)}</span>
                    <span>•</span>
                    <span>ID заявки: {review.orderId}</span>
                  </div>
                </div>
                <div className="flex gap-1 text-yellow-400 text-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= review.rating ? 'fill-yellow-400' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <p className="text-dark-600 dark:text-dark-300 mb-4">{review.comment}</p>
              
              {/* Exchange Direction */}
              {review.exchangeDirection && (
                <div className="mb-4 pb-4 border-b border-dark-200 dark:border-dark-700">
                  <p className="text-xs text-dark-500 mb-2">Направление обмена:</p>
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

              {/* Existing Admin Response */}
              {review.response && (
                <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-l-4 border-primary-500">
                  <p className="text-sm font-medium mb-1">Ваш ответ:</p>
                  <p className="text-sm text-dark-600 dark:text-dark-400">{review.response.text}</p>
                  <p className="text-xs text-dark-500 mt-1">
                    {review.response.author} • {formatDate(review.response.createdAt)}
                  </p>
                </div>
              )}

              {/* Response Form */}
              {!review.response && showResponseForm[review.id] && (
                <div className="mb-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <label className="block text-sm font-medium mb-2">Ответ на отзыв</label>
                  <textarea
                    value={responseText[review.id] || ''}
                    onChange={(e) => setResponseText({ ...responseText, [review.id]: e.target.value })}
                    placeholder="Введите ваш ответ..."
                    className="w-full h-24 px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddResponse(review.id)}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Отправить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResponseForm({ ...showResponseForm, [review.id]: false })}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-dark-200 dark:border-dark-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTogglePublish(review.id, review.isPublished)}
                  className="gap-2"
                >
                  {review.isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Скрыть
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Опубликовать
                    </>
                  )}
                </Button>

                {!review.response && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResponseForm({ ...showResponseForm, [review.id]: true })}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ответить
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(review.id)}
                  className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
