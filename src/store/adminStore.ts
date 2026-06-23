import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminSettings, AdminStats } from '../types/admin';
import { authAPI } from '../api/authAPI';

interface AdminState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  settings: AdminSettings;
  stats: AdminStats;
  
  // Actions
  login: (username: string, password: string, twoFactorCode?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  setupTwoFactor: () => Promise<{ secret: string; otpauthUrl?: string; error?: string }>;
  enableTwoFactor: (code: string) => Promise<boolean>;
  disableTwoFactor: (code: string) => Promise<boolean>;
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
      token: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      settings: defaultSettings,
      stats: defaultStats,

      login: async (username: string, password: string, twoFactorCode?: string) => {
        // `username` carries the admin email; credentials are verified server-side.
        const res = await authAPI.adminLogin({ email: username, password, twoFactorCode });

        if (res.ok && res.data.token) {
          set({
            isAuthenticated: true,
            username,
            token: res.data.token,
            twoFactorEnabled: !!res.data.user?.twoFactorEnabled,
          });
          await get().loadStats();
          return true;
        }

        // Signal the login screen to prompt for a 2FA code.
        if (res.data.requires2FA) {
          set({ twoFactorEnabled: true });
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, username: null, token: null });
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const token = get().token;
        if (!token) return false;
        const res = await authAPI.changePassword({ currentPassword, newPassword }, token);
        return res.ok;
      },
      
      // Ask the server to generate and store a (not-yet-enabled) TOTP secret.
      setupTwoFactor: async () => {
        const token = get().token;
        if (!token) return { secret: '', error: 'Не авторизован' };
        const res = await authAPI.setup2FA(token);
        if (!res.ok) return { secret: '', error: res.data.error || 'Ошибка' };
        return { secret: res.data.secret, otpauthUrl: res.data.otpauthUrl };
      },

      // Confirm a code; the server verifies it against the stored secret and enables 2FA.
      enableTwoFactor: async (code: string) => {
        const token = get().token;
        if (!token) return false;
        const res = await authAPI.enable2FA(code, token);
        if (res.ok) set({ twoFactorEnabled: true });
        return res.ok;
      },

      disableTwoFactor: async (code: string) => {
        const token = get().token;
        if (!token) return false;
        const res = await authAPI.disable2FA(code, token);
        if (res.ok) set({ twoFactorEnabled: false, twoFactorSecret: null });
        return res.ok;
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
        token: state.token,
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
