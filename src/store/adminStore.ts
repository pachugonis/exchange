import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminSettings, AdminStats } from '../types/admin';

interface AdminState {
  isAuthenticated: boolean;
  username: string | null;
  settings: AdminSettings;
  stats: AdminStats;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
  updatePaymentAddress: (currencyCode: string, address: string) => void;
  updateCommission: (commission: number) => void;
  loadStats: () => Promise<void>;
}

const defaultSettings: AdminSettings = {
  commission: 0.02,
  minCommission: 0.005,
  maxCommission: 0.05,
  paymentAddresses: {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    USDT_TRC20: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    USDT_ERC20: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  },
  autoConfirmThreshold: 100,
  maintenanceMode: false,
  supportEmail: 'support@4ex.com',
  supportTelegram: '@support4ex',
};

const defaultStats: AdminStats = {
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  totalVolume: 0,
  todayVolume: 0,
  activeUsers: 0,
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      username: null,
      settings: defaultSettings,
      stats: defaultStats,
      
      login: async (username: string, password: string) => {
        // Simple demo authentication (in production, use proper backend auth)
        if (username === 'admin' && password === 'admin123') {
          set({ isAuthenticated: true, username });
          await get().loadStats();
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ isAuthenticated: false, username: null });
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      updatePaymentAddress: (currencyCode, address) => {
        set((state) => ({
          settings: {
            ...state.settings,
            paymentAddresses: {
              ...state.settings.paymentAddresses,
              [currencyCode]: address,
            },
          },
        }));
      },
      
      updateCommission: (commission) => {
        const { minCommission, maxCommission } = get().settings;
        const validCommission = Math.max(minCommission, Math.min(maxCommission, commission));
        set((state) => ({
          settings: { ...state.settings, commission: validCommission },
        }));
      },
      
      loadStats: async () => {
        // Load stats from localStorage orders
        try {
          const ordersStorage = localStorage.getItem('orders-storage');
          if (ordersStorage) {
            const { state } = JSON.parse(ordersStorage);
            const orders = state.orders || [];
            
            const now = Date.now();
            const todayStart = new Date().setHours(0, 0, 0, 0);
            
            const stats: AdminStats = {
              totalOrders: orders.length,
              completedOrders: orders.filter((o: any) => o.status === 'completed').length,
              pendingOrders: orders.filter((o: any) => 
                ['waiting_payment', 'payment_pending', 'payment_received', 'verification', 'sending'].includes(o.status)
              ).length,
              totalVolume: orders.reduce((sum: number, o: any) => sum + (o.toAmount || 0), 0),
              todayVolume: orders
                .filter((o: any) => o.createdAt >= todayStart)
                .reduce((sum: number, o: any) => sum + (o.toAmount || 0), 0),
              activeUsers: new Set(orders.map((o: any) => o.contactInfo?.email)).size,
            };
            
            set({ stats });
          }
        } catch (error) {
          console.error('Error loading admin stats:', error);
        }
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        username: state.username,
        settings: state.settings,
      }),
    }
  )
);
