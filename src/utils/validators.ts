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
 * Validate crypto wallet address based on currency
 */
export function validateCryptoAddress(address: string, currencyCode: string): boolean {
  if (!address) return false;
  
  switch (currencyCode) {
    case 'BTC':
      return validateBTCAddress(address);
    case 'ETH':
    case 'USDT':
    case 'USDC':
      return validateETHAddress(address);
    default:
      return address.length > 10; // Generic validation
  }
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
