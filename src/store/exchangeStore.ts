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
      return parsed.filter((c: Currency) => c.isActive);
    }
  } catch (error) {
    console.error('Error loading currencies:', error);
  }
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
    set({ currencies: loadCurrencies() });
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
