import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Read a required env var. In production a missing value is fatal;
 * in development we fall back to a clearly-insecure default so the
 * server still boots for local work.
 */
function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (!isProd && devFallback !== undefined) {
    console.warn(`[config] ${name} not set — using insecure dev default`);
    return devFallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  isProd,
  port: Number(process.env.AUTH_PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL', 'postgres://localhost:5432/exchange'),

  jwt: {
    secret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
    // No refresh tokens in this build, so the access token lives a while.
    accessTtl: process.env.JWT_ACCESS_TTL ?? '7d',
    issuer: 'exchangekit',
  },

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  totpIssuer: process.env.TOTP_ISSUER ?? 'ExchangeKit',

  // Ключ Etherscan для отслеживания оплаты в сети Ethereum (ETH/ERC20).
  // Без ключа ETH-заявки не отслеживаются автоматически.
  etherscanApiKey: process.env.ETHERSCAN_API_KEY ?? '',

  // Public frontend URL used to build links inside emails.
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',

  // SMTP — when not configured, emails are logged to the console instead.
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    fromName: process.env.SMTP_FROM_NAME ?? 'ExchangeKit',
    fromEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@exchangekit.io',
  },

  // Optional seed admin (replaces the old hardcoded admin123).
  admin: {
    email: process.env.ADMIN_EMAIL ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
    name: process.env.ADMIN_NAME ?? 'Administrator',
  },

  // Brute-force protection
  maxFailedLogins: Number(process.env.MAX_FAILED_LOGINS ?? 5),
  lockMinutes: Number(process.env.LOCK_MINUTES ?? 15),
};
