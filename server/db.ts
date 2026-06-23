import pg from 'pg';
import { config } from './config.ts';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Frontend-safe representation of a user (never includes password_hash or 2FA secret).
export interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  role: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  kyc_status: string;
  kyc_level: number;
  password_hash: string;
  failed_logins: number;
  locked_until: Date | null;
  created_at: Date;
}

/** Create tables if they do not exist. Idempotent — safe to run on every boot. */
export async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                 UUID PRIMARY KEY,
      email              TEXT UNIQUE NOT NULL,
      name               TEXT NOT NULL,
      password_hash      TEXT NOT NULL,
      phone              TEXT,
      telegram           TEXT,
      role               TEXT NOT NULL DEFAULT 'user',
      email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
      two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      two_factor_secret  TEXT,
      is_banned          BOOLEAN NOT NULL DEFAULT FALSE,
      ban_reason         TEXT,
      kyc_status         TEXT NOT NULL DEFAULT 'none',
      kyc_level          INT  NOT NULL DEFAULT 0,
      failed_logins      INT  NOT NULL DEFAULT 0,
      locked_until       TIMESTAMPTZ,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      token      TEXT PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT NOT NULL, -- 'email_verification' | 'password_reset'
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_type ON auth_tokens(type);
  `);
}

/** Strip sensitive fields and shape the row like the frontend `User` type. */
export function toPublicUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
    telegram: row.telegram ?? undefined,
    createdAt: row.created_at.getTime(),
    emailVerified: row.email_verified,
    kycStatus: row.kyc_status as 'none' | 'pending' | 'verified' | 'rejected',
    kycLevel: row.kyc_level,
    twoFactorEnabled: row.two_factor_enabled,
    isBanned: row.is_banned,
    banReason: row.ban_reason ?? undefined,
    role: row.role,
  };
}
