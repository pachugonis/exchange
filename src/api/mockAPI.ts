import type { Order, OrderStatus, Currency } from '../types';
import { currencies } from '../data/currencies';
import { getExchangeRate, generateMockRates } from '../data/mockRates';
import { generateOrderId, generateCryptoAddress, randomInRange } from '../utils/generators';
import { delay } from '../utils/helpers';
import { 
  API_DELAY_MIN, 
  API_DELAY_MAX, 
  API_ERROR_PROBABILITY, 
  RATE_RESERVE_TIME,
  PAYMENT_WINDOW,
  DEFAULT_COMMISSION,
  STATUS_PROGRESSION_DELAYS
} from '../utils/constants';

// Store for simulating ongoing order progressions
const progressingOrders = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Simulate network delay with random duration
 * Also simulates occasional network errors
 */
async function simulateDelay() {
  const delayTime = randomInRange(API_DELAY_MIN, API_DELAY_MAX);
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
    paymentDeadline: now + PAYMENT_WINDOW,
    statusHistory: [
      {
        status: 'waiting_payment',
        timestamp: now,
        message: 'Заявка создана, ожидается оплата',
      },
    ],
    paymentAddress:
      orderData.fromCurrency!.paymentAddress ||
      generateCryptoAddress(orderData.fromCurrency!.code),
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

/**
 * PATCH /api/orders/:id/status
 * Update order status with validation and history tracking
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
  await simulateDelay();
  
  const order = await fetchOrder(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Validate status transition
  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
  }
  
  const now = Date.now();
  order.status = newStatus;
  order.updatedAt = now;
  order.statusHistory.push({
    status: newStatus,
    timestamp: now,
    message: getStatusMessage(newStatus),
  });
  
  // Save to localStorage
  saveOrderToStorage(order);
  
  return order;
}

/**
 * Get human-readable status message
 */
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

/**
 * Validate if status transition is allowed
 */
function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    waiting_payment: ['payment_pending', 'cancelled'],
    payment_pending: ['payment_received', 'cancelled', 'waiting_payment'],
    payment_received: ['verification', 'refund'],
    verification: ['sending', 'refund'],
    sending: ['completed', 'refund'],
    completed: [],
    cancelled: ['refund'],
    refund: [],
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Save order to localStorage
 */
function saveOrderToStorage(order: Order): void {
  const storedOrders = localStorage.getItem('orders-storage');
  if (storedOrders) {
    const storage = JSON.parse(storedOrders);
    const orderIndex = storage.state.orders.findIndex((o: Order) => o.id === order.id);
    if (orderIndex !== -1) {
      storage.state.orders[orderIndex] = order;
      localStorage.setItem('orders-storage', JSON.stringify(storage));
    }
  }
}

/**
 * Simulate automatic order status progression
 * Mimics real backend processing with realistic delays
 */
export async function simulateOrderProgress(orderId: string): Promise<void> {
  // Cancel any existing progression for this order
  stopOrderProgress(orderId);
  
  const statuses: OrderStatus[] = [
    'payment_pending',
    'payment_received',
    'verification',
    'sending',
    'completed',
  ];
  
  for (const status of statuses) {
    const config = STATUS_PROGRESSION_DELAYS[status as keyof typeof STATUS_PROGRESSION_DELAYS];
    const delayTime = randomInRange(config.min, config.max);
    
    await delay(delayTime);
    
    // Check if progression was cancelled
    if (!progressingOrders.has(orderId)) {
      console.log(`Order ${orderId} progression cancelled`);
      return;
    }
    
    try {
      await updateOrderStatus(orderId, status);
      console.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      console.error(`Failed to update order ${orderId} to status ${status}:`, error);
      // Continue to next status despite error
    }
  }
  
  // Clean up
  progressingOrders.delete(orderId);
}

/**
 * Start automatic order progression simulation
 */
export function startOrderProgress(orderId: string): void {
  if (progressingOrders.has(orderId)) {
    console.warn(`Order ${orderId} progression already in progress`);
    return;
  }
  
  // Mark as progressing
  const timeout = setTimeout(() => {
    simulateOrderProgress(orderId).catch(err => {
      console.error(`Order ${orderId} progression failed:`, err);
      progressingOrders.delete(orderId);
    });
  }, 0);
  
  progressingOrders.set(orderId, timeout);
}

/**
 * Stop automatic order progression
 */
export function stopOrderProgress(orderId: string): void {
  const timeout = progressingOrders.get(orderId);
  if (timeout) {
    clearTimeout(timeout);
    progressingOrders.delete(orderId);
    console.log(`Order ${orderId} progression stopped`);
  }
}

/**
 * Check if order is currently progressing
 */
export function isOrderProgressing(orderId: string): boolean {
  return progressingOrders.has(orderId);
}
