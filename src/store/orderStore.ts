import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '../types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  cancelOrder: (id: string) => void;
  confirmPayment: (id: string, txHash: string, confirmed: boolean) => void;
  expireOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByUserId: (userId: string) => Order[];
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      
      addOrder: (order) => {
        set((state) => ({
          orders: [...state.orders, order],
          currentOrder: order,
        }));
      },
      
      updateOrderStatus: (id, status) => {
        set((state) => {
          const order = state.orders.find(o => o.id === id);
          
          // Update currency reserves when order is completed
          if (status === 'completed' && order) {
            try {
              const currenciesData = localStorage.getItem('currencies-data');
              if (currenciesData) {
                const currencies = JSON.parse(currenciesData);
                const updatedCurrencies = currencies.map((curr: any) => {
                  // Increase reserve for currency being received (fromCurrency)
                  if (curr.code === order.fromCurrency.code || curr.id === order.fromCurrency.id) {
                    const newReserve = (curr.reserve || 0) + order.fromAmount;
                    console.log(`Increasing reserve for ${curr.code}: ${curr.reserve} -> ${newReserve}`);
                    return {
                      ...curr,
                      reserve: newReserve,
                    };
                  }
                  // Decrease reserve for currency being sent out (toCurrency)
                  if (curr.code === order.toCurrency.code || curr.id === order.toCurrency.id) {
                    const newReserve = Math.max(0, (curr.reserve || 0) - order.toAmount);
                    console.log(`Decreasing reserve for ${curr.code}: ${curr.reserve} -> ${newReserve}`);
                    return {
                      ...curr,
                      reserve: newReserve,
                    };
                  }
                  return curr;
                });
                localStorage.setItem('currencies-data', JSON.stringify(updatedCurrencies));
                console.log('Reserves updated after order completion');
              }
            } catch (e) {
              console.error('Error updating currency reserves:', e);
            }
          }
          
          return {
            orders: state.orders.map((order) =>
              order.id === id
                ? {
                    ...order,
                    status,
                    updatedAt: Date.now(),
                    statusHistory: [
                      ...order.statusHistory,
                      { status, timestamp: Date.now() },
                    ],
                  }
                : order
            ),
          };
        });
      },
      
      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id
              ? {
                  ...order,
                  ...updates,
                  updatedAt: Date.now(),
                }
              : order
          ),
        }));
      },
      
      cancelOrder: (id) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status: 'cancelled',
                  updatedAt: Date.now(),
                  statusHistory: [
                    ...order.statusHistory,
                    { status: 'cancelled', timestamp: Date.now(), message: 'Заявка отменена пользователем' },
                  ],
                }
              : order
          ),
          currentOrder: state.currentOrder?.id === id ? null : state.currentOrder,
        }));
      },
      
      confirmPayment: (id, txHash, confirmed) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== id) return order;
            // Не трогаем заявки, которые уже ушли дальше по статусу
            if (
              order.status !== 'waiting_payment' &&
              order.status !== 'payment_pending'
            ) {
              return order;
            }
            const status: OrderStatus = confirmed
              ? 'payment_received'
              : 'payment_pending';
            // Не дублируем статус, если он уже выставлен
            if (order.status === status) {
              return { ...order, txHash };
            }
            return {
              ...order,
              status,
              txHash,
              paidAt: order.paidAt || Date.now(),
              updatedAt: Date.now(),
              statusHistory: [
                ...order.statusHistory,
                {
                  status,
                  timestamp: Date.now(),
                  message: confirmed
                    ? `Оплата получена и подтверждена (tx: ${txHash.slice(0, 12)}…)`
                    : `Транзакция обнаружена в сети, ожидается подтверждение (tx: ${txHash.slice(0, 12)}…)`,
                },
              ],
            };
          }),
        }));
      },

      expireOrder: (id) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id && order.status === 'waiting_payment'
              ? {
                  ...order,
                  status: 'cancelled',
                  updatedAt: Date.now(),
                  statusHistory: [
                    ...order.statusHistory,
                    {
                      status: 'cancelled',
                      timestamp: Date.now(),
                      message: 'Оплата не поступила в течение отведённого времени (30 минут)',
                    },
                  ],
                }
              : order
          ),
          currentOrder:
            state.currentOrder?.id === id &&
            state.currentOrder?.status === 'waiting_payment'
              ? { ...state.currentOrder, status: 'cancelled' }
              : state.currentOrder,
        }));
      },

      getOrderById: (id) => {
        return get().orders.find((order) => order.id === id);
      },
      
      getOrdersByUserId: (userId) => {
        return get().orders.filter((order) => order.userId === userId);
      },
    }),
    {
      name: 'orders-storage',
    }
  )
);
