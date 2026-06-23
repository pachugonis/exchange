import express from 'express';
import cors from 'cors';
import { config } from './config.ts';
import { pool, initSchema } from './db.ts';
import { hashPassword, newUuid } from './lib/security.ts';
import { authRouter } from './routes/auth.ts';

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

  const app = express();
  app.set('trust proxy', 1); // correct client IPs behind a proxy (for rate limiting)
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);

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
