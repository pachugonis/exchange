import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:5173';

if (!TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// Create bot
const bot = new Telegraf(TOKEN);

// Session storage (in-memory for demo, use Redis in production)
const sessions = new Map();

// Helper: Get or create session
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      userId,
      currentFlow: null,
      step: 0,
      data: {}
    });
  }
  return sessions.get(userId);
}

// Helper: Clear session
function clearSession(userId) {
  sessions.delete(userId);
}

// Helper: Main menu keyboard
function mainMenuKeyboard(isAuthenticated = false) {
  if (isAuthenticated) {
    return {
      inline_keyboard: [
        [
          { text: '💱 Exchange', callback_data: 'cmd_exchange' },
          { text: '📋 My Orders', callback_data: 'cmd_orders' }
        ],
        [
          { text: '👤 Profile', callback_data: 'cmd_profile' },
          { text: '⭐ Favorites', callback_data: 'cmd_favorites' }
        ],
        [
          { text: '⚙️ Settings', callback_data: 'cmd_settings' },
          { text: '❓ Help', callback_data: 'cmd_help' }
        ]
      ]
    };
  } else {
    return {
      inline_keyboard: [
        [
          { text: '🚀 Register', callback_data: 'auth_register' },
          { text: '🔑 Login', callback_data: 'auth_login' }
        ],
        [
          { text: '📊 Track Order', callback_data: 'cmd_track' },
          { text: '💬 Reviews', callback_data: 'cmd_reviews' }
        ],
        [
          { text: '❓ Help', callback_data: 'cmd_help' }
        ]
      ]
    };
  }
}

// Commands

// /start - Welcome message
bot.command('start', async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = String(ctx.from.id);
  const firstName = ctx.from.first_name;

  try {
    // Check if user is linked (you'd call your API here)
    // const user = await checkUserLinked(telegramId);
    const user = null; // Mock for now

    if (user) {
      await ctx.reply(
        `Welcome back, ${firstName}! 👋\n\nWhat would you like to do today?`,
        { reply_markup: mainMenuKeyboard(true) }
      );
    } else {
      await ctx.reply(
        `Welcome to ExchangeKit Bot! 🚀\n\n` +
        `I'm your personal assistant for cryptocurrency exchanges. With me, you can:\n\n` +
        `✓ Exchange crypto and fiat currencies\n` +
        `✓ Track your orders in real-time\n` +
        `✓ Manage your account\n` +
        `✓ Get instant support\n\n` +
        `Let's get started! Please choose an option:`,
        { reply_markup: mainMenuKeyboard(false) }
      );
    }
  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
});

// /menu - Show menu
bot.command('menu', async (ctx) => {
  const session = getSession(ctx.from.id);

  await ctx.reply(
    '📱 Main Menu\n\nChoose an option:',
    { reply_markup: mainMenuKeyboard(session.isAuthenticated) }
  );
});

// /exchange - Start exchange
bot.command('exchange', async (ctx) => {
  const session = getSession(ctx.from.id);

  if (!session.isAuthenticated) {
    await ctx.reply(
      'Please login first to create an exchange.',
      { reply_markup: mainMenuKeyboard(false) }
    );
    return;
  }

  // Start exchange flow
  session.currentFlow = 'exchange';
  session.step = 1;
  session.data = {};

  await ctx.reply(
    '💱 Let\'s start your exchange!\n\n' +
    'Step 1: Select currency to send\n\n' +
    'Popular currencies:',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'BTC', callback_data: 'from_BTC' },
            { text: 'ETH', callback_data: 'from_ETH' },
            { text: 'USDT', callback_data: 'from_USDT' }
          ],
          [
            { text: '❌ Cancel', callback_data: 'cancel' }
          ]
        ]
      }
    }
  );
});

// /orders - View orders
bot.command('orders', async (ctx) => {
  const session = getSession(ctx.from.id);

  if (!session.isAuthenticated) {
    await ctx.reply('Please login first to view orders.');
    return;
  }

  // Mock order data
  await ctx.reply(
    '📋 Your Recent Orders:\n\n' +
    'Order #ORD-ABC123\n' +
    '100 USDT → 0.003 BTC\n' +
    'Status: ✅ Completed\n' +
    'Date: 22.11.2024 15:30\n\n' +
    'Order #ORD-DEF456\n' +
    '500 USD → 0.015 ETH\n' +
    'Status: ⏳ Waiting for Payment\n' +
    'Date: 22.11.2024 14:20',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'View #ORD-ABC123', callback_data: 'order_ORD-ABC123' }],
          [{ text: 'View #ORD-DEF456', callback_data: 'order_ORD-DEF456' }],
          [{ text: '🏠 Main Menu', callback_data: 'menu_main' }]
        ]
      }
    }
  );
});

