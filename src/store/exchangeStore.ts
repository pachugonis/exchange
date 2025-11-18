import { create } from 'zustand';
import type { Currency } from '../types';
import { currencies } from '../data/currencies';
import { getExchangeRate } from '../data/mockRates';
import { DEFAULT_COMMISSION } from '../utils/constants';

interface ExchangeState {
  currencies: Currency[];
  fromCurrency: Currency | null;
  toCurrency: Currency | null;
  fromAmount: string;
  toAmount: string;
  rate: number;
  commission: number;
  setFromCurrency: (currency: Currency | null) => void;
  setToCurrency: (currency: Currency | null) => void;
  setFromAmount: (amount: string) => void;
  calculateToAmount: () => void;
  swapCurrencies: () => void;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  currencies,
  fromCurrency: null,
  toCurrency: null,
  fromAmount: '',
  toAmount: '',
  rate: 0,
  commission: DEFAULT_COMMISSION,
  
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
  
  calculateToAmount: () => {
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
    
    const rate = getExchangeRate(fromCurrency.code, toCurrency.code);
    const baseAmount = amount * rate;
    const commissionAmount = baseAmount * commission;
    const total = baseAmount - commissionAmount;
    
    set({ 
      rate,
      toAmount: total.toFixed(toCurrency.decimals),
    });
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
