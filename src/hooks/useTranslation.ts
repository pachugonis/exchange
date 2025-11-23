import { useLanguageStore, Locale } from '../store/languageStore';
import { getTranslation } from '../locales/translations';

export const useTranslation = () => {
  const { locale, setLocale } = useLanguageStore();

  const t = (key: string): string => {
    return getTranslation(key, locale);
  };

  return {
    t,
    locale,
    setLocale,
  };
};
