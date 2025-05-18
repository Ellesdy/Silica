import { useState, useEffect } from 'react';

// Simple wallet connector that bypasses wagmi and connects directly to the provider
export default function FallbackWalletConnect() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    // Initial check for connected accounts
    const checkAccounts = async () => {
      try {
        // This is a non-intrusive way to check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          
          // Get chain ID
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(chainId);
        }
      } catch (err) {
        console.error('Failed to check accounts:', err);
      }
    };
    
    checkAccounts();

    // Set up listeners for account and chain changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected
        setAddress(null);
        setIsConnected(false);
      } else {
        // Account changed
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(chainId);
      // Recommended to reload the page on chain change
      // window.location.reload();
    };

    const handleDisconnect = (error) => {
      console.log('Provider disconnected:', error);
      setAddress(null);
      setIsConnected(false);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      // Clean up listeners
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask.');
      }

      // Request accounts - this will prompt the user
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // Get chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainId);
      } else {
        throw new Error('No accounts returned. User likely rejected the connection.');
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // Note: There is no standard method to disconnect in EIP-1193
    // We can only "forget" the connection on our side
    setAddress(null);
    setIsConnected(false);
    console.log('Wallet disconnected locally. The provider may still show as connected.');
  };

  // Format chain ID to readable network name
  const getNetworkName = () => {
    if (!chainId) return 'Unknown';
    
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten',
      '0x4': 'Rinkeby',
      '0x5': 'Goerli',
      '0xaa36a7': 'Sepolia',
      '0x7a69': 'Hardhat Local', // 31337 in hex
      '0x539': 'Local Development' // 1337 in hex
    };
    
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  if (isConnected && address) {
    return (
      <div className="fallback-wallet-connected">
        <div className="wallet-info">
          <span className="wallet-address">
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </span>
          <span className="wallet-network">
            {getNetworkName()}
          </span>
        </div>
        <button 
          onClick={disconnectWallet}
          className="fallback-wallet-button disconnect"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="fallback-wallet-connect">
      <button 
        onClick={connectWallet}
        disabled={isConnecting}
        className="fallback-wallet-button connect"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet (Direct)'}
      </button>
      
      {error && (
        <div className="fallback-error">
          {error}
        </div>
      )}
      
      <style jsx>{`
        .fallback-wallet-connect {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .fallback-wallet-connected {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .wallet-info {
          display: flex;
          flex-direction: column;
          font-size: 0.9rem;
        }
        
        .wallet-network {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        
        .fallback-wallet-button {
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .fallback-wallet-button.connect {
          background-color: var(--accent-color);
          color: white;
        }
        
        .fallback-wallet-button.connect:hover {
          background-color: var(--accent-hover);
        }
        
        .fallback-wallet-button.disconnect {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .fallback-wallet-button.disconnect:hover {
          background-color: rgba(239, 68, 68, 0.2);
        }
        
        .fallback-wallet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .fallback-error {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
} 