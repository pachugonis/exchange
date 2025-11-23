import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Locale } from '../../store/languageStore';

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === locale);

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">
          {currentLanguage?.flag} {currentLanguage?.label}
        </span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-dark-200 dark:border-dark-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-50 dark:hover:bg-dark-700 transition first:rounded-t-lg last:rounded-b-lg ${
              locale === lang.code
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-dark-700 dark:text-dark-300'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="font-medium">{lang.label}</span>
            {locale === lang.code && (
              <span className="ml-auto text-primary-500">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
