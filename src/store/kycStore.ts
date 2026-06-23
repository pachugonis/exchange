import { create } from 'zustand';
import type { KYCData, KYCDocument, KYCLevel, KYCStatus } from '../types/kyc';
import { generateId } from '../utils/generators';
import { kycAPI } from '../api/kycAPI';
import { useUserStore } from './userStore';
import { useAdminStore } from './adminStore';

interface KYCState {
  // In-memory cache populated from the server.
  kycData: Record<string, KYCData>;
  // Documents staged locally before a submission is sent.
  pendingDocuments: Record<string, KYCDocument[]>;

  fetchMyKYC: (userId: string) => Promise<void>;
  fetchAllKYC: () => Promise<void>;
  submitKYC: (userId: string, level: KYCLevel, data: Partial<KYCData>) => Promise<{ success: boolean; error?: string }>;
  updateKYCStatus: (userId: string, status: KYCStatus, rejectionReason?: string) => Promise<boolean>;
  uploadDocument: (userId: string, document: Omit<KYCDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  getKYCData: (userId: string) => KYCData | undefined;
  getAllKYCSubmissions: () => KYCData[];
}

export const useKYCStore = create<KYCState>()((set, get) => ({
  kycData: {},
  pendingDocuments: {},

  fetchMyKYC: async (userId) => {
    const token = useUserStore.getState().token;
    if (!token) return;
    const res = await kycAPI.getMine(token);
    if (res.ok && res.data.kyc) {
      set((state) => ({ kycData: { ...state.kycData, [userId]: res.data.kyc as KYCData } }));
    }
  },

  fetchAllKYC: async () => {
    const token = useAdminStore.getState().token;
    if (!token) return;
    const res = await kycAPI.list(token);
    if (res.ok && Array.isArray(res.data.submissions)) {
      const map: Record<string, KYCData> = {};
      for (const kyc of res.data.submissions) map[kyc.userId] = kyc;
      set({ kycData: map });
    }
  },

  submitKYC: async (userId, level, data) => {
    const token = useUserStore.getState().token;
    if (!token) return { success: false, error: 'Не авторизован' };

    const documents = get().pendingDocuments[userId] || [];
    const res = await kycAPI.submit({ level, ...data, documents }, token);

    if (!res.ok || !res.data.kyc) {
      return { success: false, error: res.data.error || 'Ошибка отправки' };
    }

    set((state) => ({
      kycData: { ...state.kycData, [userId]: res.data.kyc },
      pendingDocuments: { ...state.pendingDocuments, [userId]: [] },
    }));
    return { success: true };
  },

  updateKYCStatus: async (userId, status, rejectionReason) => {
    const token = useAdminStore.getState().token;
    if (!token) return false;

    const action = status === 'verified' ? 'approve' : 'reject';
    const res = await kycAPI.review(userId, { action, reason: rejectionReason }, token);

    if (res.ok && res.data.kyc) {
      set((state) => ({ kycData: { ...state.kycData, [userId]: res.data.kyc } }));
      return true;
    }
    return false;
  },

  // Stage a document locally; it is sent with the next submitKYC call.
  uploadDocument: (userId, document) => {
    const newDocument: KYCDocument = {
      ...document,
      id: generateId('DOC'),
      uploadedAt: Date.now(),
      status: 'pending',
    };
    set((state) => ({
      pendingDocuments: {
        ...state.pendingDocuments,
        [userId]: [...(state.pendingDocuments[userId] || []), newDocument],
      },
    }));
  },

  getKYCData: (userId) => get().kycData[userId],

  getAllKYCSubmissions: () => Object.values(get().kycData),
}));
