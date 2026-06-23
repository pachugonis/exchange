import crypto from 'node:crypto';
// bcryptjs — чистый JS, без нативных бинарников: даёт самодостаточный server.mjs
// после esbuild-бандла. Хеши совместимы с прежним bcrypt ($2a$/$2b$).
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { config } from '../config.ts';

// ---- Password hashing (bcryptjs) ----
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcryptRounds);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---- JWT ----
export interface JwtPayload {
  sub: string; // user id
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessTtl as SignOptions['expiresIn'],
    issuer: config.jwt.issuer,
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
  return decoded as JwtPayload;
}

// ---- TOTP (server-side, via otplib) ----
// window:1 tolerates one 30s step of clock skew either direction.
authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, config.totpIssuer, secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

// ---- Opaque tokens for email verification / password reset ----
export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function newUuid(): string {
  return crypto.randomUUID();
}
