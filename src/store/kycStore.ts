import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KYCData, KYCDocument, KYCLevel, KYCStatus } from '../types/kyc';
import { generateId } from '../utils/generators';

interface KYCState {
  kycData: Record<string, KYCData>;
  submitKYC: (userId: string, level: KYCLevel, data: Partial<KYCData>) => Promise<{ success: boolean; error?: string }>;
  updateKYCStatus: (userId: string, status: KYCStatus, rejectionReason?: string) => void;
  uploadDocument: (userId: string, document: Omit<KYCDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  getKYCData: (userId: string) => KYCData | undefined;
  getAllKYCSubmissions: () => KYCData[];
}

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      kycData: {},

      submitKYC: async (userId, level, data) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentKYC = get().kycData[userId] || {
          userId,
          level: 0,
          status: 'none' as KYCStatus,
        };

        // Calculate limits based on level
        const limits = {
          1: { daily: 1000, monthly: 10000 },
          2: { daily: 10000, monthly: 100000 },
          3: { daily: 50000, monthly: 500000 },
        };

        const levelLimits = limits[level as 1 | 2 | 3] || { daily: 500, monthly: 5000 };

        const updatedKYC: KYCData = {
          ...currentKYC,
          ...data,
          level,
          status: 'pending',
          submittedAt: Date.now(),
          dailyLimit: levelLimits.daily,
          monthlyLimit: levelLimits.monthly,
        };

        set((state) => ({
          kycData: {
            ...state.kycData,
            [userId]: updatedKYC,
          },
        }));

        return { success: true };
      },

      updateKYCStatus: (userId, status, rejectionReason) => {
        const currentKYC = get().kycData[userId];
        if (!currentKYC) return;

        const updatedKYC: KYCData = {
          ...currentKYC,
          status,
          reviewedAt: Date.now(),
          rejectionReason,
        };

        set((state) => ({
          kycData: {
            ...state.kycData,
            [userId]: updatedKYC,
          },
        }));
      },

      uploadDocument: (userId, document) => {
        const currentKYC = get().kycData[userId];
        if (!currentKYC) return;

        const newDocument: KYCDocument = {
          ...document,
          id: generateId('DOC'),
          uploadedAt: Date.now(),
          status: 'pending',
        };

        const updatedKYC: KYCData = {
          ...currentKYC,
          documents: [...(currentKYC.documents || []), newDocument],
        };

        set((state) => ({
          kycData: {
            ...state.kycData,
            [userId]: updatedKYC,
          },
        }));
      },

      getKYCData: (userId) => {
        return get().kycData[userId];
      },

      getAllKYCSubmissions: () => {
        return Object.values(get().kycData);
      },
    }),
    {
      name: 'kyc-storage',
    }
  )
);
