// Telegram Bot Configuration and Constants

import type { BotCommand } from '../types/telegram';

// Bot Configuration
// Note: These values should be configured when deploying the bot server
// For development, you can set them directly here or use a .env file in the bot server
export const BOT_CONFIG = {
  // Bot token should be set when initializing the bot
  // Get it from @BotFather on Telegram
  BOT_TOKEN: '',
  
  // Webhook configuration (optional, use polling for development)
  WEBHOOK_URL: '',
  WEBHOOK_PORT: 8443,
  
  // Session configuration
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Message queue configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  QUEUE_POLL_INTERVAL: 1000, // 1 second
  
  // Rate limiting
  MAX_MESSAGES_PER_MINUTE: 30,
  
  // File upload limits
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  
  // Order configuration
  ORDER_EXPIRY_MINUTES: 15,
};

// User Commands
export const USER_COMMANDS: BotCommand[] = [
  {
    command: '/start',
    description: 'Start bot and show welcome message',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handleStart',
  },
  {
    command: '/menu',
    description: 'Display main menu',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handleMenu',
  },
  {
    command: '/exchange',
    description: 'Start new currency exchange',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleExchange',
  },
  {
    command: '/orders',
    description: 'View your order history',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleOrders',
  },
  {
    command: '/track',
    description: 'Track specific order',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handleTrack',
  },
  {
    command: '/profile',
    description: 'View and edit profile',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleProfile',
  },
  {
    command: '/kyc',
    description: 'Start KYC verification',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleKYC',
  },
  {
    command: '/favorites',
    description: 'Manage favorite exchange directions',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleFavorites',
  },
  {
    command: '/promo',
    description: 'View and apply promo codes',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handlePromo',
  },
  {
    command: '/reviews',
    description: 'Browse exchange reviews',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handleReviews',
  },
  {
    command: '/support',
    description: 'Contact support',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handleSupport',
  },
  {
    command: '/settings',
    description: 'Configure bot preferences',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleSettings',
  },
  {
    command: '/logout',
    description: 'End session and logout',
    requiresAuth: true,
    requiresAdmin: false,
    handler: 'handleLogout',
  },
  {
    command: '/help',
    description: 'Display help information',
    requiresAuth: false,
    requiresAdmin: false,
    handler: 'handleHelp',
  },
];

// Admin Commands
export const ADMIN_COMMANDS: BotCommand[] = [
  {
    command: '/admin',
    description: 'Open admin panel',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdmin',
  },
  {
    command: '/admin_orders',
    description: 'Manage orders',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminOrders',
  },
  {
    command: '/admin_users',
    description: 'User management',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminUsers',
  },
  {
    command: '/admin_kyc',
    description: 'KYC review queue',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminKYC',
  },
  {
    command: '/admin_currencies',
    description: 'Currency settings',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminCurrencies',
  },
  {
    command: '/admin_promos',
    description: 'Promo management',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminPromos',
  },
  {
    command: '/admin_reviews',
    description: 'Review moderation',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminReviews',
  },
  {
    command: '/admin_stats',
    description: 'View statistics',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminStats',
  },
  {
    command: '/admin_settings',
    description: 'Platform configuration',
    requiresAuth: true,
    requiresAdmin: true,
    handler: 'handleAdminSettings',
  },
];

// Callback data prefixes for inline keyboards
export const CALLBACK_PREFIX = {
  // Authentication
  REGISTER: 'reg_',
  LOGIN: 'login_',
  LOGOUT: 'logout_',
  
  // Exchange
  SELECT_FROM_CURRENCY: 'from_',
  SELECT_TO_CURRENCY: 'to_',
  CONFIRM_EXCHANGE: 'confirm_ex_',
  CANCEL_EXCHANGE: 'cancel_ex_',
  MODIFY_EXCHANGE: 'modify_ex_',
  
  // Orders
  VIEW_ORDER: 'order_',
  CANCEL_ORDER: 'cancel_ord_',
  TRACK_ORDER: 'track_',
  PAYMENT_SENT: 'paid_',
  
  // KYC
  START_KYC: 'kyc_',
  KYC_LEVEL: 'kyc_lvl_',
  
  // Favorites
  ADD_FAVORITE: 'fav_add_',
  REMOVE_FAVORITE: 'fav_rem_',
  USE_FAVORITE: 'fav_use_',
  
  // Promo
  APPLY_PROMO: 'promo_',
  
  // Reviews
  SUBMIT_REVIEW: 'review_',
  RATING: 'rate_',
  
  // Navigation
  MAIN_MENU: 'menu_main',
  BACK: 'back_',
  CANCEL: 'cancel',
  
  // Admin
  ADMIN_ORDER_STATUS: 'adm_ord_st_',
  ADMIN_ORDER_VIEW: 'adm_ord_v_',
  ADMIN_USER_VIEW: 'adm_usr_',
  ADMIN_USER_BAN: 'adm_ban_',
  ADMIN_KYC_APPROVE: 'adm_kyc_app_',
  ADMIN_KYC_REJECT: 'adm_kyc_rej_',
  ADMIN_REVIEW_PUBLISH: 'adm_rev_pub_',
  ADMIN_REVIEW_HIDE: 'adm_rev_hide_',
};

