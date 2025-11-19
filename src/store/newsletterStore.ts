import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NewsletterSubscriber, NewsletterCampaign } from '../types/email';
import { generateId } from '../utils/generators';
import { sendEmail } from '../api/emailAPI';

interface NewsletterState {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  
  // Subscriber actions
  addSubscriber: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  removeSubscriber: (id: string) => void;
  toggleSubscriberStatus: (id: string) => void;
  
  // Campaign actions
  createCampaign: (campaign: Omit<NewsletterCampaign, 'id' | 'status' | 'recipientsCount'>) => string;
  updateCampaign: (id: string, updates: Partial<NewsletterCampaign>) => void;
  deleteCampaign: (id: string) => void;
  sendCampaign: (id: string) => Promise<{ success: boolean; error?: string; sent: number }>;
}

export const useNewsletterStore = create<NewsletterState>()(
  persist(
    (set, get) => ({
      subscribers: [],
      campaigns: [],
      
      addSubscriber: async (email, name) => {
        const { subscribers } = get();
        
        // Check if already subscribed
        const existing = subscribers.find(s => s.email === email);
        if (existing) {
          if (existing.isActive) {
            return { success: false, error: 'Вы уже подписаны на рассылку' };
          } else {
            // Reactivate subscription
            set({
              subscribers: subscribers.map(s =>
                s.email === email ? { ...s, isActive: true } : s
              ),
            });
            return { success: true };
          }
        }
        
        // Add new subscriber
        const newSubscriber: NewsletterSubscriber = {
          id: generateId('SUB'),
          email,
          name,
          subscribedAt: Date.now(),
          isActive: true,
        };
        
        set({ subscribers: [...subscribers, newSubscriber] });
        return { success: true };
      },
      
      removeSubscriber: (id) => {
        set((state) => ({
          subscribers: state.subscribers.filter((s) => s.id !== id),
        }));
      },
      
      toggleSubscriberStatus: (id) => {
        set((state) => ({
          subscribers: state.subscribers.map((s) =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
          ),
        }));
      },
      
      createCampaign: (campaign) => {
        const newCampaign: NewsletterCampaign = {
          ...campaign,
          id: generateId('CAMPAIGN'),
          status: 'draft',
          recipientsCount: 0,
        };
        
        set((state) => ({
          campaigns: [...state.campaigns, newCampaign],
        }));
        
        return newCampaign.id;
      },
      
      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      
      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },
      
      sendCampaign: async (id) => {
        const { campaigns, subscribers } = get();
        const campaign = campaigns.find((c) => c.id === id);
        
        if (!campaign) {
          return { success: false, error: 'Кампания не найдена', sent: 0 };
        }
        
        // Get active subscribers
        const activeSubscribers = subscribers.filter((s) => s.isActive);
        
        if (activeSubscribers.length === 0) {
          return { success: false, error: 'Нет активных подписчиков', sent: 0 };
        }
        
        // Send emails to all subscribers
        let sent = 0;
        for (const subscriber of activeSubscribers) {
          try {
            await sendEmail({
              to: subscriber.email,
              subject: campaign.subject,
              body: campaign.body,
              html: campaign.html,
              type: 'newsletter',
            });
            sent++;
          } catch (error) {
            console.error(`Failed to send to ${subscriber.email}:`, error);
          }
        }
        
        // Update campaign status
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'sent',
                  sentAt: Date.now(),
                  recipientsCount: sent,
                }
              : c
          ),
        }));
        
        return { success: true, sent };
      },
    }),
    {
      name: 'newsletter-storage',
    }
  )
);
