import { create } from 'zustand';
import type { Currency } from '../types';
import { currencies as defaultCurrencies } from '../data/currencies';
import { fetchCryptoRates, calculateRate } from '../api/cryptoAPI';
import { DEFAULT_COMMISSION } from '../utils/constants';

// Load currencies from localStorage or use defaults
const loadCurrencies = (): Currency[] => {
  try {
    const stored = localStorage.getItem('currencies-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Get valid currency codes from defaults
      const validCodes = new Set(defaultCurrencies.map(c => c.code));
      
      // Filter stored currencies to only include those still in defaults
      const validStored = parsed.filter((c: Currency) => validCodes.has(c.code));
      
      // Merge: update existing currencies with stored values, add new ones from defaults
      const storedMap = new Map(validStored.map((c: Currency) => [c.code, c]));
      const merged = defaultCurrencies.map(defaultCurrency => {
        const stored = storedMap.get(defaultCurrency.code);
        return stored ? { ...defaultCurrency, ...stored } : defaultCurrency;
      });
      
      // Save cleaned list back to localStorage
      localStorage.setItem('currencies-data', JSON.stringify(merged));
      
      return merged.filter((c: Currency) => c.isActive);
    }
  } catch (error) {
    console.error('Error loading currencies:', error);
  }
  
  // First time or error - use defaults and save to localStorage
  localStorage.setItem('currencies-data', JSON.stringify(defaultCurrencies));
  return defaultCurrencies.filter(c => c.isActive);
};

interface ExchangeState {
  currencies: Currency[];
  fromCurrency: Currency | null;
  toCurrency: Currency | null;
  fromAmount: string;
  toAmount: string;
  rate: number;
  commission: number;
  isLoadingRates: boolean;
  lastRateUpdate: number | null;
  setFromCurrency: (currency: Currency | null) => void;
  setToCurrency: (currency: Currency | null) => void;
  setFromAmount: (amount: string) => void;
  calculateToAmount: () => Promise<void>;
  swapCurrencies: () => void;
  refreshRates: () => Promise<void>;
  reloadCurrencies: () => void;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  currencies: loadCurrencies(),
  fromCurrency: null,
  toCurrency: null,
  fromAmount: '',
  toAmount: '',
  rate: 0,
  commission: DEFAULT_COMMISSION,
  isLoadingRates: false,
  lastRateUpdate: null,
  
  setFromCurrency: (currency) => {
    set({ fromCurrency: currency });
    get().calculateToAmount();
  },
  
  setToCurrency: (currency) => {
    set({ toCurrency: currency });
    get().calculateToAmount();
  },
  
  setFromAmount: (amount) => {
    set({ fromAmount: amount });
    get().calculateToAmount();
  },
  
  calculateToAmount: async () => {
    const { fromCurrency, toCurrency, fromAmount, commission } = get();
    
    if (!fromCurrency || !toCurrency || !fromAmount) {
      set({ toAmount: '', rate: 0 });
      return;
    }
    
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      set({ toAmount: '', rate: 0 });
      return;
    }
    
    try {
      set({ isLoadingRates: true });
      const rates = await fetchCryptoRates();
      const rate = calculateRate(rates, fromCurrency.code, toCurrency.code);
      const baseAmount = amount * rate;
      const commissionAmount = baseAmount * commission;
      const total = baseAmount - commissionAmount;
      
      set({ 
        rate,
        toAmount: total.toFixed(toCurrency.decimals),
        lastRateUpdate: rates.lastUpdated,
        isLoadingRates: false,
      });
    } catch (error) {
      console.error('Error calculating exchange:', error);
      set({ isLoadingRates: false });
    }
  },
  
  refreshRates: async () => {
    await get().calculateToAmount();
  },
  
  reloadCurrencies: () => {
    // Reload from localStorage or defaults
    const stored = localStorage.getItem('currencies-data');
    let currencies: Currency[];
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Get valid currency codes from defaults
        const validCodes = new Set(defaultCurrencies.map(c => c.code));
        
        // Filter stored currencies to only include those still in defaults
        const validStored = parsed.filter((c: Currency) => validCodes.has(c.code));
        
        // Merge: update existing currencies with stored values, add new ones from defaults
        const storedMap = new Map(validStored.map((c: Currency) => [c.code, c]));
        currencies = defaultCurrencies.map(defaultCurrency => {
          const stored = storedMap.get(defaultCurrency.code);
          return stored ? { ...defaultCurrency, ...stored } : defaultCurrency;
        });
        
        // Save cleaned list back to localStorage
        localStorage.setItem('currencies-data', JSON.stringify(currencies));
      } catch (error) {
        console.error('Error reloading currencies:', error);
        currencies = defaultCurrencies;
      }
    } else {
      // First time - save defaults to localStorage
      currencies = defaultCurrencies;
      localStorage.setItem('currencies-data', JSON.stringify(currencies));
    }
    
    set({ currencies: currencies.filter(c => c.isActive) });
  },
  
  swapCurrencies: () => {
    const { fromCurrency, toCurrency } = get();
    set({
      fromCurrency: toCurrency,
      toCurrency: fromCurrency,
      fromAmount: '',
      toAmount: '',
    });
  },
}));
