/**
 * Format number with thousand separators (space) and decimal comma
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value
    .toFixed(decimals)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format currency amount with proper decimals and symbol
 */
export function formatCurrency(amount: number, symbol: string = '₽', decimals: number = 2): string {
  const formatted = formatNumber(amount, decimals);
  return `${formatted} ${symbol}`;
}

/**
 * Format crypto amount with up to 8 decimals, removing trailing zeros
 */
export function formatCrypto(amount: number, code: string): string {
  const formatted = amount.toFixed(8).replace(/\.?0+$/, '');
  return `${formatted} ${code}`;
}

/**
 * Format date to DD.MM.YYYY
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format time to HH:MM
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format relative time (e.g., "5 минут назад", "вчера")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'только что';
  if (minutes < 60) return `${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')} назад`;
  if (hours < 24) return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`;
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`;
  
  return formatDate(timestamp);
}

/**
 * Pluralize Russian words
 */
function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/**
 * Format order ID for display
 */
export function formatOrderId(id: string): string {
  return id.toUpperCase();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
