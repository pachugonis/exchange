import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthCredentials, RegisterData } from '../types/user';
import { authAPI, type AuthUser } from '../api/authAPI';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  requires2FA: boolean;
  pendingUser: User | null;
  login: (credentials: AuthCredentials, twoFactorCode?: string) => Promise<{ success: boolean; error?: string; requires2FA?: boolean }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  verifyEmail: () => void;
  verifyEmailWithToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  enable2FA: () => Promise<{ secret: string; otpauthUrl?: string; error?: string }>;
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  disable2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
}

// The server returns a frontend-safe user; map it onto the local `User` type.
function toUser(u: AuthUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    telegram: u.telegram,
    createdAt: u.createdAt,
    emailVerified: u.emailVerified,
    kycStatus: u.kycStatus,
    kycLevel: u.kycLevel,
    twoFactorEnabled: u.twoFactorEnabled,
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      requires2FA: false,
      pendingUser: null,

      login: async (credentials, twoFactorCode) => {
        const res = await authAPI.login({
          email: credentials.email,
          password: credentials.password,
          twoFactorCode,
        });

        if (res.ok && res.data.token) {
          set({
            user: toUser(res.data.user),
            token: res.data.token,
            isAuthenticated: true,
            requires2FA: false,
            pendingUser: null,
          });
          return { success: true };
        }

        if (res.data.requires2FA) {
          set({ requires2FA: true });
          return { success: false, requires2FA: true };
        }

        return { success: false, error: res.data.error || 'Ошибка входа' };
      },

      register: async (data) => {
        if (data.password !== data.confirmPassword) {
          return { success: false, error: 'Пароли не совпадают' };
        }
        if (!data.agreeToTerms) {
          return { success: false, error: 'Необходимо согласиться с условиями' };
        }

        const res = await authAPI.register({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        });

        if (res.ok && res.data.token) {
          set({
            user: toUser(res.data.user),
            token: res.data.token,
            isAuthenticated: true,
          });
          return { success: true };
        }

        return { success: false, error: res.data.error || 'Ошибка регистрации' };
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          requires2FA: false,
          pendingUser: null,
        });
      },

      updateProfile: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        // Optimistic local update keeps the UI responsive.
        set({ user: { ...currentUser, ...updates } });

        // Persist profile fields server-side (KYC/2FA flags are managed elsewhere).
        const token = get().token;
        const hasProfileField =
          'name' in updates || 'phone' in updates || 'telegram' in updates;
        if (token && hasProfileField) {
          authAPI
            .updateProfile(
              { name: updates.name, phone: updates.phone, telegram: updates.telegram },
              token,
            )
            .catch(() => {/* best-effort; local state already updated */});
        }
      },

      verifyEmail: () => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, emailVerified: true } });
      },

      verifyEmailWithToken: async (token) => {
        const res = await authAPI.verifyEmail(token);
        if (!res.ok) {
          return { success: false, error: res.data.error || 'Неверный токен' };
        }
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, emailVerified: true } });
        }
        return { success: true };
      },

      resendVerificationEmail: async () => {
        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, error: 'Пользователь не авторизован' };
        }
        if (currentUser.emailVerified) {
          return { success: false, error: 'Email уже подтвержден' };
        }
        // A dedicated resend endpoint can be added server-side; for now the
        // verification link is dispatched at registration.
        return { success: true };
      },

      requestPasswordReset: async (email) => {
        await authAPI.forgotPassword(email);
        // Always succeed to avoid revealing whether the account exists.
        return { success: true };
      },

      resetPassword: async (token, newPassword) => {
        const res = await authAPI.resetPassword({ token, newPassword });
        if (!res.ok) {
          return { success: false, error: res.data.error || 'Не удалось сбросить пароль' };
        }
        return { success: true };
      },

      enable2FA: async () => {
        const token = get().token;
        if (!token) return { secret: '', error: 'Не авторизован' };
        const res = await authAPI.setup2FA(token);
        if (!res.ok) return { secret: '', error: res.data.error || 'Ошибка' };
        return { secret: res.data.secret, otpauthUrl: res.data.otpauthUrl };
      },

      verify2FA: async (code) => {
        const token = get().token;
        if (!token) return { success: false, error: 'Не авторизован' };
        const res = await authAPI.enable2FA(code, token);
        if (!res.ok) {
          return { success: false, error: res.data.error || 'Неверный код' };
        }
        const currentUser = get().user;
        if (currentUser) set({ user: { ...currentUser, twoFactorEnabled: true } });
        return { success: true };
      },

      disable2FA: async (code) => {
        const token = get().token;
        if (!token) return { success: false, error: 'Не авторизован' };
        const res = await authAPI.disable2FA(code, token);
        if (!res.ok) {
          return { success: false, error: res.data.error || 'Неверный код' };
        }
        const currentUser = get().user;
        if (currentUser) set({ user: { ...currentUser, twoFactorEnabled: false } });
        return { success: true };
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
