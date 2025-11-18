import type { Currency } from './currency';

export interface ExchangeFormData {
  fromCurrency: Currency | null;
  toCurrency: Currency | null;
  fromAmount: string;
  toAmount: string;
  selectedNetwork?: string;
}

export interface ExchangeCalculation {
  fromAmount: number;
  toAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
  total: number;
}

export interface ExchangeValidation {
  isValid: boolean;
  errors: {
    fromCurrency?: string;
    toCurrency?: string;
    fromAmount?: string;
    toAmount?: string;
    reserve?: string;
  };
}
