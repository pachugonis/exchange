import { useLanguageStore } from '../store/languageStore';
import { getTranslation } from '../locales/translations';

export const useTranslation = () => {
  const { locale, setLocale } = useLanguageStore();

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(key, locale, params);
  };

  return {
    t,
    locale,
    setLocale,
  };
};
