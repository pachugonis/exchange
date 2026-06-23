import { Router } from 'express';
import { pool, toKyc, type KycRow } from '../db.ts';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.ts';

export const kycRouter = Router();

// Per-level transaction limits (USD).
const LIMITS: Record<number, { daily: number; monthly: number }> = {
  1: { daily: 1000, monthly: 10000 },
  2: { daily: 10000, monthly: 100000 },
  3: { daily: 50000, monthly: 500000 },
};

// Fields that live in the JSONB `data` column.
const DATA_FIELDS = [
  'firstName', 'lastName', 'dateOfBirth', 'country',
  'address', 'city', 'postalCode', 'documentType', 'documentNumber',
  'phoneVerified', 'addressVerified',
] as const;

function pickData(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of DATA_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

// ---- GET /me ---- current user's KYC (or null)
kycRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query<KycRow>('SELECT * FROM kyc_submissions WHERE user_id = $1', [req.user!.sub]);
  res.json({ kyc: rows[0] ? toKyc(rows[0]) : null });
});

// ---- POST /submit ---- create/update the user's submission
kycRouter.post('/submit', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const level = Number(req.body?.level);
  if (![1, 2, 3].includes(level)) {
    return res.status(400).json({ error: 'Некорректный уровень верификации' });
  }

  const data = pickData(req.body ?? {});
  const documents = Array.isArray(req.body?.documents) ? req.body.documents : [];
  const limits = LIMITS[level] ?? { daily: 500, monthly: 5000 };

  const { rows } = await pool.query<KycRow>(
    `INSERT INTO kyc_submissions
       (user_id, level, status, data, documents, daily_limit, monthly_limit, submitted_at, reviewed_at, reviewed_by, rejection_reason)
     VALUES ($1, $2, 'pending', $3::jsonb, $4::jsonb, $5, $6, now(), NULL, NULL, NULL)
     ON CONFLICT (user_id) DO UPDATE SET
       level = EXCLUDED.level,
       status = 'pending',
       data = EXCLUDED.data,
       documents = EXCLUDED.documents,
       daily_limit = EXCLUDED.daily_limit,
       monthly_limit = EXCLUDED.monthly_limit,
       submitted_at = now(),
       reviewed_at = NULL,
       reviewed_by = NULL,
       rejection_reason = NULL
     RETURNING *`,
    [userId, level, JSON.stringify(data), JSON.stringify(documents), limits.daily, limits.monthly],
  );

  // Mark the account as pending; the level is only granted on approval.
  await pool.query("UPDATE users SET kyc_status = 'pending', updated_at = now() WHERE id = $1", [userId]);

  res.json({ success: true, kyc: toKyc(rows[0]) });
});

// ---- GET / ---- all submissions (admin)
kycRouter.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query<KycRow>('SELECT * FROM kyc_submissions ORDER BY submitted_at DESC');
  res.json({ submissions: rows.map(toKyc) });
});

// ---- POST /:userId/review ---- approve or reject (admin)
kycRouter.post('/:userId/review', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { userId } = req.params;
  const { action, reason } = req.body ?? {};
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Некорректное действие' });
  }
  if (action === 'reject' && (typeof reason !== 'string' || reason.trim().length === 0)) {
    return res.status(400).json({ error: 'Укажите причину отклонения' });
  }

  const { rows } = await pool.query<KycRow>('SELECT * FROM kyc_submissions WHERE user_id = $1', [userId]);
  const submission = rows[0];
  if (!submission) return res.status(404).json({ error: 'Заявка не найдена' });

  if (action === 'approve') {
    const { rows: updated } = await pool.query<KycRow>(
      `UPDATE kyc_submissions SET status = 'verified', reviewed_at = now(), reviewed_by = $2, rejection_reason = NULL
       WHERE user_id = $1 RETURNING *`,
      [userId, req.user!.sub],
    );
    await pool.query(
      "UPDATE users SET kyc_status = 'verified', kyc_level = $2, updated_at = now() WHERE id = $1",
      [userId, submission.level],
    );
    return res.json({ success: true, kyc: toKyc(updated[0]) });
  }

  const { rows: updated } = await pool.query<KycRow>(
    `UPDATE kyc_submissions SET status = 'rejected', reviewed_at = now(), reviewed_by = $2, rejection_reason = $3
     WHERE user_id = $1 RETURNING *`,
    [userId, req.user!.sub, reason],
  );
  await pool.query("UPDATE users SET kyc_status = 'rejected', updated_at = now() WHERE id = $1", [userId]);
  res.json({ success: true, kyc: toKyc(updated[0]) });
});
