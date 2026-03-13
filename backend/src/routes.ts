import { Router, Request, Response } from 'express';
import { rpcCall } from './rpc';
import { getBalance, getUtxos, getAddressTxs } from './explorer';

const router = Router();

// Validate Smartiecoin address format (starts with S or R, base58)
const ADDRESS_RE = /^[SR][1-9A-HJ-NP-Za-km-z]{25,34}$/;
const TXID_RE = /^[0-9a-fA-F]{64}$/;

function isValidAddress(addr: string): boolean {
  return ADDRESS_RE.test(addr);
}

function isValidTxid(txid: string): boolean {
  return TXID_RE.test(txid);
}

// GET /api/balance/:address - uses explorer API
router.get('/balance/:address', async (req: Request<{ address: string }>, res: Response) => {
  const address = req.params.address;
  if (!isValidAddress(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const result = await getBalance(address);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/utxos/:address - uses explorer API
router.get('/utxos/:address', async (req: Request<{ address: string }>, res: Response) => {
  const address = req.params.address;
  if (!isValidAddress(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const result = await getUtxos(address);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/history/:address - uses explorer API for tx list, RPC for details
router.get('/history/:address', async (req: Request<{ address: string }>, res: Response) => {
  const address = req.params.address;
  if (!isValidAddress(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const txList = await getAddressTxs(address, 0, 50);

    // Get full TX details from RPC for each txid
    const txs = await Promise.all(
      txList.map(async (tx) => {
        try {
          return await rpcCall('getrawtransaction', [tx.txid, true]);
        } catch {
          // If RPC fails for a specific TX, return basic info
          return { txid: tx.txid, type: tx.type, error: 'details unavailable' };
        }
      })
    );

    res.json(txs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/tx/:txid - uses RPC
router.get('/tx/:txid', async (req: Request<{ txid: string }>, res: Response) => {
  const txid = req.params.txid;
  if (!isValidTxid(txid)) {
    res.status(400).json({ error: 'Invalid txid' });
    return;
  }
  try {
    const result = await rpcCall('getrawtransaction', [txid, true]);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/broadcast  { hex: "..." } - uses RPC
router.post('/broadcast', async (req: Request, res: Response) => {
  const { hex } = req.body;
  if (!hex || typeof hex !== 'string' || !/^[0-9a-fA-F]+$/.test(hex)) {
    res.status(400).json({ error: 'Invalid transaction hex' });
    return;
  }
  try {
    const txid = await rpcCall('sendrawtransaction', [hex]);
    res.json({ txid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/info - uses RPC
router.get('/info', async (_req: Request, res: Response) => {
  try {
    const result = await rpcCall('getblockchaininfo');
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
