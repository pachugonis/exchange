import type { Currency } from './currency';

export type OrderStatus = 
  | 'waiting_payment'
  | 'payment_pending' 
  | 'payment_received'
  | 'verification'
  | 'sending'
  | 'completed'
  | 'cancelled'
  | 'refund';

export interface ContactInfo {
  email: string;
  telegram?: string;
  promoCode?: string;
}

export interface PaymentDetails {
  fromWallet: string;
  toWallet: string;
  network?: string;
  cardHolder?: string;
}

export interface Order {
  id: string;
  userId?: string; // ID of the user who created the order
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  commission: number;
  status: OrderStatus;
  contactInfo: ContactInfo;
  paymentDetails: PaymentDetails;
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // Курс резервируется на 15 минут
  paymentDeadline: number; // Крайний срок поступления оплаты (создание + 30 минут)
  statusHistory: StatusChange[];
  paymentAddress?: string; // Адрес для оплаты
  txHash?: string; // Хэш входящей транзакции, обнаруженной в блокчейне
  paidAt?: number; // Момент обнаружения оплаты в блокчейне
  hasReview?: boolean; // Flag to track if user has left a review
  reviewId?: string; // Reference to the review if one exists
}

export interface StatusChange {
  status: OrderStatus;
  timestamp: number;
  message?: string;
}

export interface OrderFormData {
  contactInfo: ContactInfo;
  paymentDetails: PaymentDetails;
  agreedToTerms: boolean;
  agreedToAML: boolean;
}
