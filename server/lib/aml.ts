/**
 * AML-скоринг входящих транзакций через AMLBot (https://amlbot.com).
 *
 * Запрос выполняется на бэкенде, чтобы accessKey не попадал в клиентский
 * бандл. По крипто-адресу отправителя (и хэшу транзакции, если он известен)
 * AMLBot возвращает risk score 0–1 и разбивку источников средств по
 * категориям (биржи, миксеры, даркнет, санкции и т.д.).
 *
 * Контракт API подтверждён по официальному клиенту AMLBot:
 *   POST {baseUrl}/                      (application/x-www-form-urlencoded)
 *   поля: address, hash, asset, direction, locale, flow, accessId, token
 *   token = md5(accessKey + ':' + accessId)
 *   ответ: { result, description, data: { riskscore, signals, status, uid, pdfReport } }
 */

import { createHash } from 'node:crypto';
import { config } from '../config.ts';

export type AmlRiskLevel = 'none' | 'low' | 'medium' | 'high';

export type AmlCheckResult =
  | { status: 'disabled' } // AMLBot не настроен (нет accessId/accessKey)
  | { status: 'unsupported' } // валюта/сеть не поддерживается AMLBot
  | { status: 'error'; message: string } // сбой запроса/ответа — повторить позже
  | { status: 'pending'; uid: string } // проверка ещё выполняется на стороне AMLBot
  | {
      status: 'completed';
      uid: string;
      riskScore: number; // 0–100
      riskLevel: AmlRiskLevel;
      signals: AmlSignal[]; // ненулевые источники, по убыванию доли
      pdfReport?: string; // ссылка на PDF-отчёт AMLBot
      checkedAt: number;
    };

export interface AmlSignal {
  name: string; // ключ категории AMLBot (mixer, sanctions, dark_market, ...)
  share: number; // доля средств из источника, 0–100
}

export interface AmlCheckParams {
  code: string; // код валюты заявки (BTC, USDT_TRC20, ...)
  network?: string; // сеть (BTC, TRC20, ERC20, ...)
  address: string; // адрес отправителя (контрагент, которого проверяем)
  hash?: string; // хэш входящей транзакции, если известен
}

/** Поддерживается ли AML-проверка для данной валюты/сети. */
export function isAmlConfigured(): boolean {
  return Boolean(config.aml.accessId && config.aml.accessKey);
}

/**
 * Сопоставление кода валюты с кодом актива AMLBot.
 * AMLBot принимает тикер базового актива в нижнем регистре; для токенов
 * (USDT/USDC) сеть передаётся отдельным полем `network`.
 */
function toAmlAsset(code: string, network?: string): string | null {
  const c = code.toUpperCase();
  if (c === 'BTC') return 'btc';
  if (c === 'LTC') return 'ltc';
  if (c === 'ETH') return 'eth';
  if (c === 'TRX') return 'trx';
  if (c === 'BNB') return 'bnb';
  if (c.startsWith('USDT')) return 'usdt';
  if (c.startsWith('USDC')) return 'usdc';
  // Резолвим по сети, если код нестандартный
  if (network === 'ERC20' || network === 'ETH') return 'eth';
  if (network === 'TRC20') return 'usdt';
  if (network === 'BTC') return 'btc';
  return null;
}

/** Нормализуем сеть AMLBot из нашей записи сети. */
function toAmlNetwork(network?: string): string | undefined {
  if (!network) return undefined;
  const n = network.toUpperCase();
  if (n === 'TRC20') return 'tron';
  if (n === 'ERC20' || n === 'ETH') return 'ethereum';
  if (n === 'BTC') return 'bitcoin';
  if (n === 'LTC') return 'litecoin';
  return network.toLowerCase();
}

/** Подпись запроса AMLBot: md5(accessKey:accessId). */
function buildToken(): string {
  return createHash('md5')
    .update(`${config.aml.accessKey}:${config.aml.accessId}`)
    .digest('hex');
}

function levelFromScore(score: number): AmlRiskLevel {
  if (score <= 0) return 'none';
  if (score <= config.aml.mediumThreshold) return 'low';
  if (score <= config.aml.highThreshold) return 'medium';
  return 'high';
}

/** Достаём ненулевые сигналы и переводим долю в проценты, по убыванию. */
function extractSignals(signals: Record<string, unknown> | undefined): AmlSignal[] {
  if (!signals || typeof signals !== 'object') return [];
  return Object.entries(signals)
    .map(([name, value]) => ({ name, share: Math.round(Number(value) * 100) }))
    .filter((s) => Number.isFinite(s.share) && s.share > 0)
    .sort((a, b) => b.share - a.share);
}

/**
 * Выполнить AML-проверку адреса/транзакции через AMLBot.
 * Сетевые/форматные ошибки не бросаются наружу, а возвращаются как
 * { status: 'error' } — вызывающий код решает, повторять ли позже.
 */
export async function checkAddressAml(params: AmlCheckParams): Promise<AmlCheckResult> {
  if (!isAmlConfigured()) return { status: 'disabled' };

  const { code, network, address, hash } = params;
  if (!address) return { status: 'unsupported' };

  const asset = toAmlAsset(code, network);
  if (!asset) return { status: 'unsupported' };

  const body = new URLSearchParams({
    address,
    asset,
    direction: 'deposit', // входящий перевод от клиента — проверяем источник
    locale: config.aml.locale,
    flow: config.aml.flow,
    accessId: config.aml.accessId,
    token: buildToken(),
  });
  if (hash) body.set('hash', hash);
  const amlNetwork = toAmlNetwork(network);
  if (amlNetwork) body.set('network', amlNetwork);

  try {
    return await requestCheck(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[aml] проверка ${asset} ${address} не удалась: ${message}`);
    return { status: 'error', message };
  }
}

async function requestCheck(body: URLSearchParams): Promise<AmlCheckResult> {
  const response = await fetch(`${config.aml.baseUrl}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    return { status: 'error', message: `AMLBot ответил ${response.status}` };
  }

  const json = (await response.json()) as AmlbotResponse;
  if (!json.result || !json.data) {
    return { status: 'error', message: json.description || 'AMLBot вернул пустой результат' };
  }

  const data = json.data;
  // status: success | pending | failed | error
  if (data.status === 'pending') {
    return { status: 'pending', uid: data.uid };
  }
  if (data.status && data.status !== 'success') {
    return { status: 'error', message: `AMLBot статус проверки: ${data.status}` };
  }

  const riskScore = Math.round(Number(data.riskscore) * 100);
  return {
    status: 'completed',
    uid: data.uid,
    riskScore: Number.isFinite(riskScore) ? riskScore : 0,
    riskLevel: levelFromScore(riskScore),
    signals: extractSignals(data.signals),
    pdfReport: data.pdfReport || undefined,
    checkedAt: Date.now(),
  };
}

// ---- Тип ответа AMLBot (только используемые поля) ----

interface AmlbotResponse {
  result: boolean;
  description?: string;
  data?: {
    riskscore: number | string;
    signals?: Record<string, number | string>;
    status?: string;
    uid: string;
    pdfReport?: string;
  };
}
