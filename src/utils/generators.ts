/**
 * Generate unique order ID
 * Format: EX-YYYYMMDD-XXXXXX
 */
export function generateOrderId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `EX-${year}${month}${day}-${randomPart}`;
}

/**
 * Generate random number in range
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer in range
 */
export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/**
 * Generate mock payment address for crypto
 */
export function generateCryptoAddress(currencyCode: string): string {
  switch (currencyCode) {
    case 'BTC':
      return '1' + generateRandomString(33, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
    case 'ETH':
    case 'USDT':
    case 'USDC':
      return '0x' + generateRandomString(40, '0123456789abcdef');
    default:
      return generateRandomString(34, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }
}

/**
 * Generate random string from character set
 */
function generateRandomString(length: number, chars: string): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
