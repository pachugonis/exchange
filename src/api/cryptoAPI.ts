/**
 * Real-time cryptocurrency rates API
 * Uses CoinGecko public API
 */

import type { CoinGeckoCoin, CoinGeckoSimpleCoin, CoinGeckoCoinDetails, CoinDetailsResponse, CryptoNetwork } from '../types/currency';

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    rub: number;
    eur?: number;
    usd_24h_change?: number;
  };
}

interface CryptoRates {
  BTC_USD: number;
  BTC_RUB: number;
  ETH_USD: number;
  ETH_RUB: number;
  USDT_USD: number;
  USDT_RUB: number;
  USDC_USD: number;
  USDC_RUB: number;
  XRP_USD: number;
  XRP_RUB: number;
  BNB_USD: number;
  BNB_RUB: number;
  SOL_USD: number;
  SOL_RUB: number;
  TRX_USD: number;
  TRX_RUB: number;
  DOGE_USD: number;
  DOGE_RUB: number;
  XMR_USD: number;
  XMR_RUB: number;
  LTC_USD: number;
  LTC_RUB: number;
  SUI_USD: number;
  SUI_RUB: number;
  USD_RUB: number;  // USD to RUB rate
  EUR_USD: number;  // EUR to USD rate
  EUR_RUB: number;  // EUR to RUB rate
  lastUpdated: number;
}

// Map our currency codes to CoinGecko IDs
const COIN_GECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  XRP: 'ripple',
  BNB: 'binancecoin',
  SOL: 'solana',
  TRX: 'tron',
  DOGE: 'dogecoin',
  XMR: 'monero',
  LTC: 'litecoin',
  SUI: 'sui',
};

let cachedRates: CryptoRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

// Fallback API endpoints in case primary fails
const API_ENDPOINTS = [
  {
    name: 'CoinGecko',
    url: (ids: string) => `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,rub,eur`,
    parser: parseCoinGeckoData,
  },
];

/**
 * Parse CoinGecko API response
 */
function parseCoinGeckoData(data: CoinGeckoPrice): Partial<CryptoRates> {
  const usdRubRate = data.tether?.rub || 100;
  const eurUsdRate = data.bitcoin?.eur ? data.bitcoin.usd / data.bitcoin.eur : 1.09;
  const eurRubRate = eurUsdRate * usdRubRate;
  
  return {
    BTC_USD: data.bitcoin?.usd,
    BTC_RUB: data.bitcoin?.rub,
    ETH_USD: data.ethereum?.usd,
    ETH_RUB: data.ethereum?.rub,
    USDT_USD: data.tether?.usd,
    USDT_RUB: data.tether?.rub,
    USDC_USD: data['usd-coin']?.usd,
    USDC_RUB: data['usd-coin']?.rub,
    XRP_USD: data.ripple?.usd,
    XRP_RUB: data.ripple?.rub,
    BNB_USD: data.binancecoin?.usd,
    BNB_RUB: data.binancecoin?.rub,
    SOL_USD: data.solana?.usd,
    SOL_RUB: data.solana?.rub,
    TRX_USD: data.tron?.usd,
    TRX_RUB: data.tron?.rub,
    DOGE_USD: data.dogecoin?.usd,
    DOGE_RUB: data.dogecoin?.rub,
    XMR_USD: data.monero?.usd,
    XMR_RUB: data.monero?.rub,
    LTC_USD: data.litecoin?.usd,
    LTC_RUB: data.litecoin?.rub,
    SUI_USD: data.sui?.usd,
    SUI_RUB: data.sui?.rub,
    USD_RUB: usdRubRate,
    EUR_USD: eurUsdRate,
    EUR_RUB: eurRubRate,
  };
}

/**
 * Fetch real-time crypto prices from CoinGecko
 */
