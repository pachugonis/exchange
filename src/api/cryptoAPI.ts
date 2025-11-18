/**
 * Real-time cryptocurrency rates API
 * Uses CoinGecko public API
 */

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    rub: number;
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
  lastUpdated: number;
}

// Map our currency codes to CoinGecko IDs
const COIN_GECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
};

let cachedRates: CryptoRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Fetch real-time crypto prices from CoinGecko
 */
export async function fetchCryptoRates(): Promise<CryptoRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }
  
  try {
    const coinIds = Object.values(COIN_GECKO_IDS).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd,rub&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto rates');
    }
    
    const data: CoinGeckoPrice = await response.json();
    
    // Map response to our rate structure
    const rates: CryptoRates = {
      BTC_USD: data.bitcoin?.usd || 0,
      BTC_RUB: data.bitcoin?.rub || 0,
      ETH_USD: data.ethereum?.usd || 0,
      ETH_RUB: data.ethereum?.rub || 0,
      USDT_USD: data.tether?.usd || 1.0,
      USDT_RUB: data.tether?.rub || 0,
      USDC_USD: data['usd-coin']?.usd || 1.0,
      USDC_RUB: data['usd-coin']?.rub || 0,
      lastUpdated: now,
    };
    
    cachedRates = rates;
    lastFetchTime = now;
    
    return rates;
  } catch (error) {
    console.error('Error fetching crypto rates:', error);
    
    // Return fallback rates if API fails
    if (cachedRates) {
      return cachedRates;
    }
    
    // Default fallback rates
    return {
      BTC_USD: 45000,
      BTC_RUB: 4100000,
      ETH_USD: 2400,
      ETH_RUB: 220000,
      USDT_USD: 1.0,
      USDT_RUB: 91,
      USDC_USD: 1.0,
      USDC_RUB: 91,
      lastUpdated: now,
    };
  }
}

/**
 * Get exchange rate between two currencies
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
  
  // Calculate through USD
  const fromUSD = `${fromBase}_USD` as keyof Omit<CryptoRates, 'lastUpdated'>;
  const toUSD = `${toBase}_USD` as keyof Omit<CryptoRates, 'lastUpdated'>;
  
  if (rates[fromUSD] && rates[toUSD]) {
    return rates[fromUSD] / rates[toUSD];
  }

  // If one is USD and other has rate to RUB, calculate via RUB
  if (fromBase === 'USD' || toBase === 'USD') {
    const otherBase = fromBase === 'USD' ? toBase : fromBase;
    const otherToRub = `${otherBase}_RUB` as keyof Omit<CryptoRates, 'lastUpdated'>;
    const usdToRub = rates.USDT_RUB; // Use USDT as proxy for USD/RUB
    
    if (rates[otherToRub] && usdToRub) {
      if (fromBase === 'USD') {
        // USD to other: USD->RUB->other
        return usdToRub / rates[otherToRub];
      } else {
        // other to USD: other->RUB->USD
        return rates[otherToRub] / usdToRub;
      }
    }
  }

  // Calculate through RUB if both have RUB rates
  const fromRUB = `${fromBase}_RUB` as keyof Omit<CryptoRates, 'lastUpdated'>;
  const toRUB = `${toBase}_RUB` as keyof Omit<CryptoRates, 'lastUpdated'>;
  
  if (rates[fromRUB] && rates[toRUB]) {
    return rates[fromRUB] / rates[toRUB];
  }
  
  // Default fallback
  return 1;
}
