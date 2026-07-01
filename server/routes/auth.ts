import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { pool, toPublicUser, type UserRow } from '../db.ts';
import { config } from '../config.ts';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  generateTotpSecret,
  totpKeyUri,
  verifyTotp,
  generateOpaqueToken,
  newUuid,
} from '../lib/security.ts';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.ts';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.ts';

export const authRouter = Router();

// ---- helpers ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

function isStrongEnough(v: unknown): v is string {
  return typeof v === 'string' && v.length >= MIN_PASSWORD && v.length <= 200;
}

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    'SELECT * FROM users WHERE lower(email) = lower($1)',
    [email],
  );
  return rows[0] ?? null;
}

async function findUserById(id: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

function issueSession(res: Response, user: UserRow) {
  const token = signAccessToken({ sub: user.id, role: user.role });
  res.json({ success: true, token, user: toPublicUser(user) });
}

// Rate limiters protect the credential endpoints from online brute force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Повторите позже.' },
});

const writeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30 });

// ---- POST /register ----
authRouter.post('/register', writeLimiter, async (req, res) => {
  const { name, email, password, confirmPassword } = req.body ?? {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Укажите имя' });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }
  if (!isStrongEnough(password)) {
    return res.status(400).json({ error: `Пароль должен содержать минимум ${MIN_PASSWORD} символов` });
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return res.status(400).json({ error: 'Пароли не совпадают' });
  }

  if (await findUserByEmail(email)) {
    return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
  }

  const id = newUuid();
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (id, email, name, password_hash)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, email, name.trim(), passwordHash],
  );
  const user = rows[0];

  const verifyToken = generateOpaqueToken();
  await pool.query(
    `INSERT INTO auth_tokens (token, user_id, type, expires_at)
     VALUES ($1, $2, 'email_verification', now() + interval '24 hours')`,
    [verifyToken, user.id],
  );
  await sendVerificationEmail(user.email, user.name, verifyToken);

  issueSession(res, user);
});

// ---- POST /login ----
authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password, twoFactorCode } = req.body ?? {};
  if (!isEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }

  const user = await findUserByEmail(email);
  // Uniform error to avoid revealing whether the account exists.
  const invalid = { error: 'Неверный email или пароль' };
  if (!user) {
    return res.status(401).json(invalid);
  }

  if (user.locked_until && user.locked_until.getTime() > Date.now()) {
    return res.status(429).json({ error: 'Аккаунт временно заблокирован из-за попыток входа. Повторите позже.' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    const failed = user.failed_logins + 1;
    const lock = failed >= config.maxFailedLogins;
    await pool.query(
      `UPDATE users SET failed_logins = $2,
         locked_until = CASE WHEN $3 THEN now() + ($4 || ' minutes')::interval ELSE locked_until END,
         updated_at = now()
       WHERE id = $1`,
      [user.id, lock ? 0 : failed, lock, String(config.lockMinutes)],
    );
    return res.status(401).json(invalid);
  }

  if (user.is_banned) {
    return res.status(403).json({
      error: user.ban_reason
        ? `Аккаунт заблокирован. Причина: ${user.ban_reason}`
        : 'Аккаунт заблокирован. Обратитесь к администратору.',
    });
  }

  if (user.two_factor_enabled && user.two_factor_secret) {
    if (typeof twoFactorCode !== 'string' || twoFactorCode.length === 0) {
      return res.status(401).json({ requires2FA: true });
    }
    if (!verifyTotp(twoFactorCode, user.two_factor_secret)) {
      return res.status(401).json({ error: 'Неверный код 2FA' });
    }
  }

  await pool.query('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1', [user.id]);
  issueSession(res, user);
});

// ---- GET /me ----
authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await findUserById(req.user!.sub);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: toPublicUser(user) });
});

