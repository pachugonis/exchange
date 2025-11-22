// Telegram Bot Integration Types

export interface TelegramUser {
  telegramId: string;
  userId?: string; // Platform user ID reference
  chatId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
  linkedAt: number;
  isActive: boolean;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  accountAlerts: boolean;
  promotional: boolean;
  quietHoursStart?: number; // Hour (0-23)
  quietHoursEnd?: number; // Hour (0-23)
  verbosity: 'minimal' | 'normal' | 'detailed';
}

export interface BotSession {
  sessionId: string;
  telegramId: string;
  currentFlow?: ConversationFlow;
  flowStep: number;
  contextData: Record<string, any>;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  isAuthenticated: boolean;
  userId?: string;
}

export type ConversationFlow = 
  | 'exchange'
  | 'register'
  | 'login'
  | 'kyc'
  | 'profile_edit'
  | 'order_track'
  | 'review'
  | 'favorites'
  | 'promo'
  | 'admin_order'
  | 'admin_user'
  | 'admin_kyc'
  | 'admin_currency'
  | 'admin_promo';

export interface MessageQueue {
  messageId: string;
  telegramId: string;
  chatId: string;
  messageType: NotificationType;
  content: MessageContent;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  scheduledAt: number;
  sentAt?: number;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export type NotificationType = 
  | 'order_created'
  | 'order_status_update'
  | 'order_completed'
  | 'order_cancelled'
  | 'payment_received'
  | 'kyc_submitted'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'registration_success'
  | 'email_verification'
  | 'security_alert'
  | 'promo_available'
  | 'admin_alert';

export interface MessageContent {
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: InlineKeyboard;
  disableWebPagePreview?: boolean;
}

export interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface BotCommand {
  command: string;
  description: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  handler: string; // Handler function name
}

export interface CallbackQuery {
  id: string;
  from: TelegramUserInfo;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUserInfo;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
}

export interface TelegramUserInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

// Exchange Flow Context
export interface ExchangeFlowContext {
  fromCurrencyCode?: string;
  toCurrencyCode?: string;
  amount?: number;
  calculation?: {
    rate: number;
    commission: number;
    toAmount: number;
  };
  email?: string;
  telegram?: string;
  fromWallet?: string;
  toWallet?: string;
  network?: string;
  promoCode?: string;
  termsAccepted?: boolean;
  amlAccepted?: boolean;
}

// Registration Flow Context
export interface RegisterFlowContext {
  email?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
}

// Login Flow Context
export interface LoginFlowContext {
  email?: string;
  password?: string;
  twoFactorCode?: string;
  requires2FA?: boolean;
}

// KYC Flow Context
export interface KYCFlowContext {
  level?: 1 | 2 | 3;
  fullName?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  documentType?: string;
  documentNumber?: string;
  uploadedDocuments?: string[]; // file_ids
}

// Admin Order Management Context
export interface AdminOrderContext {
  orderId?: string;
  newStatus?: string;
  note?: string;
  refundReason?: string;
}

// Bot Statistics
export interface BotStatistics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  messagesSent: number;
  messagesReceived: number;
  commandsProcessed: number;
  errorsCount: number;
  averageResponseTime: number;
  lastUpdated: number;
}
