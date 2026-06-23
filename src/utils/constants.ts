// Application constants
export const APP_NAME = 'ExchangeKit';
export const SUPPORT_EMAIL = 'support@exchangekit.io';
export const SUPPORT_TELEGRAM = '@exchangekit_support';

// Exchange constants
export const DEFAULT_COMMISSION = 0.02; // 2%
export const RATE_RESERVE_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
export const RATE_UPDATE_INTERVAL = 30 * 1000; // 30 seconds
export const STATUS_POLL_INTERVAL = 10 * 1000; // 10 seconds

// Окно на оплату заявки: если перевод не поступит за это время — заявка отменяется
export const PAYMENT_WINDOW = 30 * 60 * 1000; // 30 minutes in milliseconds
// Как часто опрашивать блокчейн на предмет поступления оплаты
export const PAYMENT_CHECK_INTERVAL = 30 * 1000; // 30 seconds

// Validation constants
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TELEGRAM_REGEX = /^@[a-zA-Z0-9_]{5,32}$/;
export const BTC_ADDRESS_REGEX = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
export const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Promocodes
export const PROMO_CODES = {
  WELCOME10: { discount: 0.1, description: 'Скидка 10% на комиссию' },
  CRYPTO5: { discount: 0.05, description: 'Скидка 5% для крипто-обменов' },
} as const;

// Stats
export const INITIAL_EXCHANGES_COUNT = 15742;
export const ONLINE_OPERATORS_MIN = 2;
export const ONLINE_OPERATORS_MAX = 5;
export const AVERAGE_RESPONSE_TIME = '2-5 минут';

// API simulation
export const API_DELAY_MIN = 300;
export const API_DELAY_MAX = 1000;
export const API_ERROR_PROBABILITY = 0.05; // 5%

// Status progression timing (in milliseconds)
export const STATUS_PROGRESSION_DELAYS = {
  payment_pending: { min: 5000, max: 15000 }, // 5-15 seconds
  payment_received: { min: 10000, max: 20000 }, // 10-20 seconds
  verification: { min: 15000, max: 30000 }, // 15-30 seconds
  sending: { min: 20000, max: 40000 }, // 20-40 seconds
  completed: { min: 5000, max: 10000 }, // 5-10 seconds
} as const;
