import express from 'express';
import cors from 'cors';
import { config } from './config.ts';
import { pool, initSchema } from './db.ts';
import { hashPassword, newUuid } from './lib/security.ts';
import { authRouter } from './routes/auth.ts';
import { kycRouter } from './routes/kyc.ts';
import { paymentsRouter } from './routes/payments.ts';
import { amlRouter } from './routes/aml.ts';
import { systemRouter } from './routes/system.ts';
import { startLicenseWatch, isSiteLocked, getLicenseState } from './lib/license.ts';

/** Seed an admin account from env if one does not already exist. */
async function ensureAdmin(): Promise<void> {
  if (!config.admin.email || !config.admin.password) {
    console.warn('[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }
  const { rows } = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
  if (rows.length > 0) return;

  const passwordHash = await hashPassword(config.admin.password);
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, role, email_verified)
     VALUES ($1, $2, $3, $4, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
    [newUuid(), config.admin.email, config.admin.name, passwordHash],
  );
  console.log(`[seed] admin account ready: ${config.admin.email}`);
}

async function main(): Promise<void> {
  await initSchema();
  await ensureAdmin();
  await startLicenseWatch();

  const app = express();
  app.set('trust proxy', 1); // correct client IPs behind a proxy (for rate limiting)
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  // Larger limit accommodates base64-encoded KYC documents.
  app.use(express.json({ limit: '12mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Статус лицензии для фронтенда (страница-заглушка при отзыве). Публичный,
  // должен оставаться доступным даже когда сайт заблокирован.
  app.get('/api/system/license', (_req, res) => res.json(getLicenseState()));

  // Контроль лицензии: при отзыве/истечении блокируем весь API — сайт перестаёт
  // работать, а фронтенд показывает причину (см. server/lib/license.ts).
  app.use('/api', (req, res, next) => {
    if (isSiteLocked() && req.path !== '/system/license') {
      const s = getLicenseState();
      return res.status(403).json({ error: 'LICENSE_LOCKED', status: s.status, message: s.message });
    }
    next();
  });

  app.use('/api/auth', authRouter);
  app.use('/api/kyc', kycRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/aml', amlRouter);
  app.use('/api/system', systemRouter);

  // Centralised error handler so route handlers can stay lean.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  app.listen(config.port, () => {
    console.log(`✅ Auth API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
