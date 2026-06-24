/**
 * Рантайм-контроль лицензии на стороне клиентского приложения.
 *
 * Периодически (и при старте) спрашивает у лицензионного сервера статус ключа,
 * привязанного к домену. Результат кэшируется и переживает рестарт сервиса
 * (файл .license-state.json в каталоге приложения).
 *
 * Политика:
 *   - active     → сайт работает;
 *   - suspended  → сайт работает (обновления и так блокирует лиц-сервер);
 *   - revoked    → сайт блокируется (isSiteLocked() = true), фронтенд показывает причину;
 *   - expired    → то же, что revoked;
 *   - недоступен лиц-сервер → держим прошлый вердикт; если успешной проверки не было
 *     дольше LICENSE_GRACE_DAYS — блокируем (защита от обхода фаерволом),
 *     при этом кратковременные сбои сети сайт не роняют.
 *
 * Не настроено (нет LICENSE_* в .env, напр. в dev) → контроль выключен.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type LicenseStatus = 'active' | 'suspended' | 'revoked' | 'expired' | 'unknown';

const SERVER = process.env.LICENSE_SERVER_URL || '';
const KEY = process.env.LICENSE_KEY || '';
const DOMAIN = process.env.LICENSE_DOMAIN || '';
const CONFIGURED = Boolean(SERVER && KEY && DOMAIN);

const STATE_FILE = path.join(process.cwd(), '.license-state.json');
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // перепроверка раз в 30 минут
const GRACE_DAYS = Number(process.env.LICENSE_GRACE_DAYS ?? 7);
const DAY_MS = 24 * 60 * 60 * 1000;

interface State {
  status: LicenseStatus;
  message: string;
  lockSite: boolean; // отзыв/истечение/просрочка grace
  lastGoodAt: number; // последний успешный ответ лиц-сервера
  checkedAt: number;
}

let state: State = {
  status: CONFIGURED ? 'unknown' : 'active',
  message: '',
  lockSite: false,
  lastGoodAt: 0,
  checkedAt: 0,
};

/** Человекочитаемая причина для страницы-заглушки. */
function reasonFor(status: LicenseStatus, serverMessage: string): string {
  switch (status) {
    case 'revoked':
      return 'Действие лицензии прекращено. Доступ к сервису закрыт. Обратитесь к поставщику.';
    case 'expired':
      return 'Срок действия лицензии истёк. Продлите лицензию, чтобы возобновить работу.';
    default:
      return serverMessage || 'Лицензия не подтверждена.';
  }
}

async function persist(): Promise<void> {
  try {
    await writeFile(STATE_FILE, JSON.stringify(state), 'utf8');
  } catch {
    /* запись кэша не критична */
  }
}

async function loadPersisted(): Promise<void> {
  try {
    const saved = JSON.parse(await readFile(STATE_FILE, 'utf8')) as Partial<State>;
    state = { ...state, ...saved };
  } catch {
    // Первый запуск: отсчёт grace начинаем с этого момента, чтобы недоступность
    // лиц-сервера сразу после установки не блокировала сайт раньше времени.
    state.lastGoodAt = Date.now();
  }
}

async function refresh(): Promise<void> {
  if (!CONFIGURED) return;
  try {
    const resp = await fetch(`${SERVER}/api/license/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: KEY, domain: DOMAIN }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await resp.json()) as { status?: LicenseStatus; error?: string; message?: string };

    // Несуществующий ключ статуса не присылает — трактуем как отзыв.
    let status = data.status;
    if (!status && data.error === 'INVALID_KEY') status = 'revoked';
    if (!status) throw new Error('license server returned no status');

    state.status = status;
    state.lastGoodAt = Date.now();
    state.lockSite = status === 'revoked' || status === 'expired';
    state.message = state.lockSite ? reasonFor(status, data.message || '') : '';
  } catch {
    // Лиц-сервер недоступен: вердикт revoked/expired уже зафиксирован и держится.
    // Если же последний успешный контакт был давно — блокируем после grace.
    const since = state.lastGoodAt || Date.now();
    if (Date.now() - since > GRACE_DAYS * DAY_MS) {
      state.lockSite = true;
      if (state.status === 'active' || state.status === 'unknown') {
        state.message =
          `Не удалось проверить лицензию более ${GRACE_DAYS} дн. ` +
          'Проверьте доступ к лицензионному серверу.';
      }
    }
  } finally {
    state.checkedAt = Date.now();
    await persist();
  }
}

/** Запустить фоновую проверку лицензии (вызывать один раз при старте). */
export async function startLicenseWatch(): Promise<void> {
  if (!CONFIGURED) {
    console.warn('[license] LICENSE_* не настроены — контроль лицензии выключен');
    return;
  }
  await loadPersisted();
  await refresh();
  setInterval(() => { void refresh(); }, CHECK_INTERVAL_MS).unref();
  console.log(`[license] контроль включён (статус: ${state.status})`);
}

/** Заблокирован ли сайт (лицензия отозвана/истекла). */
export function isSiteLocked(): boolean {
  return state.lockSite;
}

/** Текущее состояние лицензии для фронтенда. */
export function getLicenseState(): { status: LicenseStatus; message: string; locked: boolean } {
  return { status: state.status, message: state.message, locked: state.lockSite };
}
