// User Command Handlers for Telegram Bot

import type { TelegramMessage, BotSession } from '../../types/telegram';
import { useTelegramStore } from '../../store/telegramStore';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useReviewStore } from '../../store/reviewStore';
import { MESSAGES, ORDER_STATUS_TEXT } from '../config';
import { createMainMenuKeyboard, createInlineKeyboard, callbackButton, formatDate, truncate } from '../utils';

/**
 * Handle /start command
 */
export async function handleStart(message: TelegramMessage, _session: BotSession) {
  const telegramStore = useTelegramStore.getState();
  const userStore = useUserStore.getState();
  
  const telegramId = String(message.from?.id);
  const telegramUser = telegramStore.getTelegramUser(telegramId);
  
  let responseText: string;
  let keyboard;

  if (telegramUser?.userId) {
    // User is linked and logged in
    const platformUser = userStore.user;
    const userName = platformUser?.name || telegramUser.firstName;
    responseText = MESSAGES.WELCOME_BACK(userName);
    keyboard = createMainMenuKeyboard(true);
  } else {
    // New or unlinked user
    responseText = MESSAGES.WELCOME_NEW;
    keyboard = createMainMenuKeyboard(false);
  }

  return {
    text: responseText,
    replyMarkup: keyboard,
  };
}

/**
 * Handle /menu command
 */
export async function handleMenu(_message: TelegramMessage, session: BotSession) {
  const keyboard = createMainMenuKeyboard(session.isAuthenticated);

  return {
    text: '📱 Main Menu\n\nChoose an option:',
    replyMarkup: keyboard,
  };
}

/**
 * Handle /orders command
 */
export async function handleOrders(_message: TelegramMessage, session: BotSession) {
  if (!session.userId) {
    return {
      text: MESSAGES.ERROR_AUTH_REQUIRED,
    };
  }

  const orderStore = useOrderStore.getState();
  const userOrders = orderStore.getOrdersByUserId(session.userId);

  if (userOrders.length === 0) {
    return {
      text: '📋 You have no orders yet.\n\nStart your first exchange with /exchange',
      replyMarkup: createInlineKeyboard([
        [callbackButton('💱 Start Exchange', 'cmd_exchange')],
        [callbackButton('🏠 Main Menu', 'menu_main')],
      ]),
    };
  }

  // Show recent orders
  const recentOrders = userOrders
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

  let text = '📋 Your Recent Orders:\n\n';

  for (const order of recentOrders) {
    const status = ORDER_STATUS_TEXT[order.status] || order.status;
    const date = formatDate(order.createdAt);
    const amount = `${order.fromAmount} ${order.fromCurrency.code} → ${order.toAmount} ${order.toCurrency.code}`;
    
    text += `Order #${order.id}\n`;
    text += `${amount}\n`;
    text += `Status: ${status}\n`;
    text += `Date: ${date}\n\n`;
  }

  const buttons: any[][] = [];
  for (const order of recentOrders.slice(0, 5)) {
    buttons.push([callbackButton(`View #${order.id}`, `order_${order.id}`)]);
  }
  buttons.push([callbackButton('🏠 Main Menu', 'menu_main')]);

  return {
    text: text.trim(),
    replyMarkup: createInlineKeyboard(buttons),
  };
}

/**
 * Handle /track command
 */
export async function handleTrack(message: TelegramMessage, session: BotSession) {
  const telegramStore = useTelegramStore.getState();

  // Check if order ID is provided in the message
  const orderIdMatch = message.text?.match(/ORD-[A-Z0-9]+/i);

  if (!orderIdMatch) {
    telegramStore.startFlow(session.sessionId, 'order_track');
    return {
      text: '🔍 Track Order\n\nPlease enter your order ID (e.g., ORD-ABC123):',
      replyMarkup: createInlineKeyboard([[callbackButton('❌ Cancel', 'cancel')]]),
    };
  }

  const orderId = orderIdMatch[0];
  const orderStore = useOrderStore.getState();
  const order = orderStore.getOrderById(orderId);

  if (!order) {
    return {
      text: `❌ Order ${orderId} not found.\n\nPlease check the ID and try again.`,
    };
  }

  const status = ORDER_STATUS_TEXT[order.status] || order.status;
  const created = formatDate(order.createdAt);
  const updated = formatDate(order.updatedAt);

  let text = `📦 Order #${order.id}\n\n`;
  text += `Status: ${status}\n`;
  text += `From: ${order.fromAmount} ${order.fromCurrency.code}\n`;
  text += `To: ${order.toAmount} ${order.toCurrency.code}\n`;
  text += `Rate: ${order.rate}\n`;
  text += `Created: ${created}\n`;
  text += `Updated: ${updated}\n\n`;

  if (order.statusHistory && order.statusHistory.length > 0) {
    text += '📜 Status History:\n';
    for (const history of order.statusHistory.slice(-5)) {
      const histStatus = ORDER_STATUS_TEXT[history.status] || history.status;
      const time = formatDate(history.timestamp);
      text += `• ${histStatus} - ${time}\n`;
      if (history.message) {
        text += `  ${history.message}\n`;
      }
    }
  }

  const buttons: any[][] = [];

  if (order.status === 'waiting_payment') {
    buttons.push([callbackButton('✅ I\'ve Sent Payment', `paid_${order.id}`)]);
  }

  if (order.status !== 'completed' && order.status !== 'cancelled') {
    buttons.push([callbackButton('❌ Cancel Order', `cancel_ord_${order.id}`)]);
  }

  if (order.status === 'completed' && !order.hasReview) {
    buttons.push([callbackButton('⭐ Leave Review', `review_${order.id}`)]);
  }

  buttons.push([callbackButton('🔄 Refresh', `track_${order.id}`)]);
  buttons.push([callbackButton('🏠 Main Menu', 'menu_main')]);

  return {
    text: text.trim(),
    replyMarkup: createInlineKeyboard(buttons),
  };
}

