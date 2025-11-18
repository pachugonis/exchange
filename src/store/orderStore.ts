import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus } from '../types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrderById: (id: string) => Order | undefined;
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
        set((state) => ({
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
        }));
      },
      
      getOrderById: (id) => {
        return get().orders.find((order) => order.id === id);
      },
    }),
    {
      name: 'orders-storage',
    }
  )
);