// /help - Show help
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📚 Available Commands:\n\n' +
    '/exchange - Start new currency exchange\n' +
    '/orders - View your order history\n' +
    '/track - Track specific order by ID\n' +
    '/profile - View and edit your profile\n' +
    '/favorites - Manage favorite directions\n' +
    '/settings - Configure bot preferences\n' +
    '/help - Show this help message\n\n' +
    'Need assistance? Just type your question!',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Get Started', callback_data: 'cmd_exchange' }],
          [{ text: '🏠 Main Menu', callback_data: 'menu_main' }]
        ]
      }
    }
  );
});

// Callback Query Handler
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.callbackQuery.from.id;
  const session = getSession(userId);

  // Acknowledge callback
  await ctx.answerCbQuery();

  try {
    // Handle different callbacks
    if (data === 'menu_main') {
      await ctx.editMessageText(
        '📱 Main Menu\n\nChoose an option:',
        {
          reply_markup: mainMenuKeyboard(session.isAuthenticated)
        }
      );
    }
    else if (data === 'auth_register') {
      await ctx.reply(
        '🚀 Registration\n\n' +
        'To register, please visit our web platform:\n' +
        `${API_URL}/user/register?tg=${userId}\n\n` +
        'After registration, come back and use /start to link your account!'
      );
    }
    else if (data === 'auth_login') {
      // Start login flow
      session.currentFlow = 'login';
      session.step = 1;

      await ctx.reply(
        '🔑 Login\n\nPlease enter your email address:'
      );
    }
    else if (data === 'cmd_exchange') {
      // Trigger exchange command
      ctx.reply('/exchange');
    }
    else if (data.startsWith('from_')) {
      // Handle currency selection
      const currency = data.replace('from_', '');
      session.data.fromCurrency = currency;
      session.step = 2;

      await ctx.editMessageText(
        `💱 Exchange

You selected: ${currency}

` +
        'Step 2: Select currency to receive',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'BTC', callback_data: 'to_BTC' },
                { text: 'ETH', callback_data: 'to_ETH' },
                { text: 'USDT', callback_data: 'to_USDT' }
              ],
              [
                { text: '❌ Cancel', callback_data: 'cancel' }
              ]
            ]
          }
        }
      );
    }
    else if (data.startsWith('to_')) {
      // Handle target currency
      const currency = data.replace('to_', '');
      session.data.toCurrency = currency;
      session.step = 3;

      await ctx.reply(
        `💱 Exchange\n\n` +
        `From: ${session.data.fromCurrency}\n` +
        `To: ${currency}\n\n` +
        `Please enter the amount in ${session.data.fromCurrency}:`
      );
    }
    else if (data === 'cancel') {
      clearSession(userId);
      await ctx.reply(
        'Operation cancelled.',
        { reply_markup: mainMenuKeyboard(session.isAuthenticated) }
      );
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await ctx.reply('Sorry, something went wrong.');
  }
});

// Message Handler (for text input during flows)
bot.on('message', async (ctx) => {
  if (ctx.message.text && ctx.message.text.startsWith('/')) {
    return; // Ignore commands, they're handled separately
  }

  const userId = ctx.message.from.id;
  const session = getSession(userId);

  if (!session.currentFlow) {
    return; // No active flow
  }

  try {
    // Handle different flows
    if (session.currentFlow === 'login') {
      if (session.step === 1) {
        // Email input
        session.data.email = ctx.message.text;
        session.step = 2;
        await ctx.reply('Please enter your password:');
      } else if (session.step === 2) {
        // Password input
        session.data.password = ctx.message.text;

        // Mock login
        await ctx.reply(
          '✅ Login successful!\n\nWelcome back!',
          { reply_markup: mainMenuKeyboard(true) }
        );

        session.isAuthenticated = true;
        clearSession(userId);
      }
    }
    else if (session.currentFlow === 'exchange' && session.step === 3) {
      // Amount input
      const amount = parseFloat(ctx.message.text);

      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Invalid amount. Please enter a valid number:');
        return;
      }

      session.data.amount = amount;

      // Mock calculation
      const rate = 30; // Mock rate
      const toAmount = amount * rate;

      await ctx.reply(
        `💱 Exchange Details:\n\n` +
        `FROM: ${amount} ${session.data.fromCurrency}\n` +
        `TO: ${toAmount.toFixed(2)} ${session.data.toCurrency}\n\n` +
        `Rate: 1 ${session.data.fromCurrency} = ${rate} ${session.data.toCurrency}\n` +
        `Commission: 0.5%\n\n` +
        `⏱ Rate valid for: 15 minutes`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Confirm', callback_data: 'confirm_exchange' },
                { text: '❌ Cancel', callback_data: 'cancel' }
              ]
            ]
          }
        }
      );

      clearSession(userId);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply('Sorry, something went wrong.');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
});

// Launch bot
bot.launch();

console.log('✅ Bot is running...');
console.log('Press Ctrl+C to stop');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));