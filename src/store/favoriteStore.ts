import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoriteDirection } from '../types/favorite';

interface FavoriteState {
  favorites: FavoriteDirection[];
  addFavorite: (fromCurrency: string, toCurrency: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (fromCurrency: string, toCurrency: string) => boolean;
  toggleFavorite: (fromCurrency: string, toCurrency: string) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (fromCurrency, toCurrency) => {
        const id = `${fromCurrency}-${toCurrency}`;
        const exists = get().favorites.some((f) => f.id === id);
        
        if (!exists) {
          set((state) => ({
            favorites: [
              ...state.favorites,
              {
                id,
                fromCurrencyCode: fromCurrency,
                toCurrencyCode: toCurrency,
                createdAt: Date.now(),
              },
            ],
          }));
        }
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      isFavorite: (fromCurrency, toCurrency) => {
        const id = `${fromCurrency}-${toCurrency}`;
        return get().favorites.some((f) => f.id === id);
      },

      toggleFavorite: (fromCurrency, toCurrency) => {
        const id = `${fromCurrency}-${toCurrency}`;
        const exists = get().favorites.some((f) => f.id === id);
        
        if (exists) {
          get().removeFavorite(id);
        } else {
          get().addFavorite(fromCurrency, toCurrency);
        }
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);
