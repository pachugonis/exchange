import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Announcement } from '../types/admin';
import { generateId } from '../utils/generators';

interface AnnouncementState {
  announcements: Announcement[];
  
  // Actions
  createAnnouncement: (message: string, publishDate: number, endDate?: number) => { success: boolean; error?: string };
  updateAnnouncement: (id: string, updates: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementStatus: (id: string) => void;
  getActiveAnnouncement: () => Announcement | null;
  getAllAnnouncements: () => Announcement[];
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set, get) => ({
      announcements: [],
      
      createAnnouncement: (message, publishDate, endDate) => {
        // Validate message length
        if (!message || message.trim().length === 0) {
          return { success: false, error: 'Сообщение не может быть пустым' };
        }
        
        if (message.trim().length > 500) {
          return { success: false, error: 'Сообщение не должно превышать 500 символов' };
        }
        
        // Validate publish date
        if (publishDate < Date.now()) {
          return { success: false, error: 'Дата публикации не может быть в прошлом' };
        }
        
        // Validate end date if provided
        if (endDate && endDate <= publishDate) {
          return { success: false, error: 'Дата окончания должна быть позже даты публикации' };
        }
        
        const newAnnouncement: Announcement = {
          id: generateId('ANNOUNCE'),
          message: message.trim(),
          publishDate,
          endDate,
          createdAt: Date.now(),
          isActive: true,
        };
        
        set((state) => ({
          announcements: [newAnnouncement, ...state.announcements],
        }));
        
        return { success: true };
      },
      
      updateAnnouncement: (id, updates) => {
        set((state) => ({
          announcements: state.announcements.map((announcement) =>
            announcement.id === id
              ? { ...announcement, ...updates }
              : announcement
          ),
        }));
      },
      
      deleteAnnouncement: (id) => {
        set((state) => ({
          announcements: state.announcements.filter((announcement) => announcement.id !== id),
        }));
      },
      
      toggleAnnouncementStatus: (id) => {
        set((state) => ({
          announcements: state.announcements.map((announcement) =>
            announcement.id === id
              ? { ...announcement, isActive: !announcement.isActive }
              : announcement
          ),
        }));
      },
      
      getActiveAnnouncement: () => {
        const now = Date.now();
        const announcements = get().announcements;
        
        // Find active announcement that should be published and not expired
        const activeAnnouncement = announcements.find(
          (a) => a.isActive && a.publishDate <= now && (!a.endDate || a.endDate > now)
        );
        
        return activeAnnouncement || null;
      },
      
      getAllAnnouncements: () => {
        return get().announcements.sort((a, b) => b.createdAt - a.createdAt);
      },
    }),
    {
      name: 'announcements-storage',
    }
  )
);
