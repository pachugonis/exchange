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
  statusHistory: StatusChange[];
  paymentAddress?: string; // Адрес для оплаты
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