// ---- PATCH /me ---- (profile fields only)
authRouter.patch('/me', requireAuth, async (req: AuthedRequest, res) => {
  const { name, phone, telegram } = req.body ?? {};
  const { rows } = await pool.query<UserRow>(
    `UPDATE users SET
       name = COALESCE($2, name),
       phone = COALESCE($3, phone),
       telegram = COALESCE($4, telegram),
       updated_at = now()
     WHERE id = $1 RETURNING *`,
    [req.user!.sub, typeof name === 'string' ? name : null,
     typeof phone === 'string' ? phone : null,
     typeof telegram === 'string' ? telegram : null],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: toPublicUser(rows[0]) });
});

// ---- 2FA setup / enable / disable ----
authRouter.post('/2fa/setup', requireAuth, async (req: AuthedRequest, res) => {
  const user = await findUserById(req.user!.sub);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const secret = generateTotpSecret();
  // Store the secret but keep 2FA disabled until the user confirms a code.
  await pool.query(
    'UPDATE users SET two_factor_secret = $2, two_factor_enabled = FALSE, updated_at = now() WHERE id = $1',
    [user.id, secret],
  );
  res.json({ secret, otpauthUrl: totpKeyUri(user.email, secret) });
});

authRouter.post('/2fa/enable', requireAuth, async (req: AuthedRequest, res) => {
  const { code } = req.body ?? {};
  const user = await findUserById(req.user!.sub);
  if (!user || !user.two_factor_secret) {
    return res.status(400).json({ error: 'Сначала запросите настройку 2FA' });
  }
  if (typeof code !== 'string' || !verifyTotp(code, user.two_factor_secret)) {
    return res.status(400).json({ error: 'Неверный код 2FA' });
  }
  await pool.query('UPDATE users SET two_factor_enabled = TRUE, updated_at = now() WHERE id = $1', [user.id]);
  res.json({ success: true });
});

authRouter.post('/2fa/disable', requireAuth, async (req: AuthedRequest, res) => {
  const { code } = req.body ?? {};
  const user = await findUserById(req.user!.sub);
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    return res.status(400).json({ error: '2FA не включена' });
  }
  if (typeof code !== 'string' || !verifyTotp(code, user.two_factor_secret)) {
    return res.status(400).json({ error: 'Неверный код 2FA' });
  }
  await pool.query(
    'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL, updated_at = now() WHERE id = $1',
    [user.id],
  );
  res.json({ success: true });
});

// ---- Password reset ----
authRouter.post('/password/forgot', writeLimiter, async (req, res) => {
  const { email } = req.body ?? {};
  if (isEmail(email)) {
    const user = await findUserByEmail(email);
    if (user) {
      const token = generateOpaqueToken();
      await pool.query(
        `INSERT INTO auth_tokens (token, user_id, type, expires_at)
         VALUES ($1, $2, 'password_reset', now() + interval '24 hours')`,
        [token, user.id],
      );
      await sendPasswordResetEmail(user.email, user.name, token);
    }
  }
  // Always succeed to avoid user enumeration.
  res.json({ success: true });
});

authRouter.post('/password/reset', writeLimiter, async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (typeof token !== 'string' || !isStrongEnough(newPassword)) {
    return res.status(400).json({ error: `Пароль должен содержать минимум ${MIN_PASSWORD} символов` });
  }
  const { rows } = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM auth_tokens
     WHERE token = $1 AND type = 'password_reset' AND expires_at > now()`,
    [token],
  );
  if (!rows[0]) return res.status(400).json({ error: 'Недействительная или истёкшая ссылка' });

  const passwordHash = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password_hash = $2, failed_logins = 0, locked_until = NULL, updated_at = now() WHERE id = $1',
    [rows[0].user_id, passwordHash],
  );
  await pool.query("DELETE FROM auth_tokens WHERE user_id = $1 AND type = 'password_reset'", [rows[0].user_id]);
  res.json({ success: true });
});

// ---- Change password (authenticated) ----
authRouter.post('/password/change', requireAuth, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || !isStrongEnough(newPassword)) {
    return res.status(400).json({ error: `Пароль должен содержать минимум ${MIN_PASSWORD} символов` });
  }
  const user = await findUserById(req.user!.sub);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    return res.status(400).json({ error: 'Текущий пароль неверен' });
  }
  const passwordHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [user.id, passwordHash]);
  res.json({ success: true });
});

// ---- Email verification ----
authRouter.post('/verify-email', async (req, res) => {
  const { token } = req.body ?? {};
  if (typeof token !== 'string') return res.status(400).json({ error: 'Недействительная ссылка' });

  const { rows } = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM auth_tokens
     WHERE token = $1 AND type = 'email_verification' AND expires_at > now()`,
    [token],
  );
  if (!rows[0]) return res.status(400).json({ error: 'Недействительная или истёкшая ссылка' });

  await pool.query('UPDATE users SET email_verified = TRUE, updated_at = now() WHERE id = $1', [rows[0].user_id]);
  await pool.query('DELETE FROM auth_tokens WHERE token = $1', [token]);
  res.json({ success: true });
});

