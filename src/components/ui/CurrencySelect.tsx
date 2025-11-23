import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { useTranslation } from '../../hooks/useTranslation';
import type { Currency } from '../../types';

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  currencies: Currency[];
  excludeCurrencyId?: string;
  label?: string;
  error?: string;
  className?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  currencies,
  excludeCurrencyId,
  label,
  error,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedCurrency = currencies.find((c) => c.id === value);
  const filteredCurrencies = excludeCurrencyId
    ? currencies.filter((c) => c.id !== excludeCurrencyId)
    : currencies;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (currencyId: string) => {
    onChange(currencyId);
    setIsOpen(false);
  };

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      
      <div className="relative">
        {/* Selected currency display */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-left flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedCurrency ? (
              <>
                <CurrencyIcon currency={selectedCurrency} size="sm" />
                <span className="truncate">
                  {selectedCurrency.name} ({selectedCurrency.code})
                </span>
              </>
            ) : (
              <span className="text-dark-500">{t('exchange.selectCurrency')}</span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-dark-500 transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredCurrencies.map((currency) => (
              <button
                key={currency.id}
                type="button"
                onClick={() => handleSelect(currency.id)}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-dark-50 dark:hover:bg-dark-600 transition ${
                  currency.id === value ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <CurrencyIcon currency={currency} size="sm" />
                <span className="flex-1 truncate">
                  {currency.name} ({currency.code})
                </span>
                {currency.id === value && (
                  <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
