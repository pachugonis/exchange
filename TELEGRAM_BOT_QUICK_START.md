# Telegram Bot Quick Start Guide

## What's Been Implemented

### ✅ Frontend Integration (Complete)

Your React application now has full Telegram bot support integrated:

**1. Types (`src/types/telegram.ts`)**
- TelegramUser - Links Telegram accounts to platform users
- BotSession - Manages conversation state
- MessageQueue - Handles notification delivery
- All conversation flow contexts

**2. Store (`src/store/telegramStore.ts`)**
- User association management
- Session handling
- Message queueing
- Statistics tracking

**3. Configuration (`src/bot/config.ts`)**
- All command definitions
- Message templates
- Callback data structures
- Translations and emojis

**4. Utilities (`src/bot/utils.ts`)**
- Keyboard builders
- Text formatting
- Validation helpers
- Pagination and rate limiting

**5. Handlers (`src/bot/handlers/userHandlers.ts`)**
- Basic command handlers structure
- User flow management

## How to Use in Your React App

### 1. Link Telegram Account

```typescript
import { useTelegramStore } from './store/telegramStore';

// When user connects via Telegram
function linkAccount(telegramData) {
  const store = useTelegramStore();
  store.linkTelegramUser(
    telegramData.id,
    currentUser.id,
    {
      chatId: telegramData.chat.id,
      firstName: telegramData.first_name,
      username: telegramData.username,
    }
  );
}
```

### 2. Send Notifications

```typescript
// Queue a notification
const store = useTelegramStore();
store.queueMessage({
  telegramId: user.telegramId,
  chatId: user.chatId,
  messageType: 'order_status_update',
  content: {
    text: 'Your order #123 has been completed!',
    replyMarkup: {
      inline_keyboard: [[
        { text: 'View Order', callback_data: 'order_123' }
      ]]
    }
  },
  priority: 1,
  scheduledAt: Date.now(),
});
```

### 3. Check Connection Status

```typescript
function TelegramConnectionBadge() {
  const { getUserByPlatformId } = useTelegramStore();
  const { user } = useUserStore();
  
  const telegramUser = getUserByPlatformId(user?.id);
  
  return telegramUser ? (
    <Badge>✅ Telegram: @{telegramUser.username}</Badge>
  ) : (
    <Button onClick={connectTelegram}>Connect Telegram</Button>
  );
}
```

## What You Need to Complete

### Create Separate Bot Server

The bot server is a **separate Node.js application** that handles Telegram Bot API:

**Quick Setup:**

```bash
# Create bot server directory
mkdir telegram-bot-server
cd telegram-bot-server

# Initialize
npm init -y

# Install dependencies
npm install node-telegram-bot-api dotenv axios
npm install --save-dev typescript ts-node @types/node @types/node-telegram-bot-api

# Create basic structure
mkdir src
```

**Minimal Bot Server (`src/bot.ts`):**

```typescript
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token, { polling: true });
const API_URL = 'http://localhost:5173'; // Your React app

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from?.id);
  
  // Check if user exists
  const response = await axios.get(`${API_URL}/api/telegram/user/${telegramId}`)
    .catch(() => null);
  
  if (response?.data) {
    bot.sendMessage(chatId, `Welcome back!`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💱 Exchange', callback_data: 'exchange' }],
          [{ text: '📋 Orders', callback_data: 'orders' }],
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, `Welcome! Please register:`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Register', url: `${API_URL}/user/register?tg=${telegramId}` }],
        ]
      }
    });
  }
});

// Handle callbacks
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  
  if (data === 'exchange') {
    bot.sendMessage(chatId!, 'Starting exchange...');
    // Implement exchange flow
  }
});

console.log('Bot running...');
```

## Integration Flow

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  React Web App  │◄───────►│  Bot Server  │◄───────►│  Telegram   │
│                 │   API   │   (Node.js)  │   Bot   │     API     │
└─────────────────┘         └──────────────┘   API   └─────────────┘
         │                          │
         │                          │
         ▼                          ▼
