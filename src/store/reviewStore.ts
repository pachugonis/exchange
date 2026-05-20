import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Review, CreateReviewData } from '../types/review';
import { generateId } from '../utils/generators';
import { useOrderStore } from './orderStore';

interface ReviewState {
  reviews: Review[];
  
  // Actions
  createReview: (data: CreateReviewData, userEmail: string, userId?: string) => Promise<{ success: boolean; error?: string }>;
  getOrderReview: (orderId: string) => Review | undefined;
  getPublishedReviews: () => Review[];
  getAllReviews: () => Review[];
  updateReviewStatus: (reviewId: string, isPublished: boolean) => void;
  addAdminResponse: (reviewId: string, response: string, adminName: string) => void;
  deleteReview: (reviewId: string) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      
      createReview: async (data, userEmail, userId) => {
        // Validate rating
        if (data.rating < 1 || data.rating > 5) {
          return { success: false, error: 'Рейтинг должен быть от 1 до 5' };
        }

        // Validate comment
        if (!data.comment || data.comment.trim().length < 10) {
          return { success: false, error: 'Комментарий должен содержать минимум 10 символов' };
        }

        if (data.comment.trim().length > 200) {
          return { success: false, error: 'Комментарий не должен превышать 200 символов' };
        }

        // Check if review already exists for this order
        const existingReview = get().reviews.find(r => r.orderId === data.orderId);
        if (existingReview) {
          return { success: false, error: 'Вы уже оставили отзыв для этого обмена' };
        }

        // Get order details to include exchange direction
        const order = useOrderStore.getState().getOrderById(data.orderId);

        // Authorization: only the user who made this order can leave a review.
        // Why: prevents an authenticated user from posting a review for someone else's order
        // by bypassing the UI and calling createReview directly with an arbitrary orderId.
        if (!order) {
          return { success: false, error: 'Заказ не найден' };
        }

        if (order.status !== 'completed') {
          return { success: false, error: 'Отзыв можно оставить только для завершённого обмена' };
        }

        const isOwner =
          (!!userId && !!order.userId && order.userId === userId) ||
          (!!userEmail && !!order.contactInfo?.email && order.contactInfo.email === userEmail);

        if (!isOwner) {
          return { success: false, error: 'Оставить отзыв может только пользователь, совершивший этот обмен' };
        }
        
        const newReview: Review = {
          id: generateId('REVIEW'),
          orderId: data.orderId,
          userId,
          userName: data.userName,
          userEmail,
          rating: data.rating,
          comment: data.comment.trim(),
          createdAt: Date.now(),
          isPublished: true, // Auto-publish (can be changed to require approval)
          isVerified: true, // Verified because it's from completed order
          exchangeDirection: order ? {
            fromAmount: order.fromAmount,
            fromCurrency: order.fromCurrency.code,
            fromCurrencyName: order.fromCurrency.name || order.fromCurrency.code,
            toAmount: order.toAmount,
            toCurrency: order.toCurrency.code,
            toCurrencyName: order.toCurrency.name || order.toCurrency.code,
          } : undefined,
        };
        
        set((state) => ({
          reviews: [...state.reviews, newReview],
        }));
        
        return { success: true };
      },
      
      getOrderReview: (orderId) => {
        return get().reviews.find(r => r.orderId === orderId);
      },
      
      getPublishedReviews: () => {
        return get().reviews
          .filter(r => r.isPublished)
          .sort((a, b) => b.createdAt - a.createdAt);
      },
      
      getAllReviews: () => {
        return get().reviews.sort((a, b) => b.createdAt - a.createdAt);
      },
      
      updateReviewStatus: (reviewId, isPublished) => {
        set((state) => ({
          reviews: state.reviews.map(r =>
            r.id === reviewId ? { ...r, isPublished } : r
          ),
        }));
      },
      
      addAdminResponse: (reviewId, responseText, adminName) => {
        set((state) => ({
          reviews: state.reviews.map(r =>
            r.id === reviewId
              ? {
                  ...r,
                  response: {
                    text: responseText,
                    createdAt: Date.now(),
                    author: adminName,
                  },
                }
              : r
          ),
        }));
      },
      
      deleteReview: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.filter(r => r.id !== reviewId),
        }));
      },
    }),
    {
      name: 'reviews-storage',
    }
  )
);
