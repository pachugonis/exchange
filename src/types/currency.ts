export type CurrencyType = 'crypto' | 'ewallet' | 'card' | 'cash' | 'custom';

export type CryptoNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'BTC' | 'ETH' | 'XRP' | 'Solana' | 'DOGE' | 'XMR' | 'LTC' | 'Sui';

export interface Currency {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  type: CurrencyType;
  icon: string;
  iconUrl?: string; // URL to icon image (for crypto)
  minAmount: number;
  maxAmount: number;
  reserve: number;
  isActive: boolean;
  networks?: CryptoNetwork[];
  symbol?: string;
  decimals: number;
  paymentAddress?: string; // Адрес для оплаты
  // Custom currency fields
  customRate?: number; // Fixed rate for custom currencies
  customCommission?: number; // Custom commission percentage
  isCustom?: boolean; // Flag to identify custom currencies
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
