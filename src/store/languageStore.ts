import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ru' | 'en';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Detect browser language
const getBrowserLanguage = (): Locale => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'ru'; // Default to Russian
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: getBrowserLanguage(),
      setLocale: (locale) => {
        set({ locale });
        // Update HTML lang attribute for accessibility
        document.documentElement.lang = locale;
      },
    }),
    {
      name: 'language-storage',
      onRehydrateStorage: () => (state) => {
        // Update HTML lang attribute after rehydration
        if (state) {
          document.documentElement.lang = state.locale;
        }
      },
    }
  )
);
