import type { ExchangeRate } from '../types';

// Base rates (constantly updated in real app)
const baseRates: Record<string, number> = {
  'BTC_USD': 45230.50,
  'BTC_RUB': 4125000,
  'ETH_USD': 2450.75,
  'ETH_RUB': 223500,
  'USDT_RUB': 91.20,
  'USDT_USD': 1.00,
  'USDC_USD': 1.00,
  'USDC_RUB': 91.15,
};

export function getExchangeRate(fromCode: string, toCode: string): number {
  const pair = `${fromCode}_${toCode}`;
  
  // Direct pair
  if (baseRates[pair]) {
    return baseRates[pair];
  }
  
  // Reverse pair
  const reversePair = `${toCode}_${fromCode}`;
  if (baseRates[reversePair]) {
    return 1 / baseRates[reversePair];
  }
  
  // Through USD
  const fromUSD = `${fromCode}_USD`;
  const toUSD = `${toCode}_USD`;
  
  if (baseRates[fromUSD] && baseRates[toUSD]) {
    return baseRates[fromUSD] / baseRates[toUSD];
  }
  
  // Default fallback
  return 1;
}

export function generateMockRates(): ExchangeRate[] {
  const rates: ExchangeRate[] = [];
  const now = Date.now();
  
  for (const [pair, rate] of Object.entries(baseRates)) {
    rates.push({
      pair,
      rate,
      timestamp: now,
      change24h: Math.random() * 10 - 5, // -5% to +5%
      direction: Math.random() > 0.5 ? 'up' : 'down',
    });
  }
  
  return rates;
}
