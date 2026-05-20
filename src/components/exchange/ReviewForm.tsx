import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { useReviewStore } from '../../store/reviewStore';
import { useOrderStore } from '../../store/orderStore';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';
import type { Order } from '../../types/order';

interface ReviewFormProps {
  order: Order;
  onSubmitSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ order, onSubmitSuccess }) => {
  const { user } = useUserStore();
  const { createReview } = useReviewStore();
  const { updateOrder } = useOrderStore();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userName, setUserName] = useState(user?.name || '');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast.error('Введите ваше имя');
      return;
    }
    
    if (!comment.trim() || comment.trim().length < 10) {
      toast.error('Комментарий должен содержать минимум 10 символов');
      return;
    }
    
    if (comment.trim().length > 200) {
      toast.error('Комментарий не должен превышать 200 символов');
      return;
    }

    const isOwner =
      (!!user?.id && !!order.userId && order.userId === user.id) ||
      (!!user?.email && !!order.contactInfo?.email && order.contactInfo.email === user.email);

    if (!isOwner) {
      toast.error('Оставить отзыв может только пользователь, совершивший этот обмен');
      return;
    }

    setLoading(true);
    
    const result = await createReview(
      {
        orderId: order.id,
        userName: userName.trim(),
        rating,
        comment: comment.trim(),
      },
      order.contactInfo.email,
      user?.id
    );
    
    setLoading(false);
    
    if (result.success) {
      // Mark order as reviewed
      updateOrder(order.id, { hasReview: true });
      
      toast.success('Спасибо за ваш отзыв!');
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } else {
      toast.error(result.error || 'Ошибка отправки отзыва');
    }
  };

  return (
    <Card>
      <h3 className="text-xl font-semibold mb-4">Оставить отзыв</h3>
      
      <Alert variant="info" className="mb-4">
        Ваш отзыв поможет другим пользователям сделать правильный выбор. Спасибо!
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Оценка <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-dark-300 dark:text-dark-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-dark-500 mt-1">
            {rating === 5 && 'Отлично!'}
            {rating === 4 && 'Хорошо'}
            {rating === 3 && 'Нормально'}
            {rating === 2 && 'Плохо'}
            {rating === 1 && 'Очень плохо'}
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ваше имя <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Иван Иванов"
            required
            disabled={!!user?.name}
          />
          {user?.name && (
            <p className="text-xs text-dark-500 mt-1">Имя взято из вашего профиля</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Комментарий <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Расскажите о вашем опыте обмена..."
            className="w-full h-32 px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            required
            minLength={10}
            maxLength={200}
          />
          <p className="text-xs text-dark-500 mt-1">
            {comment.length}/200 символов (минимум 10)
          </p>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} className="w-full gap-2">
          <Send className="w-4 h-4" />
          {loading ? 'Отправка...' : 'Отправить отзыв'}
        </Button>
      </form>
    </Card>
  );
};
