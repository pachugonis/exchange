import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromoCode, AppliedPromo } from '../types/promo';

// Default promo codes
const defaultPromoCodes: PromoCode[] = [
  {
    code: 'WELCOME10',
    discount: 10,
    type: 'commission',
    minAmount: 100,
    maxUses: 1000,
    usesCount: 0,
    isActive: true,
    createdAt: Date.now(),
  },
  {
    code: 'BONUS50',
    discount: 0,
    type: 'bonus',
    bonusAmount: 50,
    minAmount: 1000,
    maxUses: 500,
    usesCount: 0,
    isActive: true,
    createdAt: Date.now(),
  },
  {
    code: 'VIP20',
    discount: 20,
    type: 'commission',
    minAmount: 500,
    maxUses: 100,
    usesCount: 0,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    isActive: true,
    createdAt: Date.now(),
  },
];

interface PromoState {
  promoCodes: PromoCode[];
  appliedPromo: AppliedPromo | null;
  validatePromo: (code: string, amount: number) => { valid: boolean; error?: string; promo?: PromoCode };
  applyPromo: (code: string) => void;
  removePromo: () => void;
  addPromoCode: (promo: PromoCode) => void;
  updatePromoCode: (code: string, updates: Partial<PromoCode>) => void;
  deletePromoCode: (code: string) => void;
  incrementPromoUse: (code: string) => void;
}

export const usePromoStore = create<PromoState>()(
  persist(
    (set, get) => ({
      promoCodes: defaultPromoCodes,
      appliedPromo: null,

      validatePromo: (code, amount) => {
        const promo = get().promoCodes.find(
          (p) => p.code.toLowerCase() === code.toLowerCase()
        );

        if (!promo) {
          return { valid: false, error: 'Промокод не найден' };
        }

        if (!promo.isActive) {
          return { valid: false, error: 'Промокод неактивен' };
        }

        if (promo.expiresAt && promo.expiresAt < Date.now()) {
          return { valid: false, error: 'Промокод истек' };
        }

        if (promo.maxUses && promo.usesCount && promo.usesCount >= promo.maxUses) {
          return { valid: false, error: 'Промокод исчерпан' };
        }

        if (promo.minAmount && amount < promo.minAmount) {
          return {
            valid: false,
            error: `Минимальная сумма: ${promo.minAmount}`,
          };
        }

        return { valid: true, promo };
      },

      applyPromo: (code) => {
        const promo = get().promoCodes.find(
          (p) => p.code.toLowerCase() === code.toLowerCase()
        );

        if (promo) {
          set({
            appliedPromo: {
              code: promo.code,
              discount: promo.discount,
              type: promo.type,
              bonusAmount: promo.bonusAmount,
            },
          });
        }
      },

      removePromo: () => {
        set({ appliedPromo: null });
      },

      addPromoCode: (promo) => {
        set((state) => ({
          promoCodes: [...state.promoCodes, promo],
        }));
      },

      updatePromoCode: (code, updates) => {
        set((state) => ({
          promoCodes: state.promoCodes.map((p) =>
            p.code === code ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePromoCode: (code) => {
        set((state) => ({
          promoCodes: state.promoCodes.filter((p) => p.code !== code),
        }));
      },

      incrementPromoUse: (code) => {
        set((state) => ({
          promoCodes: state.promoCodes.map((p) =>
            p.code === code
              ? { ...p, usesCount: (p.usesCount || 0) + 1 }
              : p
          ),
        }));
      },
    }),
    {
      name: 'promo-storage',
    }
  )
);
