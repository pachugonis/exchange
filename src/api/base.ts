/**
 * Базовый URL бэкенд-API.
 *
 * В продакшен-сборке релиза фронтенд собирается с VITE_API_BASE_URL="" →
 * API_BASE становится пустым, и все запросы идут по относительным путям
 * (`/api/...`), которые nginx на клиенте проксирует на тот же домен. Благодаря
 * этому ОДИН собранный фронтенд (из артефакта релиза) работает на любом домене
 * клиента без пересборки.
 *
 * В dev (Vite) переменная не задана → ходим на локальный backend :4000.
 */
const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE = (
  raw !== undefined ? raw : import.meta.env.DEV ? 'http://localhost:4000' : ''
).replace(/\/$/, '');
