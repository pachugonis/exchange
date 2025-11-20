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