/**
 * Handle /profile command
 */
export async function handleProfile(_message: TelegramMessage, session: BotSession) {
  if (!session.userId) {
    return {
      text: MESSAGES.ERROR_AUTH_REQUIRED,
    };
  }

  const userStore = useUserStore.getState();
  const user = userStore.user;

  if (!user) {
    return {
      text: MESSAGES.ERROR_SYSTEM,
    };
  }

  const kycStatus = user.kycStatus || 'none';
  const kycLevel = user.kycLevel || 0;
  const emailVerified = user.emailVerified ? '✅' : '❌';
  const twoFactorEnabled = user.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled';

  let text = `👤 Your Profile\n\n`;
  text += `Name: ${user.name}\n`;
  text += `Email: ${user.email} ${emailVerified}\n`;
  text += `KYC Level: ${kycLevel}\n`;
  text += `KYC Status: ${kycStatus}\n`;
  text += `2FA: ${twoFactorEnabled}\n`;

  if (user.kycLevel && user.kycLevel > 0) {
    const orderStore = useOrderStore.getState();
    const userOrders = orderStore.getOrdersByUserId(user.id);
    const completedOrders = userOrders.filter(o => o.status === 'completed').length;
    text += `\nCompleted Orders: ${completedOrders}\n`;
  }

  const buttons: any[][] = [
    [callbackButton('🔐 Change Password', 'profile_change_password')],
    [callbackButton('📧 Change Email', 'profile_change_email')],
  ];

  if (!user.twoFactorEnabled) {
    buttons.push([callbackButton('🔒 Enable 2FA', 'profile_enable_2fa')]);
  } else {
    buttons.push([callbackButton('🔓 Disable 2FA', 'profile_disable_2fa')]);
  }

  if (kycLevel < 3) {
    buttons.push([callbackButton('📄 Verify KYC', 'cmd_kyc')]);
  }

  buttons.push([callbackButton('📊 Transaction History', 'profile_history')]);
  buttons.push([callbackButton('🏠 Main Menu', 'menu_main')]);

  return {
    text,
    replyMarkup: createInlineKeyboard(buttons),
  };
}

/**
 * Handle /favorites command
 */
export async function handleFavorites(_message: TelegramMessage, session: BotSession) {
  if (!session.userId) {
    return {
      text: MESSAGES.ERROR_AUTH_REQUIRED,
    };
  }

  const favoriteStore = useFavoriteStore.getState();
  const favorites = favoriteStore.favorites;

  if (favorites.length === 0) {
    return {
      text: '⭐ You have no favorite exchange directions yet.\n\nAdd favorites while creating an exchange to quickly access them later!',
      replyMarkup: createInlineKeyboard([
        [callbackButton('💱 Start Exchange', 'cmd_exchange')],
        [callbackButton('🏠 Main Menu', 'menu_main')],
      ]),
    };
  }

  let text = '⭐ Your Favorite Exchange Directions:\n\n';

  const buttons: any[][] = [];
  for (const fav of favorites) {
    const direction = `${fav.fromCurrencyCode} → ${fav.toCurrencyCode}`;
    text += `• ${direction}\n`;
    buttons.push([
      callbackButton(`💱 ${direction}`, `fav_use_${fav.id}`),
      callbackButton('🗑', `fav_rem_${fav.id}`),
    ]);
  }

  buttons.push([callbackButton('🏠 Main Menu', 'menu_main')]);

  return {
    text: text.trim(),
    replyMarkup: createInlineKeyboard(buttons),
  };
}

