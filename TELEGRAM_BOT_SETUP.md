# Telegram Bot Integration Setup Guide

## Overview

This guide explains how to set up and deploy the Telegram bot integration for the 4EX cryptocurrency exchange platform.

## Architecture

The Telegram bot integration consists of two main components:

1. **Frontend Integration** (Current React App)
   - Telegram types and stores are integrated into the existing Zustand state management
   - User associations between Telegram accounts and platform users
   - Notification preferences and session management

2. **Bot Server** (Separate Node.js Application)
   - Handles Telegram Bot API interactions
   - Processes commands and messages
   - Manages conversation flows
   - Sends notifications

## Files Created

### Types
- `src/types/telegram.ts` - TypeScript interfaces for Telegram bot integration
  - TelegramUser, BotSession, MessageQueue
  - Conversation flow contexts
  - Telegram API types

### Stores
- `src/store/telegramStore.ts` - Zustand store for managing bot data
  - User association management
  - Session handling
  - Message queue
  - Statistics tracking

### Bot Configuration
- `src/bot/config.ts` - Bot configuration and constants
  - Command definitions
  - Message templates
  - Callback prefixes
  - Status translations

### Bot Utilities
- `src/bot/utils.ts` - Helper functions for bot operations
  - Keyboard creation
  - Text formatting
  - Validation
  - Rate limiting

### Bot Handlers
- `src/bot/handlers/userHandlers.ts` - User command handlers (partial)
  - Start, menu, orders, track, profile
  - Favorites, reviews, support, help
  - Logout, settings

## Setup Instructions

### Phase 1: Current Implementation (Frontend Integration)

The files created so far integrate Telegram bot support into your existing React application:

**1. Types are exported from `src/types/index.ts`**
```typescript
import { TelegramUser, BotSession } from './types';
```

**2. Telegram store is available for use**
```typescript
import { useTelegramStore } from './store/telegramStore';

const telegramStore = useTelegramStore();
telegramStore.linkTelegramUser(telegramId, userId, userData);
```

**3. The frontend can now:**
- Track Telegram user associations
- Manage bot sessions
- Queue notifications
- Store user preferences

### Phase 2: Bot Server Implementation (Recommended)

To complete the integration, you need to create a separate Node.js bot server:

#### Prerequisites

1. **Create a Telegram Bot**
   - Talk to @BotFather on Telegram
   - Use `/newbot` command
   - Save the bot token

2. **Install Node.js Dependencies**

Create a new directory `telegram-bot-server/` and install:

```bash
npm init -y
npm install node-telegram-bot-api dotenv
npm install --save-dev @types/node-telegram-bot-api typescript ts-node
```

#### Bot Server Structure

```
telegram-bot-server/
├── src/
│   ├── bot.ts                 # Main bot entry point
│   ├── handlers/
│   │   ├── commands.ts        # Command handlers
│   │   ├── callbacks.ts       # Callback query handlers
│   │   └── messages.ts        # Message handlers
│   ├── flows/
│   │   ├── exchange.ts        # Exchange conversation flow
│   │   ├── auth.ts            # Registration/login flow
│   │   └── kyc.ts             # KYC verification flow
│   ├── services/
│   │   ├── api.ts             # API client for main app
│   │   └── notifications.ts   # Notification service
│   └── utils/
│       └── helpers.ts         # Utility functions
├── .env
├── package.json
└── tsconfig.json
```

#### Environment Configuration

Create `.env` file:

```env
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Main Application API
API_BASE_URL=http://localhost:5173
API_SECRET_KEY=your_secret_key

# Bot Configuration
USE_WEBHOOK=false
WEBHOOK_URL=https://yourdomain.com/webhook
PORT=3000
```

#### Sample Bot Server Implementation

**telegram-bot-server/src/bot.ts:**

