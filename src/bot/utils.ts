// Telegram Bot Utility Functions

import type { InlineKeyboard, InlineKeyboardButton } from '../types/telegram';

/**
 * Create inline keyboard with buttons
 */
export function createInlineKeyboard(buttons: InlineKeyboardButton[][]): InlineKeyboard {
  return {
    inline_keyboard: buttons,
  };
}

/**
 * Create a button row
 */
export function createButtonRow(...buttons: InlineKeyboardButton[]): InlineKeyboardButton[] {
  return buttons;
}

/**
 * Create a callback button
 */
export function callbackButton(text: string, data: string): InlineKeyboardButton {
  return { text, callback_data: data };
}

/**
 * Create a URL button
 */
export function urlButton(text: string, url: string): InlineKeyboardButton {
  return { text, url };
}

/**
 * Format currency amount for display
 */
export function formatCurrencyAmount(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format date for Telegram messages
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Escape special characters for Markdown
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Split long message into chunks
 */
export function splitMessage(text: string, maxLength: number = 4096): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  const lines = text.split('\n');
  for (const line of lines) {
    if ((currentChunk + line + '\n').length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // If a single line is too long, split it by words
      if (line.length > maxLength) {
        const words = line.split(' ');
        for (const word of words) {
          if ((currentChunk + word + ' ').length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = word + ' ';
          } else {
            currentChunk += word + ' ';
          }
        }
      } else {
        currentChunk = line + '\n';
      }
    } else {
      currentChunk += line + '\n';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate telegram username
 */
export function isValidTelegramUsername(username: string): boolean {
  return /^@?[a-zA-Z0-9_]{5,32}$/.test(username);
}

/**
 * Extract order ID from text
 */
export function extractOrderId(text: string): string | null {
  const match = text.match(/ORD-[A-Z0-9]+/i);
  return match ? match[0] : null;
}

/**
 * Generate pagination keyboard
 */
export function createPaginationKeyboard(
  currentPage: number,
  totalPages: number,
  callbackPrefix: string
): InlineKeyboard {
  const buttons: InlineKeyboardButton[][] = [];
  const row: InlineKeyboardButton[] = [];

  if (currentPage > 1) {
    row.push(callbackButton('« Previous', `${callbackPrefix}${currentPage - 1}`));
  }

  row.push(callbackButton(`${currentPage}/${totalPages}`, 'noop'));

  if (currentPage < totalPages) {
    row.push(callbackButton('Next »', `${callbackPrefix}${currentPage + 1}`));
  }

  if (row.length > 0) {
    buttons.push(row);
  }

  return createInlineKeyboard(buttons);
}

/**
 * Create currency selection keyboard
 */
export function createCurrencyKeyboard(
  currencies: Array<{ code: string; name: string }>,
  callbackPrefix: string,
  columns: number = 3
): InlineKeyboard {
  const buttons: InlineKeyboardButton[][] = [];
  let currentRow: InlineKeyboardButton[] = [];

  for (let i = 0; i < currencies.length; i++) {
    const currency = currencies[i];
    currentRow.push(callbackButton(
      currency.code,
      `${callbackPrefix}${currency.code}`
    ));

    if ((i + 1) % columns === 0 || i === currencies.length - 1) {
      buttons.push([...currentRow]);
      currentRow = [];
    }
  }

  return createInlineKeyboard(buttons);
}

/**
 * Create main menu keyboard
 */
export function createMainMenuKeyboard(isAuthenticated: boolean): InlineKeyboard {
  const buttons: InlineKeyboardButton[][] = [];

  if (isAuthenticated) {
    buttons.push([
      callbackButton('💱 Exchange', 'cmd_exchange'),
      callbackButton('📋 My Orders', 'cmd_orders'),
    ]);
    buttons.push([
      callbackButton('👤 Profile', 'cmd_profile'),
      callbackButton('⭐ Favorites', 'cmd_favorites'),
    ]);
    buttons.push([
      callbackButton('🎫 Promo Codes', 'cmd_promo'),
      callbackButton('💬 Reviews', 'cmd_reviews'),
    ]);
    buttons.push([
      callbackButton('⚙️ Settings', 'cmd_settings'),
      callbackButton('❓ Help', 'cmd_help'),
    ]);
  } else {
    buttons.push([
      callbackButton('🚀 Register', 'auth_register'),
      callbackButton('🔑 Login', 'auth_login'),
    ]);
    buttons.push([
      callbackButton('📊 Track Order', 'cmd_track'),
      callbackButton('💬 Reviews', 'cmd_reviews'),
    ]);
    buttons.push([
      callbackButton('❓ Help', 'cmd_help'),
    ]);
  }

  return createInlineKeyboard(buttons);
}

/**
 * Create rating keyboard
 */
export function createRatingKeyboard(): InlineKeyboard {
  return createInlineKeyboard([
    [
      callbackButton('⭐', 'rate_1'),
      callbackButton('⭐⭐', 'rate_2'),
      callbackButton('⭐⭐⭐', 'rate_3'),
      callbackButton('⭐⭐⭐⭐', 'rate_4'),
      callbackButton('⭐⭐⭐⭐⭐', 'rate_5'),
    ],
    [callbackButton('❌ Cancel', 'cancel')],
  ]);
}

/**
 * Create yes/no confirmation keyboard
 */
export function createConfirmKeyboard(yesData: string, noData: string = 'cancel'): InlineKeyboard {
  return createInlineKeyboard([
    [
      callbackButton('✅ Yes', yesData),
      callbackButton('❌ No', noData),
    ],
  ]);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) return 'Expired';

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Parse callback data
 */
export function parseCallbackData(data: string): { prefix: string; value: string } {
  const match = data.match(/^([a-z_]+)(.*)$/i);
  if (!match) return { prefix: '', value: data };
  
  const prefix = match[1];
  const value = match[2];
  
  return { prefix, value };
}

/**
 * Check if user can perform action (rate limiting)
 */
export function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number,
  storage: Map<string, number[]>
): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const timestamps = storage.get(key) || [];

  // Remove timestamps outside the window
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  storage.set(key, validTimestamps);
  return true;
}
