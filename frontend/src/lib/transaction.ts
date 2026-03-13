import { Psbt, Transaction } from 'bitcoinjs-lib';
import ECPairFactory, { type ECPairAPI } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from 'buffer';
import { smartiecoin, COIN, DEFAULT_FEE_RATE, API_BASE } from './network';
import { fetchUtxos } from './api';

let _ECPair: ECPairAPI | null = null;
function getECPair(): ECPairAPI {
  if (!_ECPair) _ECPair = ECPairFactory(ecc);
  return _ECPair;
}

// Raw UTXO from API
export interface ExplorerUTXO {
  txid: string;
  vout: number;
  amount: number;       // in coins (not duffs)
  scriptPubKey: string;
}

// Normalized UTXO for internal use
export interface UTXO {
  txid: string;
  outputIndex: number;
  satoshis: number;
  script: string;
}

// Estimate transaction size for fee calculation
// P2PKH: ~148 bytes per input, ~34 bytes per output, ~10 bytes overhead
function estimateSize(inputCount: number, outputCount: number): number {
  return inputCount * 148 + outputCount * 34 + 10;
}

// Fetch raw transaction hex from backend
async function fetchRawTxHex(txid: string): Promise<string> {
  const res = await fetch(`${API_BASE}/rawtx/${txid}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch raw tx');
  return data.hex;
}

// Build and sign a transaction
export async function buildTransaction(params: {
  fromAddress: string;
  toAddress: string;
  amountDuffs: number;
  privateKey: Uint8Array;
  feeRate?: number;
}): Promise<{ hex: string; fee: number; txid: string }> {
  const { fromAddress, toAddress, amountDuffs, privateKey, feeRate = DEFAULT_FEE_RATE } = params;

  // Fetch UTXOs for the sender
  const utxos: UTXO[] = await fetchUtxos(fromAddress);

  if (utxos.length === 0) {
    throw new Error('No spendable outputs found');
  }

  // Sort UTXOs largest first for efficient selection
  utxos.sort((a, b) => b.satoshis - a.satoshis);

  // Select UTXOs to cover amount + estimated fee
  const selected: UTXO[] = [];
  let totalInput = 0;

  // Initial fee estimate with 1 input, 2 outputs (payment + change)
  let estimatedFee = estimateSize(1, 2) * feeRate;

  for (const utxo of utxos) {
    selected.push(utxo);
    totalInput += utxo.satoshis;
    estimatedFee = estimateSize(selected.length, 2) * feeRate;

    if (totalInput >= amountDuffs + estimatedFee) {
      break;
    }
  }

  if (totalInput < amountDuffs + estimatedFee) {
    const available = totalInput / COIN;
    const needed = (amountDuffs + estimatedFee) / COIN;
    throw new Error(
      `Insufficient funds. Available: ${available.toFixed(8)} SMT, Needed: ${needed.toFixed(8)} SMT (including fee)`
    );
  }

  // Fetch raw transactions for nonWitnessUtxo (required for P2PKH signing)
  const rawTxCache = new Map<string, Buffer>();
  for (const utxo of selected) {
    if (!rawTxCache.has(utxo.txid)) {
      const hex = await fetchRawTxHex(utxo.txid);
      rawTxCache.set(utxo.txid, Buffer.from(hex, 'hex'));
    }
  }

  // Build the transaction using Psbt
  const keyPair = getECPair().fromPrivateKey(Buffer.from(privateKey), {
    network: smartiecoin,
  });

  const psbt = new Psbt({ network: smartiecoin });

  // Add inputs with nonWitnessUtxo for P2PKH
  for (const utxo of selected) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.outputIndex,
      nonWitnessUtxo: rawTxCache.get(utxo.txid)!,
    });
  }

  // Payment output
  psbt.addOutput({
    address: toAddress,
    value: amountDuffs,
  });

  // Change output (if change > dust threshold)
  const change = totalInput - amountDuffs - estimatedFee;
  const DUST_THRESHOLD = 546;

  if (change > DUST_THRESHOLD) {
    psbt.addOutput({
      address: fromAddress,
      value: change,
    });
  } else {
    // No change output, fee absorbs the dust
    estimatedFee = totalInput - amountDuffs;
  }

  // Sign all inputs
  for (let i = 0; i < selected.length; i++) {
    psbt.signInput(i, keyPair);
  }

  psbt.finalizeAllInputs();

  const tx: Transaction = psbt.extractTransaction();

  return {
    hex: tx.toHex(),
    fee: estimatedFee,
    txid: tx.getId(),
  };
}

// Format duffs to SMT display string
export function duffsToSmt(duffs: number): string {
  return (duffs / COIN).toFixed(8);
}

// Parse SMT string to duffs
export function smtToDuffs(smt: string): number {
  const value = parseFloat(smt);
  if (isNaN(value) || value < 0) throw new Error('Invalid amount');
  return Math.round(value * COIN);
}