// Message templates
export const MESSAGES = {
  WELCOME_NEW: `Welcome to ExchangeKit Exchange Bot! 🚀

I'm your personal assistant for cryptocurrency exchanges. With me, you can:

✓ Exchange crypto and fiat currencies
✓ Track your orders in real-time
✓ Manage your account
✓ Get instant support

Let's get started! Please choose an option:`,

  WELCOME_BACK: (name: string) => `Welcome back, ${name}! 👋

What would you like to do today?`,

  EXCHANGE_CALCULATION: (data: {
    fromAmount: number;
    fromCurrency: string;
    toAmount: number;
    toCurrency: string;
    rate: number;
    commission: number;
    reserve: number;
    expiryMinutes: number;
  }) => `💱 Exchange Details:

FROM: ${data.fromAmount} ${data.fromCurrency}
TO: ${data.toAmount} ${data.toCurrency}

Rate: 1 ${data.fromCurrency} = ${data.rate} ${data.toCurrency}
Commission: ${data.commission}%
You will receive: ${data.toAmount} ${data.toCurrency}

Reserve available: ${data.reserve} ${data.toCurrency}
⏱ Rate valid for: ${data.expiryMinutes} minutes`,

  ORDER_CREATED: (orderId: string, amount: number, currency: string, wallet: string, network?: string) => `✅ Order #${orderId} created successfully!

Status: Waiting for payment
Amount to send: ${amount} ${currency}

Payment address:
\`${wallet}\`
${network ? `\nNetwork: ${network}` : ''}

⚠️ Important:
• Send exact amount shown
• Payment expires in 15 minutes
• Confirm transaction after payment`,

  ORDER_STATUS_UPDATE: (orderId: string, oldStatus: string, newStatus: string, message?: string) => `📢 Order #${orderId} status updated

Previous: ${oldStatus}
Current: ${newStatus}

${message || ''}`,

  KYC_APPROVED: (level: number, dailyLimit: number, monthlyLimit: number) => `🎉 Congratulations! Your KYC verification has been approved.

Level: ${level}
New Limits:
• Daily: ${dailyLimit}
• Monthly: ${monthlyLimit}

You can now enjoy higher transaction limits!`,

  KYC_REJECTED: (reason: string) => `❌ KYC Verification Rejected

Reason: ${reason}

Please correct the issues and resubmit your documents.`,

  ERROR_AUTH_REQUIRED: 'This command requires authentication. Please /start and login or register.',
  
  ERROR_ADMIN_REQUIRED: 'This command is only available for administrators.',
  
  ERROR_INVALID_INPUT: (field: string, example: string) => `Invalid ${field}. Example: ${example}`,
  
  ERROR_SYSTEM: 'An error occurred. Please try again later or contact support.',
  
  HELP_TEXT: `📚 Available Commands:

/exchange - Start new currency exchange
/orders - View your order history
/track - Track specific order by ID
/profile - View and edit your profile
/kyc - Start KYC verification
/favorites - Manage favorite directions
/promo - View and apply promo codes
/reviews - Browse exchange reviews
/settings - Configure bot preferences
/support - Contact support
/logout - End session
/help - Show this help message

Need assistance? Just type your question!`,
};

// Order status translations
export const ORDER_STATUS_TEXT: Record<string, string> = {
  waiting_payment: '⏳ Waiting for Payment',
  payment_pending: '🔄 Payment Pending',
  payment_received: '✅ Payment Received',
  verification: '🔍 Verification',
  sending: '📤 Sending',
  completed: '✅ Completed',
  cancelled: '❌ Cancelled',
  refund: '↩️ Refund',
};

// KYC status translations
export const KYC_STATUS_TEXT: Record<string, string> = {
  none: '❌ Not Verified',
  pending: '⏳ Pending Review',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
};

// Emoji helpers
export const EMOJI = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  MONEY: '💰',
  EXCHANGE: '💱',
  PROFILE: '👤',
  SETTINGS: '⚙️',
  STAR: '⭐',
  HEART: '❤️',
  LOCK: '🔒',
  KEY: '🔑',
  CHART: '📊',
  BELL: '🔔',
  MAIL: '✉️',
  PHONE: '📱',
  DOCUMENT: '📄',
  PHOTO: '📷',
};
