import type { Order, OrderStatus, Currency } from '../types';
import { currencies } from '../data/currencies';
import { getExchangeRate, generateMockRates } from '../data/mockRates';
import { generateOrderId, generateCryptoAddress } from '../utils/generators';
import { delay } from '../utils/helpers';
import { API_DELAY_MIN, API_DELAY_MAX, API_ERROR_PROBABILITY, RATE_RESERVE_TIME, DEFAULT_COMMISSION } from '../utils/constants';

// Simulate network delay
async function simulateDelay() {
  const delayTime = Math.random() * (API_DELAY_MAX - API_DELAY_MIN) + API_DELAY_MIN;
  await delay(delayTime);
  
  // Simulate random errors
  if (Math.random() < API_ERROR_PROBABILITY) {
    throw new Error('Network error occurred');
  }
}

// GET /api/currencies
export async function fetchCurrencies(): Promise<Currency[]> {
  await simulateDelay();
  return currencies.filter(c => c.isActive);
}

// GET /api/rates
export async function fetchRates() {
  await simulateDelay();
  return generateMockRates();
}

// POST /api/calculate
export async function calculateExchange(data: {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}) {
  await simulateDelay();
  
  const rate = getExchangeRate(data.fromCurrency, data.toCurrency);
  const baseAmount = data.amount * rate;
  const commissionAmount = baseAmount * DEFAULT_COMMISSION;
  const total = baseAmount - commissionAmount;
  
  return {
    fromAmount: data.amount,
    toAmount: total,
    rate,
    commission: DEFAULT_COMMISSION,
    commissionAmount,
    total,
  };
}

// POST /api/orders
export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  await simulateDelay();
  
  const now = Date.now();
  const orderId = generateOrderId();
  
  const order: Order = {
    id: orderId,
    fromCurrency: orderData.fromCurrency!,
    toCurrency: orderData.toCurrency!,
    fromAmount: orderData.fromAmount!,
    toAmount: orderData.toAmount!,
    rate: orderData.rate!,
    commission: orderData.commission || DEFAULT_COMMISSION,
    status: 'waiting_payment',
    contactInfo: orderData.contactInfo!,
    paymentDetails: orderData.paymentDetails!,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + RATE_RESERVE_TIME,
    statusHistory: [
      {
        status: 'waiting_payment',
        timestamp: now,
        message: 'Заявка создана, ожидается оплата',
      },
    ],
    paymentAddress: generateCryptoAddress(orderData.fromCurrency!.code),
  };
  
  return order;
}

// GET /api/orders/:id
export async function fetchOrder(orderId: string): Promise<Order | null> {
  await simulateDelay();
  
  // In real app, fetch from backend
  const storedOrders = localStorage.getItem('orders-storage');
  if (storedOrders) {
    const { state } = JSON.parse(storedOrders);
    const order = state.orders.find((o: Order) => o.id === orderId);
    return order || null;
  }
  
  return null;
}

// PATCH /api/orders/:id/status
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
  await simulateDelay();
  
  const order = await fetchOrder(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  const now = Date.now();
  order.status = newStatus;
  order.updatedAt = now;
  order.statusHistory.push({
    status: newStatus,
    timestamp: now,
    message: getStatusMessage(newStatus),
  });
  
  return order;
}

function getStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    waiting_payment: 'Ожидание оплаты',
    payment_pending: 'Проверка оплаты',
    payment_received: 'Оплата получена',
    verification: 'Проверка транзакции',
    sending: 'Отправка средств',
    completed: 'Обмен завершен',
    cancelled: 'Заявка отменена',
    refund: 'Возврат средств',
  };
  
  return messages[status] || status;
}

// Simulate status progression
export async function simulateOrderProgress(orderId: string): Promise<void> {
  const statuses: OrderStatus[] = [
    'payment_pending',
    'payment_received',
    'verification',
    'sending',
    'completed',
  ];
  
  for (const status of statuses) {
    await delay(Math.random() * 30000 + 30000); // 30-60 seconds between status changes
    await updateOrderStatus(orderId, status);
  }
}