```typescript
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });

// Import handlers
import { handleStartCommand, handleExchangeCommand } from './handlers/commands';
import { handleCallbackQuery } from './handlers/callbacks';

// Register commands
bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));
bot.onText(/\/exchange/, (msg) => handleExchangeCommand(bot, msg));

// Handle callback queries
bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

console.log('Bot is running...');
```

**telegram-bot-server/src/handlers/commands.ts:**

```typescript
import TelegramBot from 'node-telegram-bot-api';
import { apiClient } from '../services/api';

export async function handleStartCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message
) {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from?.id);
  
  // Check if user is linked
  const user = await apiClient.getTelegramUser(telegramId);
  
  if (user) {
    bot.sendMessage(chatId, `Welcome back, ${user.name}!`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💱 Exchange', callback_data: 'cmd_exchange' }],
          [{ text: '📋 My Orders', callback_data: 'cmd_orders' }],
        ],
      },
    });
  } else {
    bot.sendMessage(chatId, 'Welcome to 4EX! Please login or register.', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Register', callback_data: 'auth_register' },
            { text: '🔑 Login', callback_data: 'auth_login' },
          ],
        ],
      },
    });
  }
}

export async function handleExchangeCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message
) {
  // Implementation for exchange flow
  // This would start the conversation flow
}
```

### Phase 3: API Integration

The bot server needs to communicate with your main application. You can:

#### Option 1: Add API Endpoints to Main App

Add these endpoints to your Express/Vite backend:

```typescript
// Backend API endpoints for bot
app.post('/api/telegram/link', async (req, res) => {
  const { telegramId, userId } = req.body;
  // Link Telegram account to user
});

app.get('/api/telegram/user/:telegramId', async (req, res) => {
  // Get user by Telegram ID
});

app.post('/api/telegram/exchange', async (req, res) => {
  // Create exchange order
});
```

#### Option 2: Use Existing Stores Directly

Since you're using localStorage-based stores, the bot server can:
- Run on the same machine
- Access the same localStorage data
- Or use a shared database

### Phase 4: Notification System

Implement notification service in bot server:

**telegram-bot-server/src/services/notifications.ts:**

```typescript
import TelegramBot from 'node-telegram-bot-api';

export class NotificationService {
  private bot: TelegramBot;
  private queue: any[] = [];

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.startProcessing();
  }

  async queueNotification(chatId: number, message: string, options?: any) {
    this.queue.push({ chatId, message, options });
  }

  private async startProcessing() {
    setInterval(async () => {
      if (this.queue.length > 0) {
        const notification = this.queue.shift();
        try {
          await this.bot.sendMessage(
            notification.chatId,
            notification.message,
            notification.options
          );
        } catch (error) {
          console.error('Failed to send notification:', error);
          // Retry logic
        }
      }
    }, 1000);
  }
}
```

## Using the Integration

### In Your React App

**1. Link Telegram User After Login:**

```typescript
import { useTelegramStore } from './store/telegramStore';
import { useUserStore } from './store/userStore';

function linkTelegramAccount(telegramId: string, telegramData: any) {
  const telegramStore = useTelegramStore();
  const userStore = useUserStore();
  
  if (userStore.user) {
    telegramStore.linkTelegramUser(
      telegramId,
      userStore.user.id,
      {
        chatId: telegramData.chatId,
        firstName: telegramData.firstName,
        username: telegramData.username,
      }
    );
  }
}
```

**2. Send Notifications:**

