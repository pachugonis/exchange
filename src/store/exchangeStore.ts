import { create } from 'zustand';
import type { Currency } from '../types';
import { currencies as defaultCurrencies } from '../data/currencies';
import { fetchCryptoRates, calculateRate, calculateRateWithCustomCrypto } from '../api/cryptoAPI';
import { DEFAULT_COMMISSION } from '../utils/constants';

// Load currencies from localStorage or use defaults
const loadCurrencies = (): Currency[] => {
  try {
    const stored = localStorage.getItem('currencies-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Merge default currencies with stored custom currencies
      const defaultMap = new Map(defaultCurrencies.map(c => [c.code, c]));
      const storedMap = new Map(parsed.map((c: Currency) => [c.code, c]));
      
      // Start with default currencies and update with stored values
      const merged = defaultCurrencies.map(defaultCurrency => {
        const stored = storedMap.get(defaultCurrency.code);
        return stored ? { ...defaultCurrency, ...stored } : defaultCurrency;
      });
      
      // Add custom currencies that are not in defaults
      parsed.forEach((currency: Currency) => {
        if (currency.isCustom && !defaultMap.has(currency.code)) {
          merged.push(currency);
        }
      });
      
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
    const { fromCurrency, toCurrency, fromAmount, commission: defaultCommission } = get();
    
    if (!fromCurrency || !toCurrency || !fromAmount) {
      set({ toAmount: '', rate: 0 });
      return;
    }
    
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      set({ toAmount: '', rate: 0 });
      return;
    }
    
    // Determine commission to use
    let commission = defaultCommission;
    if (fromCurrency?.customCommission !== undefined) {
      commission = fromCurrency.customCommission;
    } else if (toCurrency?.customCommission !== undefined) {
      commission = toCurrency.customCommission;
    }
    
    try {
      set({ isLoadingRates: true });
      
      let rate: number;
      let lastUpdated: number;
      
      // Check if any currency has custom rate (manual override)
      if (fromCurrency.customRate) {
        rate = fromCurrency.customRate;
        lastUpdated = Date.now();
      } else if (toCurrency.customRate) {
        rate = 1 / toCurrency.customRate;
        lastUpdated = Date.now();
      } else {
        // Check if either currency has CoinGecko ID for automatic rate fetching
        const fromGeckoId = fromCurrency.coinGeckoId;
        const toGeckoId = toCurrency.coinGeckoId;
        
        if (fromGeckoId || toGeckoId) {
          // Use new function that supports custom cryptocurrencies
          rate = await calculateRateWithCustomCrypto(
            fromCurrency.code,
            toCurrency.code,
            fromGeckoId,
            toGeckoId
          );
          lastUpdated = Date.now();
        } else {
          // Use standard API rates for predefined currencies
          const rates = await fetchCryptoRates();
          rate = calculateRate(rates, fromCurrency.code, toCurrency.code);
          lastUpdated = rates.lastUpdated;
        }
      }
      
      const baseAmount = amount * rate;
      const commissionAmount = baseAmount * commission;
      const total = baseAmount - commissionAmount;
      
      set({ 
        rate,
        toAmount: total.toFixed(toCurrency.decimals),
        lastRateUpdate: lastUpdated,
        isLoadingRates: false,
        commission,
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
        
        // Merge default currencies with stored custom currencies
        const defaultMap = new Map(defaultCurrencies.map(c => [c.code, c]));
        const storedMap = new Map(parsed.map((c: Currency) => [c.code, c]));
        
        // Start with default currencies and update with stored values
        currencies = defaultCurrencies.map(defaultCurrency => {
          const stored = storedMap.get(defaultCurrency.code);
          return stored ? { ...defaultCurrency, ...stored } : defaultCurrency;
        });
        
        // Add custom currencies that are not in defaults
        parsed.forEach((currency: Currency) => {
          if (currency.isCustom && !defaultMap.has(currency.code)) {
            currencies.push(currency);
          }
        });
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
