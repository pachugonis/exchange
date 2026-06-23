import { Router } from 'express';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAuth, requireAdmin } from '../middleware/auth.ts';

export const systemRouter = Router();

const run = promisify(execFile);

// Каталог приложения = текущая рабочая директория сервиса (systemd WorkingDirectory).
const APP_DIR = process.cwd();
// Скрипт-триггер, разрешённый в sudoers (см. INSTALL/install.sh).
const TRIGGER = process.env.UPDATE_TRIGGER ?? path.join(APP_DIR, 'INSTALL', 'trigger-update.sh');
const STATUS_FILE = path.join(APP_DIR, '.update-status.json');
const LOG_FILE = path.join(APP_DIR, '.update.log');
const VERSION_FILE = path.join(APP_DIR, 'VERSION');

/** Текущая установленная версия (из файла VERSION, кладётся артефактом релиза). */
async function currentVersion(): Promise<string> {
  try {
    return (await readFile(VERSION_FILE, 'utf8')).trim();
  } catch {
    return '';
  }
}

// ---- GET /update/check ---- есть ли более свежий релиз на лицензионном сервере
systemRouter.get('/update/check', requireAuth, requireAdmin, async (_req, res) => {
  const licenseServer = process.env.LICENSE_SERVER_URL;
  const licenseKey = process.env.LICENSE_KEY;
  const domain = process.env.LICENSE_DOMAIN;
  const channel = process.env.RELEASE_CHANNEL || 'stable';
  const current = await currentVersion();

  if (!licenseServer || !licenseKey || !domain) {
    return res.json({
      updateAvailable: false,
      current,
      error: 'Обновления не настроены (нет LICENSE_SERVER_URL / LICENSE_KEY в .env)',
    });
  }

  try {
    const url = `${licenseServer}/api/release/latest?licenseKey=${encodeURIComponent(licenseKey)}&domain=${encodeURIComponent(domain)}&channel=${encodeURIComponent(channel)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const data = (await resp.json()) as { version?: string; message?: string; error?: string };

    if (!resp.ok || !data.version) {
      return res.json({
        updateAvailable: false,
        current,
        error: data.message || data.error || 'Лицензия не даёт доступ к обновлениям',
      });
    }

    const latest = data.version;
    res.json({
      updateAvailable: latest !== current,
      current,
      latest,
      channel,
      currentSubject: current ? `Версия ${current}` : 'Версия неизвестна',
      latestSubject: `Версия ${latest}`,
    });
  } catch (err) {
    res.json({
      updateAvailable: false,
      current,
      error: 'Не удалось связаться с лицензионным сервером',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- GET /update/status ---- статус последнего/текущего обновления
systemRouter.get('/update/status', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const raw = await readFile(STATUS_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch {
    res.json({ state: 'idle' });
  }
});

// ---- GET /update/log ---- хвост журнала последнего обновления
systemRouter.get('/update/log', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const raw = await readFile(LOG_FILE, 'utf8');
    // Отдаём последние 300 строк, чтобы не раздувать ответ.
    const log = raw.split('\n').slice(-300).join('\n');
    res.json({ log });
  } catch {
    res.json({ log: '' });
  }
});

// ---- POST /update ---- запустить обновление (отдельным systemd-юнитом)
systemRouter.post('/update', requireAuth, requireAdmin, async (_req, res) => {
  // Не запускаем повторно, если обновление уже идёт.
  try {
    const raw = await readFile(STATUS_FILE, 'utf8');
    if (JSON.parse(raw)?.state === 'running') {
      return res.status(409).json({ error: 'Обновление уже выполняется' });
    }
  } catch {
    /* статус-файла нет — это нормально */
  }

  try {
    // Триггер запускает update.sh в отдельном cgroup (systemd-run внутри trigger-update.sh),
    // поэтому перезапуск exchangekit-api не прерывает само обновление.
    await run('sudo', ['-n', TRIGGER], { timeout: 15_000 });
    res.json({ started: true });
  } catch (err) {
    res.status(500).json({
      error: 'Не удалось запустить обновление',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});