```typescript
function sendOrderStatusUpdate(orderId: string, status: string) {
  const telegramStore = useTelegramStore();
  const orderStore = useOrderStore();
  const order = orderStore.getOrderById(orderId);
  
  if (order?.userId) {
    const telegramUser = telegramStore.getUserByPlatformId(order.userId);
    
    if (telegramUser) {
      telegramStore.queueMessage({
        telegramId: telegramUser.telegramId,
        chatId: telegramUser.chatId,
        messageType: 'order_status_update',
        content: {
          text: `Order #${orderId} status: ${status}`,
        },
        priority: 2,
        scheduledAt: Date.now(),
      });
    }
  }
}
```

**3. Check Telegram Connection:**

```typescript
function TelegramStatus() {
  const telegramStore = useTelegramStore();
  const userStore = useUserStore();
  
  const telegramUser = telegramStore.getUserByPlatformId(userStore.user?.id);
  
  if (telegramUser) {
    return <div>✅ Telegram connected: @{telegramUser.username}</div>;
  }
  
  return <div>❌ Telegram not connected</div>;
}
```

## Deployment

### Development

1. Run main app: `npm run dev`
2. Run bot server: `cd telegram-bot-server && npm run dev`
3. Test bot in Telegram

### Production

**Main App:**
- Deploy as usual to Vercel, Netlify, etc.

**Bot Server:**
- Deploy to VPS, Heroku, or serverless platform
- Set environment variables
- Enable webhook mode for better performance:

```typescript
const url = process.env.WEBHOOK_URL;
bot.setWebHook(`${url}/webhook`);

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
```

## Features Implemented

### ✅ Frontend Integration
- [x] Telegram types
- [x] Telegram store with session management
- [x] Message queue system
- [x] User association tracking
- [x] Notification preferences
- [x] Bot configuration
- [x] Utility functions
- [x] Partial command handlers

### ⏳ Bot Server (To Be Implemented)
- [ ] Node.js bot server
- [ ] Complete command handlers
- [ ] Conversation flows
- [ ] Admin handlers
- [ ] API integration
- [ ] Notification service
- [ ] File upload handling
- [ ] Rate limiting

## Command Reference

### User Commands
- `/start` - Initialize bot
- `/menu` - Show main menu
- `/exchange` - Start currency exchange
- `/orders` - View order history
- `/track` - Track specific order
- `/profile` - View/edit profile
- `/kyc` - Start KYC verification
- `/favorites` - Manage favorites
- `/promo` - Apply promo codes
- `/reviews` - Browse reviews
- `/support` - Contact support
- `/settings` - Bot settings
- `/logout` - End session
- `/help` - Show help

### Admin Commands
- `/admin` - Admin panel
- `/admin_orders` - Manage orders
- `/admin_users` - User management
- `/admin_kyc` - KYC review queue
- `/admin_currencies` - Currency settings
- `/admin_promos` - Promo management
- `/admin_reviews` - Review moderation
- `/admin_stats` - View statistics
- `/admin_settings` - Platform config

## Security Considerations

1. **Token Security**
   - Store bot token in environment variables
   - Never commit tokens to git
   - Rotate tokens periodically

2. **User Authentication**
   - Verify Telegram user ID
   - Use secure session tokens
   - Implement 2FA for sensitive operations

3. **Rate Limiting**
   - Limit commands per user
   - Prevent spam
   - Monitor for abuse

4. **Data Protection**
   - Encrypt sensitive data
   - Follow GDPR compliance
   - Secure API communications

## Troubleshooting

### Bot Not Responding
- Check bot token is correct
- Verify bot is running
- Check Telegram API status

### Commands Not Working
- Ensure commands are registered with BotFather
- Check handler implementation
- Verify user permissions

### Notifications Not Sending
- Check message queue processing
- Verify chat IDs are correct
- Check bot has permission to message user

## Next Steps

1. **Complete Bot Server**
   - Implement all command handlers
   - Add conversation flows
   - Set up API integration

2. **Testing**
   - Unit tests for handlers
   - Integration tests with main app
   - User acceptance testing

3. **Documentation**
   - API documentation
   - User guide for bot
   - Admin manual

4. **Monitoring**
   - Error tracking
   - Performance metrics
   - Usage analytics

## Support

For questions or issues:
- Check documentation
- Review error logs
- Contact development team

## License

Part of ExchangeKit Platform - MIT License
