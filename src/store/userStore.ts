import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthCredentials, RegisterData } from '../types/user';
import { generateId } from '../utils/generators';
import { generateSecret, verifyTOTP } from '../utils/twoFactor';
import { sendEmailVerification, sendPasswordResetEmail, verifyToken, deleteToken } from '../api/emailAPI';

interface UserState {
  user: User | null;
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
  enable2FA: () => { secret: string };
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  disable2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
}

// Mock user database (in real app, this would be backend)
const USERS_STORAGE_KEY = 'mock-users-db';

const loadMockUsers = (): Map<string, { password: string; user: User }> => {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading mock users:', error);
  }
  return new Map();
};

const saveMockUsers = (users: Map<string, { password: string; user: User }>) => {
  try {
    const data = Object.fromEntries(users);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving mock users:', error);
  }
};

const mockUsers = loadMockUsers();

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      requires2FA: false,
      pendingUser: null,

      login: async (credentials, twoFactorCode) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const userRecord = mockUsers.get(credentials.email);
        
        if (!userRecord) {
          return { success: false, error: 'Пользователь не найден' };
        }

        if (userRecord.password !== credentials.password) {
          return { success: false, error: 'Неверный пароль' };
        }

        // Check if 2FA is enabled
        if (userRecord.user.twoFactorEnabled && userRecord.user.twoFactorSecret) {
          if (!twoFactorCode) {
            // Require 2FA code
            set({ pendingUser: userRecord.user, requires2FA: true });
            return { success: false, requires2FA: true };
          }

          // Verify 2FA code
          const isValid = await verifyTOTP(userRecord.user.twoFactorSecret, twoFactorCode);
          if (!isValid) {
            return { success: false, error: 'Неверный код 2FA' };
          }
        }

        set({
          user: userRecord.user,
          isAuthenticated: true,
          requires2FA: false,
          pendingUser: null,
        });

        return { success: true };
      },

      register: async (data) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Validation
        if (data.password !== data.confirmPassword) {
          return { success: false, error: 'Пароли не совпадают' };
        }

        if (data.password.length < 6) {
          return { success: false, error: 'Пароль должен содержать минимум 6 символов' };
        }

        if (!data.agreeToTerms) {
          return { success: false, error: 'Необходимо согласиться с условиями' };
        }

        // Check if email already exists
        if (mockUsers.has(data.email)) {
          return { success: false, error: 'Email уже зарегистрирован' };
        }

        // Create new user
        const newUser: User = {
          id: generateId('USER'),
          email: data.email,
          name: data.name,
          createdAt: Date.now(),
          emailVerified: false,
          kycStatus: 'none',
          kycLevel: 0,
        };

        // Save user (in real app, this would be backend)
        mockUsers.set(data.email, {
          password: data.password,
          user: newUser,
        });
        saveMockUsers(mockUsers);

        // Send verification email
        await sendEmailVerification(data.email, data.name);

        set({
          user: newUser,
          isAuthenticated: true,
        });

        return { success: true };
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          requires2FA: false,
          pendingUser: null,
        });
      },

      updateProfile: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        
        // Update in mock database
        const userRecord = mockUsers.get(currentUser.email);
        if (userRecord) {
          mockUsers.set(currentUser.email, {
            ...userRecord,
            user: updatedUser,
          });
          saveMockUsers(mockUsers);
        }

        set({ user: updatedUser });
      },

      verifyEmail: () => {
        const currentUser = get().user;
        if (!currentUser) return;

        get().updateProfile({ emailVerified: true });
      },

      verifyEmailWithToken: async (token) => {
        const result = verifyToken(token, 'email_verification');
        
        if (!result.valid) {
          return { success: false, error: result.error || 'Неверный токен' };
        }

        // Find user by email
        const userRecord = mockUsers.get(result.email!);
        if (!userRecord) {
          return { success: false, error: 'Пользователь не найден' };
        }

        // Update user
        userRecord.user.emailVerified = true;
        mockUsers.set(result.email!, userRecord);
        saveMockUsers(mockUsers);

        // Delete token
        deleteToken(token);

        // Update current user if logged in
        const currentUser = get().user;
        if (currentUser && currentUser.email === result.email) {
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

        const result = await sendEmailVerification(currentUser.email, currentUser.name);
        return result;
      },

      requestPasswordReset: async (email) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const userRecord = mockUsers.get(email);
        if (!userRecord) {
          // Don't reveal if email exists or not for security
          return { success: true };
        }

        // Send password reset email
        const result = await sendPasswordResetEmail(email, userRecord.user.name);
        return result;
      },

      resetPassword: async (token, newPassword) => {
        // Validate password
        if (newPassword.length < 6) {
          return { success: false, error: 'Пароль должен содержать минимум 6 символов' };
        }

        // Verify token
        const result = verifyToken(token, 'password_reset');
        if (!result.valid) {
          return { success: false, error: result.error || 'Неверный токен' };
        }

        // Find user by email
        const userRecord = mockUsers.get(result.email!);
        if (!userRecord) {
          return { success: false, error: 'Пользователь не найден' };
        }

        // Update password
        mockUsers.set(result.email!, {
          ...userRecord,
          password: newPassword,
        });
        saveMockUsers(mockUsers);

        // Delete token
        deleteToken(token);

        return { success: true };
      },

      enable2FA: () => {
        const secret = generateSecret();
        const currentUser = get().user;
        if (currentUser) {
          get().updateProfile({ twoFactorSecret: secret });
        }
        return { secret };
      },

      verify2FA: async (code) => {
        const currentUser = get().user;
        if (!currentUser || !currentUser.twoFactorSecret) {
          return { success: false, error: '2FA не настроен' };
        }

        const isValid = await verifyTOTP(currentUser.twoFactorSecret, code);
        if (!isValid) {
          return { success: false, error: 'Неверный код' };
        }

        get().updateProfile({ twoFactorEnabled: true });
        return { success: true };
      },

      disable2FA: async (code) => {
        const currentUser = get().user;
        if (!currentUser || !currentUser.twoFactorSecret) {
          return { success: false, error: '2FA не включен' };
        }

        const isValid = await verifyTOTP(currentUser.twoFactorSecret, code);
        if (!isValid) {
          return { success: false, error: 'Неверный код' };
        }

        get().updateProfile({ twoFactorEnabled: false, twoFactorSecret: undefined });
        return { success: true };
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
