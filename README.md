# Smartiecoin Web Wallet v1.0.0

**The first official non-custodial web wallet for Smartiecoin (SMT).**

Live at: [wallet.smartiecoin.com](https://wallet.smartiecoin.com)

---

## What is it?

Smartiecoin Web Wallet is a browser-based, self-custody wallet that lets you create, manage, send, and receive SMT — all without trusting a third party with your private keys.

Your keys are generated and stored **only in your browser**, encrypted with your password using AES-256-GCM. The server never sees or stores any private keys, mnemonics, or passwords.

## Features

- **Create a new wallet** — generates a BIP39 12-word recovery phrase
- **Import an existing wallet** — restore from your 12-word recovery phrase
- **Send SMT** — build and sign transactions entirely in the browser
- **Receive SMT** — display your address with a QR code for easy sharing
- **Transaction history** — view your recent incoming and outgoing transactions
- **Real-time balance** — fetched directly from the Smartiecoin blockchain
- **Copy recovery phrase** — one-click copy for safe backup
- **Modern dark UI** — clean, responsive design inspired by MetaMask and Phantom

## Security

- **Non-custodial / Self-custody** — your private keys never leave your browser
- **AES-256-GCM encryption** — wallet data encrypted with your password (PBKDF2, 600,000 iterations)
- **BIP39 / BIP44 standard** — 12-word mnemonic, HD key derivation (`m/44'/5001'/0'/0/0`)
- **No server-side accounts** — nothing to hack on the server
- **No tracking, no analytics** — your privacy is respected
- **Rate-limited API** — protection against abuse
- **HTTPS only** — all traffic encrypted in transit

> **Important:** This is a self-custody wallet. If you lose your 12-word recovery phrase and your password, **there is no way to recover your funds**. No one can help you — not even us. Always back up your recovery phrase in a safe place.

## How It Works

```
┌──────────────────────────┐          ┌──────────────────────────┐
│  Your Browser            │  HTTPS   │  Server                  │
│                          │◄────────►│                          │
│  - Generate keys (BIP39) │          │  API Proxy (read-only)   │
│  - Sign transactions     │          │  ├─ Balance              │
│  - Encrypt wallet (AES)  │          │  ├─ UTXOs                │
│  - Store in localStorage │          │  ├─ History              │
│                          │          │  └─ Broadcast signed TX  │
│  Keys NEVER leave here   │          │  No keys. No accounts.   │
└──────────────────────────┘          └──────────────────────────┘
```

The backend is a lightweight API proxy that connects to a Smartiecoin full node. It only provides:
- Balance lookups
- UTXO data for transaction building
- Transaction history
- Broadcasting of already-signed transactions
- Blockchain info

## Tech Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS (dark mode)
- bitcoinjs-lib (transaction building & signing)
- bip39 / bip32 (key generation & derivation)
- Web Crypto API + AES-256-GCM (wallet encryption)
- qrcode.react (QR code generation)

### Backend
- Node.js + Express + TypeScript
- RPC client for Smartiecoin Core
- Explorer API integration (eIquidus)
- express-rate-limit

### Deployment
- Docker Compose
- Nginx reverse proxy with SSL (Let's Encrypt)

## Smartiecoin Network Parameters

| Parameter | Value |
|-----------|-------|
| P2PKH prefix | `0x3F` (addresses start with **S**) |
| P2SH prefix | `0x52` (addresses start with **R**) |
| WIF prefix | `0x80` |
| BIP44 coin type | `5001` |
| Derivation path | `m/44'/5001'/0'/0/0` |
| Smallest unit | 1 duff = 0.00000001 SMT |

## Self-Hosting

### Prerequisites
- A running Smartiecoin full node with RPC enabled
- Docker and Docker Compose
- Nginx with SSL (recommended)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/SmartiesCoin/webwallet.git
   cd webwallet
   ```

2. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Configure environment variables:
   ```bash
   # Set your RPC password
   export RPC_PASS=your_rpc_password
   ```

4. Start the services:
   ```bash
   docker-compose up -d
   ```

5. Configure Nginx as a reverse proxy with SSL for your domain.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `RPC_HOST` | `127.0.0.1` | Smartiecoin RPC host |
| `RPC_PORT` | `8282` | Smartiecoin RPC port |
| `RPC_USER` | `smt_rpc` | RPC username |
| `RPC_PASS` | — | RPC password (required) |
| `CORS_ORIGIN` | `https://wallet.smartiecoin.com` | Allowed CORS origin |
| `EXPLORER_URL` | `http://127.0.0.1:8092` | eIquidus explorer URL |

## License

MIT

## Links

- **Website:** [smartiecoin.com](https://smartiecoin.com)
- **Explorer:** [explorer.smartiecoin.com](https://explorer.smartiecoin.com)
- **Wallet:** [wallet.smartiecoin.com](https://wallet.smartiecoin.com)
- **GitHub:** [github.com/SmartiesCoin](https://github.com/SmartiesCoin)