// ---- Admin login (separate role check) ----
authRouter.post('/admin/login', loginLimiter, async (req, res) => {
  const { email, password, twoFactorCode } = req.body ?? {};
  if (!isEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }
  const user = await findUserByEmail(email);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Неверные учётные данные' });
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Неверные учётные данные' });
  }
  if (user.two_factor_enabled && user.two_factor_secret) {
    if (typeof twoFactorCode !== 'string' || !verifyTotp(twoFactorCode, user.two_factor_secret)) {
      return res.status(401).json({ requires2FA: true });
    }
  }
  issueSession(res, user);
});

// ---- Admin user management ----

// ---- GET /admin/users ---- list all users (admin)
authRouter.get('/admin/users', requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
  res.json({ users: rows.map(toPublicUser) });
});

// ---- PATCH /admin/users/:id ---- edit a user (admin)
authRouter.patch('/admin/users/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { name, email, phone, telegram, emailVerified, kycStatus, kycLevel } = req.body ?? {};

  if (email !== undefined && !isEmail(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }
  if (kycStatus !== undefined && !['none', 'pending', 'verified', 'rejected'].includes(kycStatus)) {
    return res.status(400).json({ error: 'Некорректный статус KYC' });
  }
  if (kycLevel !== undefined && ![0, 1, 2, 3].includes(Number(kycLevel))) {
    return res.status(400).json({ error: 'Некорректный уровень KYC' });
  }

  // Reject an email that already belongs to a different account.
  if (typeof email === 'string') {
    const existing = await findUserByEmail(email);
    if (existing && existing.id !== id) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
  }

  const { rows } = await pool.query<UserRow>(
    `UPDATE users SET
       name = COALESCE($2, name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       telegram = COALESCE($5, telegram),
       email_verified = COALESCE($6, email_verified),
       kyc_status = COALESCE($7, kyc_status),
       kyc_level = COALESCE($8, kyc_level),
       updated_at = now()
     WHERE id = $1 RETURNING *`,
    [
      id,
      typeof name === 'string' ? name : null,
      typeof email === 'string' ? email : null,
      typeof phone === 'string' ? phone : null,
      typeof telegram === 'string' ? telegram : null,
      typeof emailVerified === 'boolean' ? emailVerified : null,
      typeof kycStatus === 'string' ? kycStatus : null,
      kycLevel !== undefined ? Number(kycLevel) : null,
    ],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: toPublicUser(rows[0]) });
});

// ---- POST /admin/users/:id/ban ---- ban / unban a user (admin)
authRouter.post('/admin/users/:id/ban', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { banned, reason } = req.body ?? {};

  if (banned && (typeof reason !== 'string' || reason.trim().length === 0)) {
    return res.status(400).json({ error: 'Укажите причину блокировки' });
  }

  const { rows } = await pool.query<UserRow>(
    `UPDATE users SET
       is_banned = $2,
       ban_reason = $3,
       updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, !!banned, banned ? reason.trim() : null],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: toPublicUser(rows[0]) });
});

// ---- DELETE /admin/users/:id ---- remove a user (admin)
authRouter.delete('/admin/users/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (id === req.user!.sub) {
    return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись' });
  }
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ success: true });
});
