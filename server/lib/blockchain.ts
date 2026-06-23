/**
 * Серверное отслеживание входящих платежей по блокчейну.
 *
 * Запросы к публичным эксплинерам выполняются на бэкенде: это снимает с
 * браузера ограничения CORS и лимиты по количеству запросов, а также
 * позволяет хранить ключ Etherscan на сервере (не в клиентском бандле).
 *
 * Поддерживаются: BTC, LTC, TRON (нативный TRX и USDT-TRC20). Для ETH/ERC20
 * нужен ETHERSCAN_API_KEY; без него сеть считается неотслеживаемой.
 */

import { config } from '../config.ts';

export type PaymentCheckResult =
  | { status: 'unsupported' }
  | { status: 'error' }
  | { status: 'none' }
  | { status: 'pending'; txHash: string; amount: number }
  | { status: 'confirmed'; txHash: string; amount: number };

export interface PaymentCheckParams {
  code: string; // код валюты (BTC, USDT_TRC20, ...)
  network?: string; // сеть валюты (BTC, TRC20, ERC20, ...)
  address: string; // платёжный адрес
  amount: number; // ожидаемая сумма
  createdAt: number; // момент создания заявки (мс)
}

// Контракт USDT в сети TRON (TRC20)
const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// Принимаем перевод от 99% ожидаемой суммы (комиссии сети, округление)
const AMOUNT_TOLERANCE = 0.99;

type Chain = 'btc' | 'ltc' | 'tron-usdt' | 'tron' | 'eth';

/** Ошибка ответа блокчейн-эксплорера с HTTP-статусом для классификации. */
class ExplorerError extends Error {
  constructor(
    public readonly explorer: string,
    public readonly status: number,
  ) {
    super(`${explorer} ответил ${status}`);
    this.name = 'ExplorerError';
  }

