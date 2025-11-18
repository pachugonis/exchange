import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthCredentials, RegisterData } from '../types/user';
import { generateId } from '../utils/generators';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  verifyEmail: () => void;
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

      login: async (credentials) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const userRecord = mockUsers.get(credentials.email);
        
        if (!userRecord) {
          return { success: false, error: 'Пользователь не найден' };
        }

        if (userRecord.password !== credentials.password) {
          return { success: false, error: 'Неверный пароль' };
        }

        set({
          user: userRecord.user,
          isAuthenticated: true,
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