┌─────────────────────────────────────┐
│       Shared Data Store             │
│   (Zustand via LocalStorage)       │
└─────────────────────────────────────┘
```

## Testing Locally

**1. Get Bot Token:**
- Open Telegram, search for @BotFather
- Send `/newbot`
- Follow instructions
- Copy token

**2. Start Main App:**
```bash
npm run dev
```

**3. Start Bot Server:**
```bash
cd telegram-bot-server
TELEGRAM_BOT_TOKEN=your_token_here npm start
```

**4. Test in Telegram:**
- Search for your bot
- Send `/start`
- Try commands

## Example Use Cases

### 1. Order Status Updates

```typescript
// In your React app - when order status changes
import { useTelegramStore } from './store/telegramStore';

function updateOrderStatus(orderId: string, newStatus: string) {
  const order = orderStore.getOrderById(orderId);
  const telegramUser = telegramStore.getUserByPlatformId(order.userId);
  
  if (telegramUser) {
    telegramStore.queueMessage({
      telegramId: telegramUser.telegramId,
      chatId: telegramUser.chatId,
      messageType: 'order_status_update',
      content: {
        text: `🔔 Order #${orderId}\nStatus: ${newStatus}`,
      },
      priority: 1,
      scheduledAt: Date.now(),
    });
  }
}
```

### 2. KYC Approval Notification

```typescript
function notifyKYCApproval(userId: string, level: number) {
  const telegramUser = telegramStore.getUserByPlatformId(userId);
  
  if (telegramUser) {
    telegramStore.queueMessage({
      telegramId: telegramUser.telegramId,
      chatId: telegramUser.chatId,
      messageType: 'kyc_approved',
      content: {
        text: `🎉 KYC Level ${level} Approved!\nYou can now trade with higher limits.`,
      },
      priority: 2,
      scheduledAt: Date.now(),
    });
  }
}
```

### 3. Display Statistics

```typescript
function BotStatistics() {
  const { getStatistics } = useTelegramStore();
  const stats = getStatistics();
  
  return (
    <div>
      <h3>Telegram Bot Stats</h3>
      <p>Total Users: {stats.totalUsers}</p>
      <p>Active Sessions: {stats.activeSessions}</p>
      <p>Messages Sent: {stats.messagesSent}</p>
      <p>Commands Processed: {stats.commandsProcessed}</p>
    </div>
  );
}
```

## Available Tools & Helpers

### Keyboard Builders

```typescript
import { 
  createInlineKeyboard, 
  createMainMenuKeyboard,
  createCurrencyKeyboard,
  createConfirmKeyboard 
} from './bot/utils';

// Main menu
const menu = createMainMenuKeyboard(isAuthenticated);

// Currency selection
const currencies = [
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
];
const keyboard = createCurrencyKeyboard(currencies, 'from_');

// Confirmation
const confirm = createConfirmKeyboard('yes', 'no');
```

### Text Formatting

```typescript
import { 
  formatCurrencyAmount,
  formatDate,
  escapeHTML,
  truncate 
} from './bot/utils';

formatCurrencyAmount(1000.50); // "1 000.50"
formatDate(Date.now()); // "22.11.2024 15:30"
truncate("Long text...", 20); // "Long text..."
```

## Message Templates

All templates are in `src/bot/config.ts`:

```typescript
import { MESSAGES } from './bot/config';

// Use predefined messages
const welcome = MESSAGES.WELCOME_NEW;
const calculation = MESSAGES.EXCHANGE_CALCULATION({
  fromAmount: 100,
  fromCurrency: 'BTC',
  toAmount: 3000,
  toCurrency: 'ETH',
  rate: 30,
  commission: 0.5,
  reserve: 10000,
  expiryMinutes: 15,
});
```

## Session Management

```typescript
const session = telegramStore.getSession(telegramId);

// Start a flow
telegramStore.startFlow(session.sessionId, 'exchange', {
  fromCurrency: 'BTC'
});

// Update context
telegramStore.updateFlowContext(session.sessionId, {
  amount: 100,
  toCurrency: 'ETH'
});

// End flow
telegramStore.endFlow(session.sessionId);
```

## Next Steps

1. **Create bot server** using the minimal example above
2. **Add API endpoints** to your React app for bot communication
3. **Implement conversation flows** in bot server
4. **Test integration** locally
5. **Deploy** both applications
6. **Monitor** usage and errors

## Full Documentation

See `TELEGRAM_BOT_SETUP.md` for complete implementation guide.

## Support

- Check `src/bot/config.ts` for all commands and messages
- Review `src/bot/utils.ts` for helper functions
- See `src/store/telegramStore.ts` for state management
- Read `TELEGRAM_BOT_SETUP.md` for deployment guide
