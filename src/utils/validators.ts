import { EMAIL_REGEX, TELEGRAM_REGEX, BTC_ADDRESS_REGEX, ETH_ADDRESS_REGEX } from './constants';

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length === 0) return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Validate Telegram username
 */
export function validateTelegram(username: string): boolean {
  if (!username) return true; // Optional field
  return TELEGRAM_REGEX.test(username);
}

/**
 * Validate amount
 */
export function validateAmount(
  amount: string,
  minAmount: number,
  maxAmount: number,
  reserve?: number
): { isValid: boolean; error?: string } {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Введите корректную сумму' };
  }
  
  if (numAmount < minAmount) {
    return { isValid: false, error: `Минимальная сумма: ${minAmount}` };
  }
  
  if (numAmount > maxAmount) {
    return { isValid: false, error: `Максимальная сумма: ${maxAmount}` };
  }
  
  if (reserve !== undefined && numAmount > reserve) {
    return { isValid: false, error: 'Недостаточный резерв' };
  }
  
  return { isValid: true };
}

/**
 * Validate Bitcoin address
 */
export function validateBTCAddress(address: string): boolean {
  if (!address) return false;
  return BTC_ADDRESS_REGEX.test(address);
}

/**
 * Validate Ethereum address
 */
export function validateETHAddress(address: string): boolean {
  if (!address) return false;
  return ETH_ADDRESS_REGEX.test(address);
}

/**
 * Address format patterns per cryptocurrency / network.
 * Each value is a list of accepted regexps (a coin may exist in several networks).
 */
const CRYPTO_ADDRESS_PATTERNS: Record<string, RegExp[]> = {
  // Bitcoin: legacy (1/3) + bech32 (bc1)
  BTC: [/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, /^bc1[a-z0-9]{25,59}$/],
  // EVM-совместимые сети
  ETH: [/^0x[a-fA-F0-9]{40}$/],
  BNB: [/^0x[a-fA-F0-9]{40}$/],
  // Tron
  TRX: [/^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  // Стейблкоины могут быть в нескольких сетях (ERC20/BEP20/TRC20)
  USDT: [/^0x[a-fA-F0-9]{40}$/, /^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  USDC: [/^0x[a-fA-F0-9]{40}$/, /^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  // Litecoin: legacy (L/M/3) + bech32 (ltc1)
  LTC: [/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/, /^ltc1[a-z0-9]{25,59}$/],
  // Dogecoin
  DOGE: [/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/],
  // XRP / Ripple
  XRP: [/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/],
  // Solana (base58, 32-44 символа)
  SOL: [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/],
  // Monero
  XMR: [/^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/],
  // Sui (0x + 64 hex)
  SUI: [/^0x[a-fA-F0-9]{64}$/],
};

/**
 * Map a network name to the address pattern it uses.
 */
const NETWORK_ADDRESS_PATTERNS: Record<string, RegExp[]> = {
  ERC20: [/^0x[a-fA-F0-9]{40}$/],
  BEP20: [/^0x[a-fA-F0-9]{40}$/],
  TRC20: [/^T[1-9A-HJ-NP-Za-km-z]{33}$/],
  ETH: [/^0x[a-fA-F0-9]{40}$/],
  BTC: [/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, /^bc1[a-z0-9]{25,59}$/],
  LTC: [/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/, /^ltc1[a-z0-9]{25,59}$/],
  DOGE: [/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/],
  XRP: [/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/],
  Solana: [/^[1-9A-HJ-NP-Za-km-z]{32,44}$/],
  XMR: [/^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/],
  Sui: [/^0x[a-fA-F0-9]{64}$/],
};

/**
 * Validate crypto wallet address based on currency and (optionally) network.
 * If the address format for a currency is unknown, falls back to a generic
 * sanity check so that legitimate orders are never blocked.
 */
export function validateCryptoAddress(
  address: string,
  currencyCode: string,
  network?: string
): boolean {
  const value = address?.trim();
  if (!value) return false;

  // Адрес не должен содержать пробелов
  if (/\s/.test(value)) return false;

  // Если задана конкретная сеть — проверяем по её формату
  const networkPatterns = network ? NETWORK_ADDRESS_PATTERNS[network] : undefined;
  if (networkPatterns) {
    return networkPatterns.some((re) => re.test(value));
  }

  const patterns = CRYPTO_ADDRESS_PATTERNS[currencyCode?.toUpperCase()];
  if (patterns) {
    return patterns.some((re) => re.test(value));
  }

  // Неизвестная валюта — базовая проверка, чтобы не блокировать заявку
  return value.length >= 10 && /^[a-zA-Z0-9:]+$/.test(value);
}

export type CryptoAddressErrorCode = 'empty' | 'spaces' | 'invalid';

/**
 * Validate a crypto address and return an error code (locale-agnostic).
 * The caller is responsible for mapping the code to a localized message.
 * Returns undefined when the address is valid.
 */
export function getCryptoAddressError(
  address: string,
  currencyCode: string,
  network?: string
): CryptoAddressErrorCode | undefined {
  const value = address?.trim();
  if (!value) {
    return 'empty';
  }
  if (/\s/.test(value)) {
    return 'spaces';
  }
  if (!validateCryptoAddress(value, currencyCode, network)) {
    return 'invalid';
  }
  return undefined;
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{16,19}$/.test(sanitized)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate e-wallet account number
 */
export function validateEWallet(account: string, type: string): boolean {
  if (!account) return false;
  
  switch (type) {
    case 'PAYEER':
      return /^P\d{7,}$/.test(account);
    case 'PERFECT_MONEY':
      return /^U\d{7,}$/.test(account);
    case 'ADVCASH':
      return /^[A-Z0-9@.]+$/.test(account);
    default:
      return account.length > 5;
  }
}
