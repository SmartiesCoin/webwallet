import { Layout } from './components/Layout';
import { CreateWallet } from './components/CreateWallet';
import { BackupMnemonic } from './components/BackupMnemonic';
import { UnlockWallet } from './components/UnlockWallet';
import { ImportWallet } from './components/ImportWallet';
import { Dashboard } from './components/Dashboard';
import { Send } from './components/Send';
import { Receive } from './components/Receive';
import { History } from './components/History';
import { useWallet, type WalletView } from './hooks/useWallet';

function App() {
  const wallet = useWallet();

  const isLoggedIn = !!wallet.privateKey && !!wallet.walletData;
  const navViews = ['dashboard', 'send', 'receive', 'history'];

  const renderContent = () => {
    switch (wallet.view) {
      case 'landing':
        return (
          <div className="space-y-8 text-center py-12">
            <div>
              <div className="w-20 h-20 bg-smt-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-smt-500 rounded-xl flex items-center justify-center font-bold text-2xl">
                  S
                </div>
              </div>
              <h1 className="text-3xl font-bold">Smartiecoin Wallet</h1>
              <p className="text-dark-400 mt-3 max-w-md mx-auto">
                Secure, non-custodial web wallet. Your keys never leave your browser.
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              <button
                onClick={() => wallet.setView('create')}
                className="btn-primary w-full"
              >
                Create New Wallet
              </button>
              <button
                onClick={() => wallet.setView('import')}
                className="btn-secondary w-full"
              >
                Import Existing Wallet
              </button>
            </div>

            <p className="text-dark-600 text-xs max-w-sm mx-auto">
              Your wallet is encrypted and stored locally in your browser.
              No account needed. No data sent to any server.
            </p>
          </div>
        );

      case 'create':
        return (
          <CreateWallet
            onSubmit={wallet.handleCreate}
            onBack={() => wallet.setView('landing')}
            loading={wallet.loading}
            error={wallet.error}
          />
        );

      case 'create-backup':
        return wallet.mnemonic ? (
          <BackupMnemonic
            mnemonic={wallet.mnemonic}
            onConfirm={() => wallet.setView('unlock')}
          />
        ) : null;

      case 'import':
        return (
          <ImportWallet
            onImport={wallet.handleImport}
            onBack={() => wallet.setView('landing')}
            loading={wallet.loading}
            error={wallet.error}
          />
        );

      case 'unlock':
        return wallet.walletData ? (
          <UnlockWallet
            address={wallet.walletData.address}
            onUnlock={wallet.handleUnlock}
            onLogout={wallet.handleLogout}
            loading={wallet.loading}
            error={wallet.error}
          />
        ) : null;

      case 'dashboard':
        return wallet.walletData ? (
          <Dashboard
            address={wallet.walletData.address}
            balance={wallet.balance}
            onRefresh={wallet.refreshBalance}
            onSend={() => wallet.setView('send')}
            onReceive={() => wallet.setView('receive')}
          />
        ) : null;

      case 'send':
        return wallet.walletData && wallet.privateKey ? (
          <Send
            address={wallet.walletData.address}
            privateKey={wallet.privateKey}
            balance={wallet.balance}
            onDone={() => {
              wallet.refreshBalance();
              wallet.setView('dashboard');
            }}
          />
        ) : null;

      case 'receive':
        return wallet.walletData ? (
          <Receive address={wallet.walletData.address} />
        ) : null;

      case 'history':
        return wallet.walletData ? (
          <History address={wallet.walletData.address} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Layout
      address={isLoggedIn ? wallet.walletData?.address : null}
      onLock={wallet.handleLock}
      onLogout={wallet.handleLogout}
      showNav={isLoggedIn && navViews.includes(wallet.view)}
      activeView={wallet.view}
      onNavigate={(v) => wallet.setView(v as WalletView)}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
