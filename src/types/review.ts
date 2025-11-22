export interface Review {
  id: string;
  orderId: string;
  userId?: string; // Optional if user was authenticated
  userName: string;
  userEmail: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: number;
  isPublished: boolean; // Admin can approve/hide reviews
  isVerified: boolean; // Verified as completed exchange
  // Exchange direction info
  exchangeDirection?: {
    fromAmount: number;
    fromCurrency: string;
    fromCurrencyName?: string; // Optional for backward compatibility
    toAmount: number;
    toCurrency: string;
    toCurrencyName?: string; // Optional for backward compatibility
  };
  response?: {
    text: string;
    createdAt: number;
    author: string; // Admin name
  };
}

export interface CreateReviewData {
  orderId: string;
  userName: string;
  rating: number;
  comment: string;
}
