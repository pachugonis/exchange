import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '../types';

export type ExchangeStep = 1 | 2 | 3 | 4 | 5;

export interface ExchangeFlowData {
  // Step 1: Currencies and Amount
  fromCurrency: Currency | null;
  toCurrency: Currency | null;
  fromAmount: string;
  toAmount: string;
  rate: number;
  commission: number;
  
  // Step 2: Contact Information
  email: string;
  telegram: string;
  promoCode: string;
  
  // Step 3: Payment Details
  fromWallet: string;
  toWallet: string;
  
  // Step 4: Confirmation
  agreedToTerms: boolean;
  agreedToAML: boolean;
  
  // Step 5: Payment (order created)
  orderId: string | null;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ExchangeFlowState extends ExchangeFlowData {
  currentStep: ExchangeStep;
  validationErrors: ValidationErrors;
  isLoadingRates: boolean;
  lastRateUpdate: number | null;
  
  // Actions
  setCurrentStep: (step: ExchangeStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  
  // Step 1
  setFromCurrency: (currency: Currency | null) => void;
  setToCurrency: (currency: Currency | null) => void;
  setFromAmount: (amount: string) => void;
  calculateToAmount: () => Promise<void>;
  swapCurrencies: () => void;
  
  // Step 2
  setEmail: (email: string) => void;
  setTelegram: (telegram: string) => void;
  setPromoCode: (promoCode: string) => void;
  
  // Step 3
  setFromWallet: (wallet: string) => void;
  setToWallet: (wallet: string) => void;
  
  // Step 4
  setAgreedToTerms: (agreed: boolean) => void;
  setAgreedToAML: (agreed: boolean) => void;
  
  // Step 5
  setOrderId: (orderId: string) => void;
  
  // Validation
  validateStep: (step: ExchangeStep) => boolean;
  clearValidationErrors: () => void;
  
  // Reset
  resetFlow: () => void;
}

const initialState: ExchangeFlowData = {
  fromCurrency: null,
  toCurrency: null,
  fromAmount: '',
  toAmount: '',
  rate: 0,
  commission: 0.02,
  email: '',
  telegram: '',
  promoCode: '',
  fromWallet: '',
  toWallet: '',
  agreedToTerms: false,
  agreedToAML: false,
  orderId: null,
};

export const useExchangeFlowStore = create<ExchangeFlowState>()(
  persist(
    (set, get) => ({
      ...initialState,
      currentStep: 1,
      validationErrors: {},
      isLoadingRates: false,
      lastRateUpdate: null,
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      goToNextStep: () => {
        const { currentStep, validateStep } = get();
        if (validateStep(currentStep) && currentStep < 5) {
          set({ currentStep: (currentStep + 1) as ExchangeStep });
        }
      },
      
      goToPreviousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as ExchangeStep });
        }
      },
      
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
        const { fromCurrency, toCurrency, fromAmount } = get();
        
        // Get commission from admin settings
        const adminStorage = localStorage.getItem('admin-storage');
        let commission = 0.02; // default
        if (adminStorage) {
          try {
            const { state } = JSON.parse(adminStorage);
            commission = state.settings?.commission || 0.02;
          } catch (e) {
            console.error('Error loading admin commission:', e);
          }
        }
        
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
          const { fetchCryptoRates, calculateRate } = await import('../api/cryptoAPI');
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
            commission,
          });
        } catch (error) {
          console.error('Error calculating exchange:', error);
          set({ isLoadingRates: false });
        }
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
      
      setEmail: (email) => set({ email }),
      setTelegram: (telegram) => set({ telegram }),
      setPromoCode: (promoCode) => set({ promoCode }),
      setFromWallet: (wallet) => set({ fromWallet: wallet }),
      setToWallet: (wallet) => set({ toWallet: wallet }),
      setAgreedToTerms: (agreed) => set({ agreedToTerms: agreed }),
      setAgreedToAML: (agreed) => set({ agreedToAML: agreed }),
      setOrderId: (orderId) => set({ orderId }),
      
      validateStep: (step) => {
        const state = get();
        const errors: ValidationErrors = {};
        
        switch (step) {
          case 1: // Currencies and Amount
            if (!state.fromCurrency) {
              errors.fromCurrency = 'Выберите валюту для отправки';
            }
            if (!state.toCurrency) {
              errors.toCurrency = 'Выберите валюту для получения';
            }
            if (!state.fromAmount || parseFloat(state.fromAmount) <= 0) {
              errors.fromAmount = 'Введите корректную сумму';
            } else if (state.fromCurrency) {
              const amount = parseFloat(state.fromAmount);
              if (amount < state.fromCurrency.minAmount) {
                errors.fromAmount = `Минимальная сумма: ${state.fromCurrency.minAmount}`;
              }
              if (amount > state.fromCurrency.maxAmount) {
                errors.fromAmount = `Максимальная сумма: ${state.fromCurrency.maxAmount}`;
              }
            }
            break;
            
          case 2: // Contact Information
            if (!state.email) {
              errors.email = 'Введите email';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
              errors.email = 'Введите корректный email';
            }
            break;
            
          case 3: // Payment Details
            if (!state.fromWallet) {
              errors.fromWallet = 'Введите адрес кошелька отправителя';
            }
            if (!state.toWallet) {
              errors.toWallet = 'Введите адрес кошелька получателя';
            }
            break;
            
          case 4: // Confirmation
            if (!state.agreedToTerms) {
              errors.terms = 'Необходимо согласиться с правилами';
            }
            if (!state.agreedToAML) {
              errors.aml = 'Необходимо согласиться с политикой AML/KYC';
            }
            break;
        }
        
        set({ validationErrors: errors });
        return Object.keys(errors).length === 0;
      },
      
      clearValidationErrors: () => set({ validationErrors: {} }),
      
      resetFlow: () => set({ 
        ...initialState, 
        currentStep: 1, 
        validationErrors: {},
        isLoadingRates: false,
        lastRateUpdate: null,
      }),
    }),
    {
      name: 'exchange-flow-storage',
      partialize: (state) => ({
        // Save only form data, not UI state
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency,
        fromAmount: state.fromAmount,
        toAmount: state.toAmount,
        rate: state.rate,
        commission: state.commission,
        email: state.email,
        telegram: state.telegram,
        promoCode: state.promoCode,
        fromWallet: state.fromWallet,
        toWallet: state.toWallet,
        currentStep: state.currentStep,
        orderId: state.orderId,
      }),
    }
  )
);