export async function fetchCryptoRates(): Promise<CryptoRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Using cached rates');
    return cachedRates;
  }
  
  // Try each API endpoint
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(`Trying ${endpoint.name} API...`);
      const coinIds = Object.values(COIN_GECKO_IDS).join(',');
      
      const response = await fetch(endpoint.url(coinIds), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`${endpoint.name} API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`${endpoint.name} API Response:`, data);
      
      const parsedRates = endpoint.parser(data);
      
      // Build complete rates object with defaults
      const rates: CryptoRates = {
        BTC_USD: parsedRates.BTC_USD || 95000,
        BTC_RUB: parsedRates.BTC_RUB || 9500000,
        ETH_USD: parsedRates.ETH_USD || 3500,
        ETH_RUB: parsedRates.ETH_RUB || 350000,
        USDT_USD: parsedRates.USDT_USD || 1.0,
        USDT_RUB: parsedRates.USDT_RUB || 100,
        USDC_USD: parsedRates.USDC_USD || 1.0,
        USDC_RUB: parsedRates.USDC_RUB || 100,
        XRP_USD: parsedRates.XRP_USD || 2.5,
        XRP_RUB: parsedRates.XRP_RUB || 250,
        BNB_USD: parsedRates.BNB_USD || 650,
        BNB_RUB: parsedRates.BNB_RUB || 65000,
        SOL_USD: parsedRates.SOL_USD || 200,
        SOL_RUB: parsedRates.SOL_RUB || 20000,
        TRX_USD: parsedRates.TRX_USD || 0.25,
        TRX_RUB: parsedRates.TRX_RUB || 25,
        DOGE_USD: parsedRates.DOGE_USD || 0.35,
        DOGE_RUB: parsedRates.DOGE_RUB || 35,
        XMR_USD: parsedRates.XMR_USD || 180,
        XMR_RUB: parsedRates.XMR_RUB || 18000,
        LTC_USD: parsedRates.LTC_USD || 110,
        LTC_RUB: parsedRates.LTC_RUB || 11000,
        SUI_USD: parsedRates.SUI_USD || 4.5,
        SUI_RUB: parsedRates.SUI_RUB || 450,
        USD_RUB: parsedRates.USD_RUB || 100,
        EUR_USD: parsedRates.EUR_USD || 1.09,
        EUR_RUB: parsedRates.EUR_RUB || 109,
        lastUpdated: now,
      };
      
      console.log('Successfully fetched rates:', rates);
      console.log('BTC to RUB rate:', rates.BTC_RUB);
      
      cachedRates = rates;
      lastFetchTime = now;
      
      return rates;
    } catch (error) {
      console.error(`${endpoint.name} API failed:`, error);
      // Continue to next endpoint
    }
  }
  
  // All APIs failed, use fallback
  console.error('All API endpoints failed, using fallback rates');
  
  // Return cached rates if available
  if (cachedRates) {
    console.log('Returning cached rates');
    return cachedRates;
  }
  
  // Use simulated realistic rates based on approximate market values
  const fallbackRates = generateFallbackRates(now);
  
  cachedRates = fallbackRates;
  lastFetchTime = now;
  
  return fallbackRates;
}

/**
 * Generate realistic fallback rates when API is unavailable
 */
function generateFallbackRates(timestamp: number): CryptoRates {
  // Approximate current market rates (update these periodically)
  const btcUsd = 95000 + (Math.random() - 0.5) * 2000; // ±1000 variation
  const ethUsd = 3500 + (Math.random() - 0.5) * 100;   // ±50 variation
  const usdRub = 100 + (Math.random() - 0.5) * 2;      // ±1 variation
  const eurUsd = 1.09;
  
  return {
    BTC_USD: Math.round(btcUsd),
    BTC_RUB: Math.round(btcUsd * usdRub),
    ETH_USD: Math.round(ethUsd),
    ETH_RUB: Math.round(ethUsd * usdRub),
    USDT_USD: 1.0,
    USDT_RUB: Math.round(usdRub * 100) / 100,
    USDC_USD: 1.0,
    USDC_RUB: Math.round(usdRub * 100) / 100,
    XRP_USD: 2.5,
    XRP_RUB: Math.round(2.5 * usdRub * 100) / 100,
    BNB_USD: 650,
    BNB_RUB: Math.round(650 * usdRub),
    SOL_USD: 200,
    SOL_RUB: Math.round(200 * usdRub),
    TRX_USD: 0.25,
    TRX_RUB: Math.round(0.25 * usdRub * 100) / 100,
    DOGE_USD: 0.35,
    DOGE_RUB: Math.round(0.35 * usdRub * 100) / 100,
    XMR_USD: 180,
    XMR_RUB: Math.round(180 * usdRub),
    LTC_USD: 110,
    LTC_RUB: Math.round(110 * usdRub),
    SUI_USD: 4.5,
    SUI_RUB: Math.round(4.5 * usdRub * 100) / 100,
    USD_RUB: Math.round(usdRub * 100) / 100,
    EUR_USD: eurUsd,
    EUR_RUB: Math.round(eurUsd * usdRub * 100) / 100,
    lastUpdated: timestamp,
  };
}

/**
 * Get exchange rate between two currencies
 * Now supports custom cryptocurrencies with CoinGecko IDs
 */
export async function calculateRateWithCustomCrypto(
  fromCode: string,
  toCode: string,
  fromCoinGeckoId?: string,
  toCoinGeckoId?: string
): Promise<number> {
  // Extract base currency codes (remove suffixes like _TRC20, _ERC20, etc.)
  const extractBaseCurrency = (code: string): string => {
    // Handle cases like USDT_TRC20, USDT_ERC20 -> USDT
    if (code.includes('_')) {
      const base = code.split('_')[0];
      // For payment methods like CARD_RUB, PAYEER_RUB -> use second part (RUB)
      if (['CARD', 'PAYEER', 'PM', 'ADV', 'CASH'].includes(base)) {
        return code.split('_')[1];
      }
      return base;
    }
    return code;
  };

  const fromBase = extractBaseCurrency(fromCode);
  const toBase = extractBaseCurrency(toCode);
  
  // Same currency
  if (fromBase === toBase) {
    return 1;
  }

  // If both currencies have CoinGecko IDs, fetch their prices
  if (fromCoinGeckoId && toCoinGeckoId) {
    try {
      const [fromPrice, toPrice] = await Promise.all([
        fetchCoinPrice(fromCoinGeckoId),
        fetchCoinPrice(toCoinGeckoId),
      ]);
      
      if (fromPrice && toPrice && fromPrice.usd > 0 && toPrice.usd > 0) {
        return fromPrice.usd / toPrice.usd;
      }
    } catch (error) {
      console.error('Error fetching custom crypto rates:', error);
    }
  }
  
  // If only fromCurrency has CoinGecko ID
  if (fromCoinGeckoId && !toCoinGeckoId) {
    try {
      const fromPrice = await fetchCoinPrice(fromCoinGeckoId);
      if (fromPrice) {
        if (toBase === 'USD') return fromPrice.usd;
        if (toBase === 'RUB') return fromPrice.rub;
      }
    } catch (error) {
      console.error('Error fetching from currency rate:', error);
    }
  }
  
  // If only toCurrency has CoinGecko ID
  if (!fromCoinGeckoId && toCoinGeckoId) {
    try {
      const toPrice = await fetchCoinPrice(toCoinGeckoId);
      if (toPrice) {
        if (fromBase === 'USD' && toPrice.usd > 0) return 1 / toPrice.usd;
        if (fromBase === 'RUB' && toPrice.rub > 0) return 1 / toPrice.rub;
      }
    } catch (error) {
      console.error('Error fetching to currency rate:', error);
    }
  }

  // Fall back to standard rate calculation with predefined rates
  const rates = await fetchCryptoRates();
  return calculateRate(rates, fromCode, toCode);
}

/**
 * Get exchange rate between two currencies (legacy function for predefined currencies)
 */
export function calculateRate(rates: CryptoRates, fromCode: string, toCode: string): number {
  // Extract base currency codes (remove suffixes like _TRC20, _ERC20, etc.)
  const extractBaseCurrency = (code: string): string => {
    // Handle cases like USDT_TRC20, USDT_ERC20 -> USDT
    if (code.includes('_')) {
      const base = code.split('_')[0];
      // For payment methods like CARD_RUB, PAYEER_RUB -> use second part (RUB)
      if (['CARD', 'PAYEER', 'PM', 'ADV', 'CASH'].includes(base)) {
        return code.split('_')[1];
      }
      return base;
    }
    return code;
  };

  const fromBase = extractBaseCurrency(fromCode);
  const toBase = extractBaseCurrency(toCode);
  
  // Same currency
  if (fromBase === toBase) {
    return 1;
  }

  // Try direct pair
  const pair = `${fromBase}_${toBase}` as keyof Omit<CryptoRates, 'lastUpdated'>;
  if (rates[pair]) {
    return rates[pair];
  }
  
  // Try reverse pair
  const reversePair = `${toBase}_${fromBase}` as keyof Omit<CryptoRates, 'lastUpdated'>;
  if (rates[reversePair]) {
    return 1 / rates[reversePair];
  }
  
  // Calculate through USD (most common case)
  const fromUSD = `${fromBase}_USD` as keyof Omit<CryptoRates, 'lastUpdated'>;
  const toUSD = `${toBase}_USD` as keyof Omit<CryptoRates, 'lastUpdated'>;
  
  if (rates[fromUSD] && rates[toUSD]) {
    // e.g., BTC to ETH: (BTC_USD / ETH_USD)
    return rates[fromUSD] / rates[toUSD];
  }
  
  // One currency is USD, calculate via the other's USD rate
  if (fromBase === 'USD' && rates[toUSD]) {
    return 1 / rates[toUSD];
  }
  if (toBase === 'USD' && rates[fromUSD]) {
    return rates[fromUSD];
  }

  // Calculate through RUB if both have RUB rates
  const fromRUB = `${fromBase}_RUB` as keyof Omit<CryptoRates, 'lastUpdated'>;
  const toRUB = `${toBase}_RUB` as keyof Omit<CryptoRates, 'lastUpdated'>;
  
  if (rates[fromRUB] && rates[toRUB]) {
    // e.g., BTC to RUB or RUB to BTC
    return rates[fromRUB] / rates[toRUB];
  }
  
  // One currency is RUB
  if (fromBase === 'RUB' && rates[toRUB]) {
    return 1 / rates[toRUB];
  }
  if (toBase === 'RUB' && rates[fromRUB]) {
    return rates[fromRUB];
  }
  
  // Cross-currency via USD and RUB
  if (fromBase === 'EUR' || toBase === 'EUR') {
    const eurUsd = rates.EUR_USD || 1.1;
    const eurRub = rates.EUR_RUB || 110;
    
    if (fromBase === 'EUR' && toBase === 'USD') {
      return eurUsd;
    }
    if (fromBase === 'USD' && toBase === 'EUR') {
      return 1 / eurUsd;
    }
    if (fromBase === 'EUR' && toBase === 'RUB') {
      return eurRub;
    }
    if (fromBase === 'RUB' && toBase === 'EUR') {
      return 1 / eurRub;
    }
  }
  
  // USD to/from RUB
  if ((fromBase === 'USD' && toBase === 'RUB') || (fromBase === 'RUB' && toBase === 'USD')) {
    const usdRub = rates.USD_RUB || rates.USDT_RUB || 100;
    return fromBase === 'USD' ? usdRub : 1 / usdRub;
  }
  
  // Default fallback
  console.warn(`No rate found for ${fromCode} to ${toCode}, using fallback`);
  return 1;
}

// ============================================================================
// CoinGecko Coins List and Details API
// ============================================================================

interface CoinsListCache {
  data: CoinGeckoSimpleCoin[];
  timestamp: number;
}

interface CoinDetailsCache {
  [coinId: string]: {
    data: CoinDetailsResponse;
    timestamp: number;
  };
}

let coinsListCache: CoinsListCache | null = null;
const coinDetailsCache: CoinDetailsCache = {};

const COINS_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const COIN_DETAILS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Map CoinGecko platform keys to internal network types
 */
function mapPlatformToNetwork(platform: string): CryptoNetwork | null {
  const mapping: Record<string, CryptoNetwork> = {
    'ethereum': 'ERC20',
    'tron': 'TRC20',
    'binance-smart-chain': 'BEP20',
    'bitcoin': 'BTC',
    'solana': 'Solana',
    'ripple': 'XRP',
    'litecoin': 'LTC',
    'dogecoin': 'DOGE',
    'monero': 'XMR',
    'sui': 'Sui',
  };
  return mapping[platform] || null;
}

/**
 * Fetch list of all cryptocurrencies from CoinGecko
 * Cached for 24 hours
 */
export async function fetchCoinsList(): Promise<CoinGeckoSimpleCoin[]> {
  const now = Date.now();
  
  // Return cached list if still valid
  if (coinsListCache && (now - coinsListCache.timestamp) < COINS_LIST_CACHE_DURATION) {
    console.log('Using cached coins list');
    return coinsListCache.data;
  }
  
  try {
    console.log('Fetching coins list from CoinGecko...');
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }
    
    const rawData: CoinGeckoCoin[] = await response.json();
    console.log(`Fetched ${rawData.length} coins from CoinGecko`);
    
    // Transform to simplified format
    const simplifiedData: CoinGeckoSimpleCoin[] = rawData.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      platforms: coin.platforms ? Object.keys(coin.platforms) : [],
    }));
    
    // Cache the result
    coinsListCache = {
      data: simplifiedData,
      timestamp: now,
    };
    
    return simplifiedData;
  } catch (error) {
    console.error('Failed to fetch coins list:', error);
    
    // Return cached data if available (even if stale)
    if (coinsListCache) {
      console.log('Returning stale cached coins list');
      return coinsListCache.data;
    }
    
    // Return empty array if no cache available
    return [];
  }
}

/**
 * Fetch detailed information for a specific coin
 * Cached for 1 hour
 */
export async function fetchCoinDetails(coinId: string): Promise<CoinDetailsResponse | null> {
  const now = Date.now();
  
  // Return cached details if still valid
  if (coinDetailsCache[coinId] && (now - coinDetailsCache[coinId].timestamp) < COIN_DETAILS_CACHE_DURATION) {
    console.log(`Using cached details for ${coinId}`);
    return coinDetailsCache[coinId].data;
  }
  
  try {
    console.log(`Fetching coin details for ${coinId}...`);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }
    
    const data: CoinGeckoCoinDetails = await response.json();
    console.log(`Fetched details for ${coinId}:`, data);
    
    // Extract platforms and map to networks
    const platforms = data.platforms ? Object.keys(data.platforms) : [];
    const networks: CryptoNetwork[] = platforms
      .map(mapPlatformToNetwork)
      .filter((n): n is CryptoNetwork => n !== null);
    
    // Determine decimals (default based on type)
    let decimals = 8; // Default for most crypto
    if (data.detail_platforms) {
      const platformValues = Object.values(data.detail_platforms);
      if (platformValues.length > 0 && platformValues[0].decimal_place !== undefined) {
        decimals = platformValues[0].decimal_place;
      }
    }
    // Override for known types
    if (platforms.includes('ethereum') || platforms.includes('binance-smart-chain')) {
      decimals = 18; // ERC20/BEP20 tokens typically use 18 decimals
    }
    if (data.symbol.toLowerCase() === 'usdt' || data.symbol.toLowerCase() === 'usdc') {
      decimals = 6; // Stablecoins typically use 6 decimals
    }
    
    // Get Russian name (will be handled by translation mapping)
    const nameRu = data.name; // Placeholder, will be translated by utility
    
    const coinDetails: CoinDetailsResponse = {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      nameRu,
      iconUrl: data.image?.large || data.image?.small || data.image?.thumb || '',
      decimals,
      currentPrice: {
        usd: data.market_data?.current_price?.usd || 0,
        rub: data.market_data?.current_price?.rub || 0,
      },
      platforms,
      networks,
    };
    
    // Cache the result
    coinDetailsCache[coinId] = {
      data: coinDetails,
      timestamp: now,
    };
    
    return coinDetails;
  } catch (error) {
    console.error(`Failed to fetch coin details for ${coinId}:`, error);
    
    // Return cached data if available (even if stale)
    if (coinDetailsCache[coinId]) {
      console.log(`Returning stale cached details for ${coinId}`);
      return coinDetailsCache[coinId].data;
    }
    
    return null;
  }
}

/**
 * Fetch current price for a specific cryptocurrency by CoinGecko ID
 * Returns prices in USD and RUB
 */
export async function fetchCoinPrice(coinGeckoId: string): Promise<{ usd: number; rub: number } | null> {
  try {
    console.log(`Fetching price for ${coinGeckoId}...`);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd,rub`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data[coinGeckoId]) {
      return {
        usd: data[coinGeckoId].usd || 0,
        rub: data[coinGeckoId].rub || 0,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ${coinGeckoId}:`, error);
    return null;
  }
}
