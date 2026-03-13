import { useEffect, useState } from 'react';
import { fetchHistory, type TxDetail } from '../lib/api';
import { COIN } from '../lib/network';

interface HistoryProps {
  address: string;
}

interface SimpleTx {
  txid: string;
  type: 'sent' | 'received';
  amount: number;
  confirmations: number;
  time?: number;
}

function parseTx(tx: TxDetail, myAddress: string): SimpleTx {
  // Calculate how much was sent to us vs from us
  let received = 0;
  let sent = 0;

  for (const vout of tx.vout) {
    const addrs = vout.scriptPubKey.addresses || (vout.scriptPubKey.address ? [vout.scriptPubKey.address] : []);
    const valueDuffs = Math.round(vout.value * COIN);
    if (addrs.includes(myAddress)) {
      received += valueDuffs;
    }
  }

  for (const vin of tx.vin) {
    const addrs = vin.addresses || (vin.address ? [vin.address] : []);
    if (addrs.includes(myAddress)) {
      sent += (vin.value || 0) * COIN;
    }
  }

  const net = received - sent;

  return {
    txid: tx.txid,
    type: net >= 0 ? 'received' : 'sent',
    amount: Math.abs(net),
    confirmations: tx.confirmations,
    time: tx.time || tx.blocktime,
  };
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return 'Pending';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function History({ address }: HistoryProps) {
  const [txs, setTxs] = useState<SimpleTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const raw = await fetchHistory(address);
        if (cancelled) return;
        setTxs(raw.map((tx) => parseTx(tx, address)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (loading) {
    return (
      <div className="text-center py-12 text-dark-400">
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Transaction History</h2>

      {txs.length === 0 ? (
        <div className="card text-center py-12 text-dark-400">
          No transactions yet
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map((tx) => (
            <div key={tx.txid} className="card flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'received'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {tx.type === 'received' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {tx.type === 'received' ? 'Received' : 'Sent'}
                  </p>
                  <p className="text-dark-500 text-xs">
                    {formatTime(tx.time)}
                    {tx.confirmations === 0 && (
                      <span className="text-yellow-400 ml-2">Unconfirmed</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-mono font-medium ${
                    tx.type === 'received' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {tx.type === 'received' ? '+' : '-'}
                  {(tx.amount / COIN).toFixed(8)}
                </p>
                <p className="text-dark-500 text-xs">SMT</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
