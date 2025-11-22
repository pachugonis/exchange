import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  TelegramUser, 
  BotSession, 
  MessageQueue,
  NotificationPreferences,
  ConversationFlow,
  BotStatistics 
} from '../types/telegram';
import { generateId } from '../utils/generators';

interface TelegramState {
  // User associations
  telegramUsers: Map<string, TelegramUser>;
  
  // Active sessions
  sessions: Map<string, BotSession>;
  
  // Message queue
  messageQueue: MessageQueue[];
  
  // Statistics
  statistics: BotStatistics;
  
  // User Association Methods
  linkTelegramUser: (telegramId: string, userId: string, userData: Partial<TelegramUser>) => void;
  unlinkTelegramUser: (telegramId: string) => void;
  getTelegramUser: (telegramId: string) => TelegramUser | undefined;
  getUserByPlatformId: (userId: string) => TelegramUser | undefined;
  updateNotificationPreferences: (telegramId: string, preferences: Partial<NotificationPreferences>) => void;
  
  // Session Management
  createSession: (telegramId: string, chatId: string) => BotSession;
  getSession: (telegramId: string) => BotSession | undefined;
  updateSession: (sessionId: string, updates: Partial<BotSession>) => void;
  startFlow: (sessionId: string, flow: ConversationFlow, initialData?: Record<string, any>) => void;
  updateFlowContext: (sessionId: string, data: Record<string, any>) => void;
  endFlow: (sessionId: string) => void;
  clearSession: (sessionId: string) => void;
  cleanExpiredSessions: () => void;
  
  // Message Queue
  queueMessage: (message: Omit<MessageQueue, 'messageId' | 'status' | 'retryCount' | 'maxRetries'>) => void;
  getNextMessages: (limit?: number) => MessageQueue[];
  markMessageSent: (messageId: string) => void;
  markMessageFailed: (messageId: string, error: string) => void;
  retryMessage: (messageId: string) => void;
  clearSentMessages: () => void;
  