/**
 * Handle /reviews command
 */
export async function handleReviews(_message: TelegramMessage, _session: BotSession) {
  const reviewStore = useReviewStore.getState();
  const reviews = reviewStore.getPublishedReviews();

  if (reviews.length === 0) {
    return {
      text: '💬 No reviews yet.\n\nBe the first to leave a review after completing an exchange!',
      replyMarkup: createInlineKeyboard([[callbackButton('🏠 Main Menu', 'menu_main')]]),
    };
  }

  const recentReviews = reviews.slice(0, 5);
  let text = '💬 Recent Reviews:\n\n';

  for (const review of recentReviews) {
    const stars = '⭐'.repeat(review.rating);
    const date = formatDate(review.createdAt);
    const userName = review.userName || 'Anonymous';
    const comment = truncate(review.comment, 100);

    text += `${stars} ${review.rating}/5\n`;
    text += `By: ${userName}\n`;
    text += `"${comment}"\n`;
    text += `${date}\n\n`;
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  text += `\nAverage Rating: ${'⭐'.repeat(Math.round(avgRating))} ${avgRating.toFixed(1)}/5`;
  text += `\nTotal Reviews: ${reviews.length}`;

  return {
    text: text.trim(),
    replyMarkup: createInlineKeyboard([
      [callbackButton('📊 View All', 'reviews_all')],
      [callbackButton('🏠 Main Menu', 'menu_main')],
    ]),
  };
}

/**
 * Handle /support command
 */
export async function handleSupport(_message: TelegramMessage, _session: BotSession) {
  const text = `📞 Customer Support\n\n` +
    `We're here to help! Contact us through:\n\n` +
    `✉️ Email: support@exchangekit.cc\n` +
    `💬 Telegram: @exchangekit_support\n` +
    `📱 Phone: +1 234 567 8900\n\n` +
    `Support hours: 24/7\n` +
    `Average response time: < 5 minutes`;

  return {
    text,
    replyMarkup: createInlineKeyboard([
      [callbackButton('📚 FAQ', 'support_faq')],
      [callbackButton('🏠 Main Menu', 'menu_main')],
    ]),
  };
}

/**
 * Handle /help command
 */
export async function handleHelp(_message: TelegramMessage, _session: BotSession) {
  return {
    text: MESSAGES.HELP_TEXT,
    replyMarkup: createInlineKeyboard([
      [callbackButton('🚀 Get Started', 'cmd_exchange')],
      [callbackButton('📞 Support', 'cmd_support')],
      [callbackButton('🏠 Main Menu', 'menu_main')],
    ]),
  };
}

/**
 * Handle /logout command
 */
export async function handleLogout(_message: TelegramMessage, session: BotSession) {
  const telegramStore = useTelegramStore.getState();
  const userStore = useUserStore.getState();

  // Clear session
  telegramStore.clearSession(session.sessionId);
  
  // Logout from platform
  userStore.logout();

  return {
    text: '👋 You have been logged out successfully.\n\nUse /start to login again.',
    replyMarkup: createInlineKeyboard([[callbackButton('🔑 Login', 'auth_login')]]),
  };
}

/**
 * Handle /settings command
 */
export async function handleSettings(message: TelegramMessage, session: BotSession) {
  if (!session.userId) {
    return {
      text: MESSAGES.ERROR_AUTH_REQUIRED,
    };
  }

  const telegramStore = useTelegramStore.getState();
  const telegramId = String(message.from?.id);
  const telegramUser = telegramStore.getTelegramUser(telegramId);
  const prefs = telegramUser?.notificationPreferences;

  const orderUpdates = prefs?.orderUpdates ? '✅' : '❌';
  const accountAlerts = prefs?.accountAlerts ? '✅' : '❌';
  const promotional = prefs?.promotional ? '✅' : '❌';

  let text = '⚙️ Bot Settings\n\n';
  text += 'Notification Preferences:\n';
  text += `${orderUpdates} Order Updates\n`;
  text += `${accountAlerts} Account Alerts\n`;
  text += `${promotional} Promotional Messages\n\n`;
  text += `Verbosity: ${prefs?.verbosity || 'normal'}\n`;

  return {
    text,
    replyMarkup: createInlineKeyboard([
      [callbackButton('🔔 Notifications', 'settings_notifications')],
      [callbackButton('🌐 Language', 'settings_language')],
      [callbackButton('🏠 Main Menu', 'menu_main')],
    ]),
  };
}
