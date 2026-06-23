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

/** Запустить git в каталоге приложения с таймаутом. Возвращает stdout без переводов строк по краям. */
async function git(args: string[], timeout = 20_000): Promise<string> {
  const { stdout } = await run('git', args, { cwd: APP_DIR, timeout });
  return stdout.trim();
}

// ---- GET /update/check ---- есть ли обновление в удалённом репозитории
systemRouter.get('/update/check', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
    // Тянем свежие данные ветки (использует deploy-ключ сервисного пользователя).
    await git(['fetch', '--quiet', 'origin', branch], 30_000);

    const current = await git(['rev-parse', '--short', 'HEAD']);
    const latest = await git(['rev-parse', '--short', `origin/${branch}`]);
    const behind = Number(await git(['rev-list', '--count', `HEAD..origin/${branch}`]));
    const currentSubject = await git(['log', '-1', '--format=%s', 'HEAD']);
    const latestSubject = await git(['log', '-1', '--format=%s', `origin/${branch}`]);

    res.json({
      updateAvailable: behind > 0,
      behind,
      branch,
      current,
      latest,
      currentSubject,
      latestSubject,
    });
  } catch (err) {
    // Не git-репозиторий, нет доступа к remote и т.п. — обновление через UI недоступно.
    res.json({
      updateAvailable: false,
      error: 'Не удалось проверить обновления (нет git-репозитория или доступа к нему)',
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