  // Statistics
  incrementMessagesSent: () => void;
  incrementMessagesReceived: () => void;
  incrementCommandsProcessed: () => void;
  incrementErrors: () => void;
  updateResponseTime: (time: number) => void;
  getStatistics: () => BotStatistics;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;

export const useTelegramStore = create<TelegramState>()(
  persist(
    (set, get) => ({
      telegramUsers: new Map(),
      sessions: new Map(),
      messageQueue: [],
      statistics: {
        totalUsers: 0,
        activeUsers: 0,
        totalSessions: 0,
        activeSessions: 0,
        messagesSent: 0,
        messagesReceived: 0,
        commandsProcessed: 0,
        errorsCount: 0,
        averageResponseTime: 0,
        lastUpdated: Date.now(),
      },

      // User Association Methods
      linkTelegramUser: (telegramId, userId, userData) => {
        const now = Date.now();
        const existingUser = get().telegramUsers.get(telegramId);
        
        const newUser: TelegramUser = {
          telegramId,
          userId,
          chatId: userData.chatId || '',
          username: userData.username,
          firstName: userData.firstName || '',
          lastName: userData.lastName,
          languageCode: userData.languageCode,
          linkedAt: existingUser?.linkedAt || now,
          isActive: true,
          notificationPreferences: existingUser?.notificationPreferences || {
            orderUpdates: true,
            accountAlerts: true,
            promotional: true,
            verbosity: 'normal',
          },
        };

        set((state) => {
          const newMap = new Map(state.telegramUsers);
          newMap.set(telegramId, newUser);
          return {
            telegramUsers: newMap,
            statistics: {
              ...state.statistics,
              totalUsers: newMap.size,
              lastUpdated: now,
            },
          };
        });
      },

      unlinkTelegramUser: (telegramId) => {
        set((state) => {
          const newMap = new Map(state.telegramUsers);
          newMap.delete(telegramId);
          return {
            telegramUsers: newMap,
            statistics: {
              ...state.statistics,
              totalUsers: newMap.size,
              lastUpdated: Date.now(),
            },
          };
        });
      },

      getTelegramUser: (telegramId) => {
        return get().telegramUsers.get(telegramId);
      },

      getUserByPlatformId: (userId) => {
        const users = Array.from(get().telegramUsers.values());
        return users.find(u => u.userId === userId);
      },

      updateNotificationPreferences: (telegramId, preferences) => {
        set((state) => {
          const user = state.telegramUsers.get(telegramId);
          if (!user) return state;

          const updatedUser: TelegramUser = {
            ...user,
            notificationPreferences: {
              ...user.notificationPreferences,
              ...preferences,
            },
          };

          const newMap = new Map(state.telegramUsers);
          newMap.set(telegramId, updatedUser);
          return { telegramUsers: newMap };
        });
      },

      // Session Management
      createSession: (telegramId, chatId) => {
        const now = Date.now();
        const sessionId = generateId('SESSION');
        const telegramUser = get().telegramUsers.get(telegramId);
        
        const session: BotSession = {
          sessionId,
          telegramId,
          flowStep: 0,
          contextData: {},
          createdAt: now,
          expiresAt: now + SESSION_TIMEOUT,
          lastActivity: now,
          isAuthenticated: !!telegramUser?.userId,
          userId: telegramUser?.userId,
        };

        set((state) => {
          const newMap = new Map(state.sessions);
          newMap.set(telegramId, session);
          return {
            sessions: newMap,
            statistics: {
              ...state.statistics,
              totalSessions: state.statistics.totalSessions + 1,
              activeSessions: newMap.size,
              lastUpdated: now,
            },
          };
        });

        return session;
      },

      getSession: (telegramId) => {
        const session = get().sessions.get(telegramId);
        if (!session) return undefined;

        // Check if session is expired
        if (session.expiresAt < Date.now()) {
          get().clearSession(session.sessionId);
          return undefined;
        }

        return session;
      },

      updateSession: (sessionId, updates) => {
        const now = Date.now();
        set((state) => {
          const session = Array.from(state.sessions.values()).find(s => s.sessionId === sessionId);
          if (!session) return state;

          const updatedSession: BotSession = {
            ...session,
            ...updates,
            lastActivity: now,
            expiresAt: now + SESSION_TIMEOUT,
          };

          const newMap = new Map(state.sessions);
          newMap.set(session.telegramId, updatedSession);
          return { sessions: newMap };
        });
      },

      startFlow: (sessionId, flow, initialData = {}) => {
        get().updateSession(sessionId, {
          currentFlow: flow,
          flowStep: 0,
          contextData: initialData,
        });
      },

      updateFlowContext: (sessionId, data) => {
        set((state) => {
          const session = Array.from(state.sessions.values()).find(s => s.sessionId === sessionId);
          if (!session) return state;

          const updatedSession: BotSession = {
            ...session,
            contextData: {
              ...session.contextData,
              ...data,
            },
            lastActivity: Date.now(),
          };

          const newMap = new Map(state.sessions);
          newMap.set(session.telegramId, updatedSession);
          return { sessions: newMap };
        });
      },

      endFlow: (sessionId) => {
        get().updateSession(sessionId, {
          currentFlow: undefined,
          flowStep: 0,
          contextData: {},
        });
      },

      clearSession: (sessionId) => {
        set((state) => {
          const session = Array.from(state.sessions.values()).find(s => s.sessionId === sessionId);
          if (!session) return state;

          const newMap = new Map(state.sessions);
          newMap.delete(session.telegramId);
          return {
            sessions: newMap,
            statistics: {
              ...state.statistics,
              activeSessions: newMap.size,
              lastUpdated: Date.now(),
            },
          };
        });
      },

      cleanExpiredSessions: () => {
        const now = Date.now();
        set((state) => {
          const newMap = new Map(state.sessions);
          let cleaned = 0;

          for (const [telegramId, session] of newMap.entries()) {
            if (session.expiresAt < now) {
              newMap.delete(telegramId);
              cleaned++;
            }
          }

          if (cleaned > 0) {
            return {
              sessions: newMap,
              statistics: {
                ...state.statistics,
                activeSessions: newMap.size,
                lastUpdated: now,
              },
            };
          }

          return state;
        });
      },

      // Message Queue
      queueMessage: (message) => {
        const messageId = generateId('MSG');
        const queuedMessage: MessageQueue = {
          ...message,
          messageId,
          status: 'pending',
          retryCount: 0,
          maxRetries: MAX_RETRIES,
        };

        set((state) => ({
          messageQueue: [...state.messageQueue, queuedMessage],
        }));
      },

      getNextMessages: (limit = 10) => {
        const queue = get().messageQueue
          .filter(m => m.status === 'pending' && m.scheduledAt <= Date.now())
          .sort((a, b) => {
            // Sort by priority first, then by scheduled time
            if (a.priority !== b.priority) {
              return a.priority - b.priority; // Lower number = higher priority
            }
            return a.scheduledAt - b.scheduledAt;
          })
          .slice(0, limit);

        return queue;
      },

      markMessageSent: (messageId) => {
        const now = Date.now();
        set((state) => ({
          messageQueue: state.messageQueue.map(m =>
            m.messageId === messageId
              ? { ...m, status: 'sent' as const, sentAt: now }
              : m
          ),
        }));
        get().incrementMessagesSent();
      },

      markMessageFailed: (messageId, error) => {
        set((state) => ({
          messageQueue: state.messageQueue.map(m =>
            m.messageId === messageId
              ? { ...m, status: 'failed' as const, error }
              : m
          ),
        }));
        get().incrementErrors();
      },

      retryMessage: (messageId) => {
        const now = Date.now();
        set((state) => ({
          messageQueue: state.messageQueue.map(m => {
            if (m.messageId !== messageId) return m;
            
            const newRetryCount = m.retryCount + 1;
            if (newRetryCount >= m.maxRetries) {
              return { ...m, status: 'failed' as const, error: 'Max retries exceeded' };
            }

            return {
              ...m,
              status: 'pending' as const,
              retryCount: newRetryCount,
              scheduledAt: now + (newRetryCount * 5000), // Exponential backoff
            };
          }),
        }));
      },

      clearSentMessages: () => {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Keep last 24 hours
        set((state) => ({
          messageQueue: state.messageQueue.filter(
            m => m.status !== 'sent' || (m.sentAt && m.sentAt > cutoff)
          ),
        }));
      },

      // Statistics
      incrementMessagesSent: () => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            messagesSent: state.statistics.messagesSent + 1,
            lastUpdated: Date.now(),
          },
        }));
      },

      incrementMessagesReceived: () => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            messagesReceived: state.statistics.messagesReceived + 1,
            lastUpdated: Date.now(),
          },
        }));
      },

      incrementCommandsProcessed: () => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            commandsProcessed: state.statistics.commandsProcessed + 1,
            lastUpdated: Date.now(),
          },
        }));
      },

      incrementErrors: () => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            errorsCount: state.statistics.errorsCount + 1,
            lastUpdated: Date.now(),
          },
        }));
      },

      updateResponseTime: (time) => {
        set((state) => {
          const count = state.statistics.commandsProcessed || 1;
          const currentAvg = state.statistics.averageResponseTime;
          const newAvg = ((currentAvg * (count - 1)) + time) / count;

          return {
            statistics: {
              ...state.statistics,
              averageResponseTime: newAvg,
              lastUpdated: Date.now(),
            },
          };
        });
      },

      getStatistics: () => {
        const state = get();
        return {
          ...state.statistics,
          activeUsers: Array.from(state.telegramUsers.values()).filter(u => u.isActive).length,
          activeSessions: state.sessions.size,
        };
      },
    }),
    {
      name: 'telegram-storage',
      partialize: (state) => ({
        telegramUsers: Array.from(state.telegramUsers.entries()),
        statistics: state.statistics,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.telegramUsers)) {
          state.telegramUsers = new Map(state.telegramUsers as any);
        }
      },
    }
  )
);
