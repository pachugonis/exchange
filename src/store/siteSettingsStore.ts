import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SiteSettings {
  // Site Identity
  siteName: string;
  siteLogo: string | null;
  siteFavicon: string | null;
  
  // Design Variant
  designVariant: 'default' | 'alternative';
  
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  
  // Stats Section
  showStats: boolean;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  
  // Features Section
  showFeatures: boolean;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  feature4Title: string;
  feature4Description: string;
  
  // Crypto Rates Section
  showCryptoRates: boolean;
  cryptoRatesTitle: string;
  
  // CTA Section
  showCTA: boolean;
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonText: string;
  
  // Components Visibility
  showPopularDirections: boolean;
  showExchangeSteps: boolean;
  showTestimonials: boolean;
  
  // Footer Settings
  footerDescription: string;
  footerEmail: string;
  footerTelegram: string;
  footerCopyright: string;
  
  // Footer Banners (88x31 pixels)
  footerBanners: Array<{
    id: string;
    image: string;
    link: string;
    title: string;
  }>;
}

interface SiteSettingsState {
  settings: SiteSettings;
  updateSettings: (updates: Partial<SiteSettings>) => void;
  addFooterBanner: (banner: { image: string; link: string; title: string }) => void;
  updateFooterBanner: (id: string, updates: { image?: string; link?: string; title?: string }) => void;
  deleteFooterBanner: (id: string) => void;
  resetToDefaults: () => void;
}

const defaultSettings: SiteSettings = {
  siteName: 'ExchangeKit',
  siteLogo: null,
  siteFavicon: null,
  
  designVariant: 'default',
  
  heroTitle: 'Быстрый и надежный обмен валют',
  heroSubtitle: 'Обменивайте криптовалюты, электронные деньги и банковские карты по выгодным курсам',
  
  showStats: true,
  stat1Value: '15 000+',
  stat1Label: 'Успешных обменов',
  stat2Value: '24/7',
  stat2Label: 'Поддержка клиентов',
  stat3Value: '5-30 мин',
  stat3Label: 'Время обмена',
  
  showFeatures: true,
  feature1Title: 'Высокая скорость',
  feature1Description: 'Обмен занимает от 5 до 30 минут',
  feature2Title: 'Безопасность',
  feature2Description: 'SSL шифрование и AML/KYC проверки',
  feature3Title: 'Круглосуточно',
  feature3Description: 'Работаем 24/7 без выходных',
  feature4Title: 'Выгодные курсы',
  feature4Description: 'Лучшие курсы обмена на рынке',
  
  showCryptoRates: true,
  cryptoRatesTitle: 'Курсы криптовалют',
  
  showCTA: true,
  ctaTitle: 'Готовы начать?',
  ctaDescription: 'Создайте заявку прямо сейчас и обменяйте валюту по выгодному курсу',
  ctaButtonText: 'Обменять валюту',
  
  showPopularDirections: true,
  showExchangeSteps: true,
  showTestimonials: true,
  
  footerDescription: 'Надежный сервис обмена криптовалют и электронных денег',
  footerEmail: 'support@exchangekit.cc',
  footerTelegram: '@exchangekit_support',
  footerCopyright: '© 2024 ExchangeKit. Все права защищены.',
  
  footerBanners: [],
};

export const useSiteSettingsStore = create<SiteSettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      
      addFooterBanner: (banner) => {
        set((state) => ({
          settings: {
            ...state.settings,
            footerBanners: [
              ...state.settings.footerBanners,
              {
                id: `banner-${Date.now()}`,
                ...banner,
              },
            ],
          },
        }));
      },
      
      updateFooterBanner: (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            footerBanners: state.settings.footerBanners.map((banner) =>
              banner.id === id ? { ...banner, ...updates } : banner
            ),
          },
        }));
      },
      
      deleteFooterBanner: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            footerBanners: state.settings.footerBanners.filter((banner) => banner.id !== id),
          },
        }));
      },
      
      resetToDefaults: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'site-settings-storage',
    }
  )
);
