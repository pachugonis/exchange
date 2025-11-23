import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DesignVariant = 'default' | 'alternative';

interface DesignVariantState {
  variant: DesignVariant;
  setVariant: (variant: DesignVariant) => void;
}

export const useDesignVariantStore = create<DesignVariantState>()(
  persist(
    (set) => ({
      variant: 'default',
      setVariant: (variant) => set({ variant }),
    }),
    {
      name: 'design-variant-storage',
    }
  )
);
