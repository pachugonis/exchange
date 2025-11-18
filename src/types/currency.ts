export type CurrencyType = 'crypto' | 'ewallet' | 'card' | 'cash';

export type CryptoNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'BTC' | 'ETH';

export interface Currency {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  type: CurrencyType;
  icon: string;
  minAmount: number;
  maxAmount: number;
  reserve: number;
  isActive: boolean;
  networks?: CryptoNetwork[];
  symbol?: string;
  decimals: number;
}

export interface ExchangePair {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  commission: number;
  minAmount: number;
  maxAmount: number;
  reserve: number;
}

export interface ExchangeRate {
  pair: string; // e.g., "BTC_USD"
  rate: number;
  timestamp: number;
  change24h?: number; // Percentage change in 24 hours
  direction?: 'up' | 'down' | 'stable';
}
