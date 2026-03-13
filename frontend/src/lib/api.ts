import { API_BASE, COIN } from './network';
import type { UTXO, ExplorerUTXO } from './transaction';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }

  return data as T;
}

export interface BalanceResponse {
  balance: number;   // in duffs
  received: number;  // in duffs
  sent: number;      // in duffs
}

export async function fetchBalance(address: string): Promise<BalanceResponse> {
  return apiFetch<BalanceResponse>(`/balance/${address}`);
}

export async function fetchUtxos(address: string): Promise<UTXO[]> {
  const raw = await apiFetch<ExplorerUTXO[]>(`/utxos/${address}`);
  // Normalize explorer UTXOs to internal format
  return raw.map((u) => ({
    txid: u.txid,
    outputIndex: u.vout,
    satoshis: Math.round(u.amount * COIN),
    script: u.scriptPubKey,
    height: u.height,
  }));
}

export interface TxDetail {
  txid: string;
  blockhash?: string;
  blockheight?: number;
  confirmations: number;
  time?: number;
  blocktime?: number;
  vin: Array<{
    txid: string;
    vout: number;
    value?: number;
    addresses?: string[];
    address?: string;
  }>;
  vout: Array<{
    value: number;
    n: number;
    scriptPubKey: {
      addresses?: string[];
      address?: string;
      type: string;
    };
  }>;
}

export async function fetchHistory(address: string): Promise<TxDetail[]> {
  return apiFetch<TxDetail[]>(`/history/${address}`);
}

export async function fetchTx(txid: string): Promise<TxDetail> {
  return apiFetch<TxDetail>(`/tx/${txid}`);
}

export async function broadcastTx(hex: string): Promise<{ txid: string }> {
  return apiFetch<{ txid: string }>('/broadcast', {
    method: 'POST',
    body: JSON.stringify({ hex }),
  });
}

export interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
}

export async function fetchInfo(): Promise<BlockchainInfo> {
  return apiFetch<BlockchainInfo>('/info');
}
