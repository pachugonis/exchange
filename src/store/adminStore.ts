import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminSettings, AdminStats } from '../types/admin';

interface AdminState {
  isAuthenticated: boolean;
  username: string | null;
  password: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  settings: AdminSettings;
  stats: AdminStats;
  
  // Actions
  login: (username: string, password: string, twoFactorCode?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  enableTwoFactor: (secret: string) => void;
  disableTwoFactor: () => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
  updatePaymentAddress: (currencyCode: string, address: string) => void;
  updateCommission: (commission: number) => void;
  loadStats: () => Promise<void>;
}

const defaultSettings: AdminSettings = {
  commission: 0.02,
  minCommission: 0.005,
  maxCommission: 1.0,
  paymentAddresses: {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    USDT_TRC20: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    USDT_ERC20: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    CARD_RUB: '2200 7007 1234 5678',
  },
  autoConfirmThreshold: 100,
  maintenanceMode: false,
  supportEmail: 'support@exchangekit.io',
  supportTelegram: '@exchangekit_support',
  // SMTP Settings
  smtpEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  smtpFromEmail: 'noreply@exchangekit.io',
  smtpFromName: 'ExchangeKit',
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
      password: 'admin123', // Default password
      twoFactorEnabled: false,
      twoFactorSecret: null,
      settings: defaultSettings,
      stats: defaultStats,
      
      login: async (username: string, password: string, twoFactorCode?: string) => {
        const state = get();
        
        // Accept both 'admin' username and any email for compatibility
        // Compare password with stored password
        const isValidCredentials = password === state.password;
        
        if (isValidCredentials) {
          // If 2FA is enabled, verify the code
          if (state.twoFactorEnabled && state.twoFactorSecret) {
            if (!twoFactorCode) {
              return false; // 2FA code required
            }
            
            // Verify 2FA code
            const { verifyTOTP } = await import('../utils/twoFactor');
            const isValid = await verifyTOTP(state.twoFactorSecret, twoFactorCode);
            if (!isValid) {
              return false;
            }
          }
          
          set({ isAuthenticated: true, username });
          await get().loadStats();
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ isAuthenticated: false, username: null });
      },
      
      changePassword: async (currentPassword: string, newPassword: string) => {
        const state = get();
        if (currentPassword === state.password) {
          set({ password: newPassword });
          return true;
        }
        return false;
      },
      
      enableTwoFactor: (secret: string) => {
        set({ twoFactorEnabled: true, twoFactorSecret: secret });
      },
      
      disableTwoFactor: () => {
        set({ twoFactorEnabled: false, twoFactorSecret: null });
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
        password: state.password,
        twoFactorEnabled: state.twoFactorEnabled,
        twoFactorSecret: state.twoFactorSecret,
        settings: state.settings,
      }),
      merge: (persistedState: any, currentState) => {
        // Merge persisted settings with new defaults to ensure new fields are added
        const mergedSettings = {
          ...defaultSettings,
          ...(persistedState?.settings || {}),
          // Force update maxCommission if it's still the old value
          maxCommission: (persistedState?.settings?.maxCommission === 0.05) 
            ? 1.0 
            : (persistedState?.settings?.maxCommission || 1.0),
        };
        
        return {
          ...currentState,
          ...persistedState,
          settings: mergedSettings,
        };
      },
    }
  )
);
