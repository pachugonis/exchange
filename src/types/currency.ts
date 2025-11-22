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
  coinGeckoId?: string; // CoinGecko identifier for automatic rate fetching
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

// CoinGecko API Types
export interface CoinGeckoCoin {
  id: string; // CoinGecko identifier (e.g., "bitcoin")
  symbol: string; // Cryptocurrency symbol (e.g., "btc")
  name: string; // Full cryptocurrency name (e.g., "Bitcoin")
  platforms?: Record<string, string>; // Platform addresses
}

export interface CoinGeckoSimpleCoin {
  id: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  platforms?: string[]; // Simplified platforms array
}

export interface CoinGeckoCoinDetails {
  id: string;
  symbol: string;
  name: string;
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
  market_data?: {
    current_price?: {
      usd?: number;
      rub?: number;
    };
  };
  platforms?: Record<string, string>;
  detail_platforms?: Record<string, {
    decimal_place?: number;
    contract_address?: string;
  }>;
}

export interface CoinDetailsResponse {
  id: string;
  symbol: string;
  name: string;
  nameRu: string;
  iconUrl: string;
  decimals: number;
  currentPrice: {
    usd: number;
    rub: number;
  };
  platforms: string[];
  networks: CryptoNetwork[];
}
