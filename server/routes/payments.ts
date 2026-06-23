import { Router } from 'express';
import { checkIncomingPayment, type PaymentCheckParams } from '../lib/blockchain.ts';

export const paymentsRouter = Router();

/**
 * POST /api/payments/check
 * Проверяет, поступила ли оплата по заявке, опрашивая блокчейн-эксплореры
 * на стороне сервера. Тело запроса описывает платёж, ответ — результат проверки.
 */
paymentsRouter.post('/check', async (req, res) => {
  const body = req.body as Partial<PaymentCheckParams> | undefined;

  const code = typeof body?.code === 'string' ? body.code : '';
  const address = typeof body?.address === 'string' ? body.address : '';
  const amount = Number(body?.amount);
  const createdAt = Number(body?.createdAt);
  const network = typeof body?.network === 'string' ? body.network : undefined;

  if (!code || !address || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(createdAt)) {
    return res.status(400).json({ error: 'Некорректные параметры проверки платежа' });
  }

  const result = await checkIncomingPayment({ code, network, address, amount, createdAt });
  res.json(result);
});
