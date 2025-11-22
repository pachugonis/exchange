# Sample Telegram Bot Server

This is a starter template for the Telegram bot server that works with your 4EX Exchange platform.

## Quick Start

```bash
# Install dependencies
npm install node-telegram-bot-api dotenv axios

# Create .env file
echo "TELEGRAM_BOT_TOKEN=your_token_here" > .env
echo "API_URL=http://localhost:5173" >> .env

# Run bot
node bot-server-sample.js
```

## bot-server-sample.js

```javascript
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:5173';

if (!TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// Create bot
const bot = new TelegramBot(TOKEN, { polling: true });

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
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const firstName = msg.from.first_name;

  try {
    // Check if user is linked (you'd call your API here)
    // const user = await checkUserLinked(telegramId);
    const user = null; // Mock for now

    if (user) {
      await bot.sendMessage(
        chatId,
        `Welcome back, ${firstName}! 👋\n\nWhat would you like to do today?`,
        { reply_markup: mainMenuKeyboard(true) }
      );
    } else {
      await bot.sendMessage(
        chatId,
        `Welcome to 4EX Exchange Bot! 🚀\n\n` +
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
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
  }
});

// /menu - Show menu
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(msg.from.id);

  await bot.sendMessage(
    chatId,
    '📱 Main Menu\n\nChoose an option:',
    { reply_markup: mainMenuKeyboard(session.isAuthenticated) }
  );
});

// /exchange - Start exchange
bot.onText(/\/exchange/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(msg.from.id);

  if (!session.isAuthenticated) {
    await bot.sendMessage(
      chatId,
      'Please login first to create an exchange.',
      { reply_markup: mainMenuKeyboard(false) }
    );
    return;
  }

  // Start exchange flow
  session.currentFlow = 'exchange';
  session.step = 1;
  session.data = {};

  await bot.sendMessage(
    chatId,
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
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(msg.from.id);

  if (!session.isAuthenticated) {
    await bot.sendMessage(chatId, 'Please login first to view orders.');
    return;
  }

  // Mock order data
  await bot.sendMessage(
    chatId,
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
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
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
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  const session = getSession(userId);

  // Acknowledge callback
  await bot.answerCallbackQuery(query.id);

  try {
    // Handle different callbacks
    if (data === 'menu_main') {
      await bot.editMessageText(
        '📱 Main Menu\n\nChoose an option:',
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: mainMenuKeyboard(session.isAuthenticated)
        }
      );
    }
    else if (data === 'auth_register') {
      await bot.sendMessage(
        chatId,
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

      await bot.sendMessage(
        chatId,
        '🔑 Login\n\nPlease enter your email address:'
      );
    }
    else if (data === 'cmd_exchange') {
      // Trigger exchange command
      bot.sendMessage(chatId, '/exchange');
    }
    else if (data.startsWith('from_')) {
      // Handle currency selection
      const currency = data.replace('from_', '');
      session.data.fromCurrency = currency;
      session.step = 2;

      await bot.editMessageText(
        `💱 Exchange

You selected: ${currency}

` +
        'Step 2: Select currency to receive',
        {
          chat_id: chatId,
          message_id: query.message.message_id,
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

      await bot.sendMessage(
        chatId,
        `💱 Exchange\n\n` +
        `From: ${session.data.fromCurrency}\n` +
        `To: ${currency}\n\n` +
        `Please enter the amount in ${session.data.fromCurrency}:`
      );
    }
    else if (data === 'cancel') {
      clearSession(userId);
      await bot.sendMessage(
        chatId,
        'Operation cancelled.',
        { reply_markup: mainMenuKeyboard(session.isAuthenticated) }
      );
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong.');
  }
});

// Message Handler (for text input during flows)
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) {
    return; // Ignore commands, they're handled separately
  }

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = getSession(userId);

  if (!session.currentFlow) {
    return; // No active flow
  }

  try {
    // Handle different flows
    if (session.currentFlow === 'login') {
      if (session.step === 1) {
        // Email input
        session.data.email = msg.text;
        session.step = 2;
        await bot.sendMessage(chatId, 'Please enter your password:');
      } else if (session.step === 2) {
        // Password input
        session.data.password = msg.text;

        // Mock login
        await bot.sendMessage(
          chatId,
          '✅ Login successful!\n\nWelcome back!',
          { reply_markup: mainMenuKeyboard(true) }
        );

        session.isAuthenticated = true;
        clearSession(userId);
      }
    }
    else if (session.currentFlow === 'exchange' && session.step === 3) {
      // Amount input
      const amount = parseFloat(msg.text);

      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(chatId, 'Invalid amount. Please enter a valid number:');
        return;
      }

      session.data.amount = amount;

      // Mock calculation
      const rate = 30; // Mock rate
      const toAmount = amount * rate;

      await bot.sendMessage(
        chatId,
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
    await bot.sendMessage(chatId, 'Sorry, something went wrong.');
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ Bot is running...');
console.log('Press Ctrl+C to stop');
```

## .env.example

```env
# Telegram Bot Token (get from @BotFather)
TELEGRAM_BOT_TOKEN=

# Main application URL
API_URL=http://localhost:5173

# Bot configuration
USE_WEBHOOK=false
PORT=3000
```

## package.json

```json
{
  "name": "telegram-bot-server",
  "version": "1.0.0",
  "description": "Telegram bot server for 4EX Exchange",
  "main": "bot-server-sample.js",
  "scripts": {
    "start": "node bot-server-sample.js",
    "dev": "nodemon bot-server-sample.js"
  },
  "dependencies": {
    "node-telegram-bot-api": "^0.66.0",
    "dotenv": "^16.4.1",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}
```

## Testing

1. Get bot token from @BotFather
2. Create .env file with your token
3. Run: `npm install && npm start`
4. Open Telegram and search for your bot
5. Send /start

## Next Steps

1. Add real API integration
2. Implement all commands
3. Add error handling
4. Set up database for sessions
5. Deploy to production server

## Notes

- This is a minimal example for testing
- Use Redis or database for sessions in production
- Add proper error handling and logging
- Implement rate limiting
- Add input validation
- Use environment variables for all config
