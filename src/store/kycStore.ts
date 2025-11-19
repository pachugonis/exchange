import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KYCData, KYCDocument, KYCLevel, KYCStatus } from '../types/kyc';
import { generateId } from '../utils/generators';

interface KYCState {
  kycData: Map<string, KYCData>;
  submitKYC: (userId: string, level: KYCLevel, data: Partial<KYCData>) => Promise<{ success: boolean; error?: string }>;
  updateKYCStatus: (userId: string, status: KYCStatus, rejectionReason?: string) => void;
  uploadDocument: (userId: string, document: Omit<KYCDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  getKYCData: (userId: string) => KYCData | undefined;
  getAllKYCSubmissions: () => KYCData[];
}

const KYC_STORAGE_KEY = 'kyc-data-storage';

const loadKYCData = (): Map<string, KYCData> => {
  try {
    const stored = localStorage.getItem(KYC_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading KYC data:', error);
  }
  return new Map();
};

const saveKYCData = (data: Map<string, KYCData>) => {
  try {
    const obj = Object.fromEntries(data);
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving KYC data:', error);
  }
};

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      kycData: loadKYCData(),

      submitKYC: async (userId, level, data) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentKYC = get().kycData.get(userId) || {
          userId,
          level: 0,
          status: 'none',
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

        const newData = new Map(get().kycData);
        newData.set(userId, updatedKYC);
        saveKYCData(newData);

        set({ kycData: newData });

        return { success: true };
      },

      updateKYCStatus: (userId, status, rejectionReason) => {
        const currentKYC = get().kycData.get(userId);
        if (!currentKYC) return;

        const updatedKYC: KYCData = {
          ...currentKYC,
          status,
          reviewedAt: Date.now(),
          rejectionReason,
        };

        const newData = new Map(get().kycData);
        newData.set(userId, updatedKYC);
        saveKYCData(newData);

        set({ kycData: newData });
      },

      uploadDocument: (userId, document) => {
        const currentKYC = get().kycData.get(userId);
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

        const newData = new Map(get().kycData);
        newData.set(userId, updatedKYC);
        saveKYCData(newData);

        set({ kycData: newData });
      },

      getKYCData: (userId) => {
        return get().kycData.get(userId);
      },

      getAllKYCSubmissions: () => {
        return Array.from(get().kycData.values());
      },
    }),
    {
      name: 'kyc-storage',
    }
  )
);