  /** 4xx — постоянная ошибка по конкретной заявке (некорректный/неиндексируемый
   *  адрес), а не временный сбой эксплорера. Повторять опрос бессмысленно. */
  get isPermanent(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

function resolveChain(code: string, network?: string): Chain | null {
  const c = code.toUpperCase();
  if (c === 'BTC' || network === 'BTC') return 'btc';
  if (c === 'LTC' || network === 'LTC') return 'ltc';
  if (c.startsWith('USDT') && network === 'TRC20') return 'tron-usdt';
  if (c === 'TRX') return 'tron';
  if (network === 'ETH' || network === 'ERC20' || c === 'ETH') return 'eth';
  return null;
}

export async function checkIncomingPayment(params: PaymentCheckParams): Promise<PaymentCheckResult> {
  const { code, network, address, amount, createdAt } = params;
  if (!address) return { status: 'unsupported' };

  const chain = resolveChain(code, network);
  if (!chain) return { status: 'unsupported' };

  const minAmount = amount * AMOUNT_TOLERANCE;
  // Небольшой буфер до создания на случай рассинхрона часов
  const since = createdAt - 5 * 60 * 1000;

  try {
    switch (chain) {
      case 'btc':
        return await checkBlockstream('https://blockstream.info/api', address, minAmount, since);
      case 'ltc':
        return await checkBlockstream('https://litecoinspace.org/api', address, minAmount, since);
      case 'tron-usdt':
        return await checkTronTrc20(address, minAmount, since);
      case 'tron':
        return await checkTronNative(address, minAmount, since);
      case 'eth':
        return await checkEthereum(address, minAmount, since);
    }
  } catch (error) {
    if (error instanceof ExplorerError && error.isPermanent) {
      // Битый/неиндексируемый адрес — это не сбой сервиса, а проблема
      // конкретной заявки. Логируем коротко, без стек-трейса.
      console.warn(`[blockchain] ${chain}: ${error.message} для адреса ${address}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[blockchain] ${chain} check failed: ${message}`);
    }
    return { status: 'error' };
  }
}

/** BTC / LTC — эксплореры с API в стиле Blockstream/mempool. */
async function checkBlockstream(
  base: string,
  address: string,
  minAmount: number,
  since: number,
): Promise<PaymentCheckResult> {
  const response = await fetch(`${base}/address/${address}/txs`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new ExplorerError(base, response.status);

  const txs = (await response.json()) as BlockstreamTx[];
  let pending: { txHash: string; amount: number } | null = null;

  for (const tx of txs) {
    const received =
      tx.vout
        .filter((o) => o.scriptpubkey_address === address)
        .reduce((sum, o) => sum + o.value, 0) / 1e8;

    if (received < minAmount) continue;

    if (tx.status.confirmed) {
      if (tx.status.block_time && tx.status.block_time * 1000 < since) continue;
      return { status: 'confirmed', txHash: tx.txid, amount: received };
    }
    pending = { txHash: tx.txid, amount: received };
  }

  return pending ? { status: 'pending', ...pending } : { status: 'none' };
}

/** TRON, токен USDT (TRC20) — TronGrid. */
async function checkTronTrc20(
  address: string,
  minAmount: number,
  since: number,
): Promise<PaymentCheckResult> {
  const url =
    `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20` +
    `?only_to=true&limit=30&contract_address=${TRON_USDT_CONTRACT}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ExplorerError('TronGrid', response.status);

  const json = (await response.json()) as { data?: TronTrc20Tx[] };
  for (const tx of json.data ?? []) {
    if (tx.to !== address) continue;
    if (tx.block_timestamp && tx.block_timestamp < since) continue;
    const amount = Number(tx.value) / 1e6; // USDT TRC20 — 6 знаков
    if (amount >= minAmount) {
      return { status: 'confirmed', txHash: tx.transaction_id, amount };
    }
  }
  return { status: 'none' };
}

/** TRON, нативный TRX — TronGrid. */
async function checkTronNative(
  address: string,
  minAmount: number,
  since: number,
): Promise<PaymentCheckResult> {
  const url = `https://api.trongrid.io/v1/accounts/${address}/transactions?only_to=true&limit=30`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ExplorerError('TronGrid', response.status);

  const json = (await response.json()) as { data?: TronTx[] };
  for (const tx of json.data ?? []) {
    if (tx.block_timestamp && tx.block_timestamp < since) continue;
    const contract = tx.raw_data?.contract?.[0];
    if (contract?.type !== 'TransferContract') continue;
    const value = contract.parameter?.value;
    if (!value || value.to_address === undefined) continue;
    const amount = Number(value.amount ?? 0) / 1e6; // sun -> TRX
    if (amount >= minAmount) {
      return { status: 'confirmed', txHash: tx.txID, amount };
    }
  }
  return { status: 'none' };
}

/** Ethereum (нативный ETH) — Etherscan. Требует ETHERSCAN_API_KEY. */
async function checkEthereum(
  address: string,
  minAmount: number,
  since: number,
): Promise<PaymentCheckResult> {
  const apiKey = config.etherscanApiKey;
  if (!apiKey) return { status: 'unsupported' };

  const url =
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}` +
    `&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ExplorerError('Etherscan', response.status);

  const json = (await response.json()) as { status: string; result?: EtherscanTx[] };
  if (json.status !== '1' || !json.result) return { status: 'none' };

  for (const tx of json.result) {
    if (tx.to?.toLowerCase() !== address.toLowerCase()) continue;
    if (Number(tx.timeStamp) * 1000 < since) continue;
    if (tx.isError === '1') continue;
    const amount = Number(tx.value) / 1e18; // wei -> ETH
    if (amount >= minAmount) {
      return Number(tx.confirmations) > 0
        ? { status: 'confirmed', txHash: tx.hash, amount }
        : { status: 'pending', txHash: tx.hash, amount };
    }
  }
  return { status: 'none' };
}

// ---- Типы ответов эксплореров ----

interface BlockstreamTx {
  txid: string;
  vout: { scriptpubkey_address?: string; value: number }[];
  status: { confirmed: boolean; block_time?: number };
}

interface TronTrc20Tx {
  transaction_id: string;
  to: string;
  value: string;
  block_timestamp?: number;
}

interface TronTx {
  txID: string;
  block_timestamp?: number;
  raw_data?: {
    contract?: {
      type: string;
      parameter?: { value?: { to_address?: string; amount?: number } };
    }[];
  };
}

interface EtherscanTx {
  hash: string;
  to: string;
  value: string;
  timeStamp: string;
  confirmations: string;
  isError: string;
}
