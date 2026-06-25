import { Router } from 'express';
import { checkAddressAml, isAmlConfigured, type AmlCheckParams } from '../lib/aml.ts';

export const amlRouter = Router();

/**
 * GET /api/aml/status
 * Сообщает фронтенду, включён ли AML-скоринг (настроены ли ключи AMLBot).
 */
amlRouter.get('/status', (_req, res) => {
  res.json({ enabled: isAmlConfigured() });
});

/**
 * POST /api/aml/check
 * Проверяет адрес отправителя/транзакцию через AMLBot и возвращает risk score.
 * Тело: { code, network?, address, hash? }.
 */
amlRouter.post('/check', async (req, res) => {
  const body = req.body as Partial<AmlCheckParams> | undefined;

  const code = typeof body?.code === 'string' ? body.code : '';
  const address = typeof body?.address === 'string' ? body.address : '';
  const network = typeof body?.network === 'string' ? body.network : undefined;
  const hash = typeof body?.hash === 'string' ? body.hash : undefined;

  if (!code || !address) {
    return res.status(400).json({ error: 'Некорректные параметры AML-проверки' });
  }

  const result = await checkAddressAml({ code, network, address, hash });
  res.json(result);
});
