import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';

// Debug utility
const DEBUG = true;
const debug = (...args) => {
  if (DEBUG) {
    console.log('[WalletConnect Debug]', ...args);
  }
};

export default function WalletConnect() {
  const [connectAttempted, setConnectAttempted] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [browserInfo, setBrowserInfo] = useState('Detecting...');
  const [providerInfo, setProviderInfo] = useState('Checking...');
  const [showDebug, setShowDebug] = useState(false);

  const { address, isConnected, status: accountStatus } = useAccount({
    onConnect: (data) => debug('Account connected:', data),
    onDisconnect: () => debug('Account disconnected')
  });

  const { connect, status: connectStatus, error: connectHookError } = useConnect({
    connector: injected(),
    onSuccess: (data) => {
      debug('Connect success', data);
      setConnectError(null);
    },
    onError: (error) => {
      debug('Connect error', error);
      setConnectError(error.message || 'Connection failed');
    },
  });

  const { disconnect, status: disconnectStatus } = useDisconnect({
    onSuccess: () => debug('Disconnect success'),
    onError: (error) => debug('Disconnect error', error)
  });

  // Collect browser/environment info
  useEffect(() => {
    try {
      const info = {
        userAgent: navigator?.userAgent || 'Unknown',
        isPrivateWindow: !window.localStorage,
        cookiesEnabled: navigator?.cookieEnabled,
        providerDetected: !!window.ethereum,
        windowInfo: {
          origin: window.origin,
          location: window.location.href,
        }
      };
      setBrowserInfo(JSON.stringify(info, null, 2));
      debug('Browser info:', info);
    } catch (error) {
      setBrowserInfo(`Error collecting browser info: ${error.message}`);
      debug('Error collecting browser info:', error);
    }
  }, []);

  // Collect provider info
  useEffect(() => {
    try {
      if (window.ethereum) {
        const info = {
          isMetaMask: window.ethereum.isMetaMask,
          chainId: window.ethereum.chainId,
          selectedAddress: window.ethereum.selectedAddress,
          networkVersion: window.ethereum.networkVersion,
          isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
          isConnected: window.ethereum.isConnected?.() || false,
        };
        setProviderInfo(JSON.stringify(info, null, 2));
        debug('Provider info:', info);
      } else {
        setProviderInfo('No Ethereum provider detected');
        debug('No Ethereum provider detected');
      }
    } catch (error) {
      setProviderInfo(`Error collecting provider info: ${error.message}`);
      debug('Error collecting provider info:', error);
    }
  }, []);

  // Attempt direct connection to provider
  const attemptDirectProviderConnect = async () => {
    try {
      debug('Attempting direct provider connection');
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      // Try requesting accounts directly
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      debug('Direct provider connect success:', accounts);
      return true;
    } catch (error) {
      debug('Direct provider connect error:', error);
      setConnectError(`Direct connect error: ${error.message}`);
      return false;
    }
  };

  // Try to connect on component mount with delayed retry
  useEffect(() => {
    debug('Component mounted, connection status:', isConnected);
    
    // Don't attempt to connect if already connected
    if (isConnected) {
      debug('Already connected, skipping auto-connect');
      return;
    }

    const connectWithRetries = async () => {
      debug('Starting connection attempt');
      setConnectAttempted(true);
      
      try {
        // Check if provider exists
        if (!window.ethereum) {
          debug('No provider detected');
          setConnectError('No Ethereum provider detected. Please install MetaMask.');
          return;
        }

        // Try wagmi connect first
        debug('Attempting wagmi connect');
        try {
          await connect();
          debug('Wagmi connect initiated');
        } catch (error) {
          debug('Wagmi connect failed, trying direct provider connect:', error);
          
          // If wagmi fails, try direct provider connection
          const directConnectResult = await attemptDirectProviderConnect();
          if (!directConnectResult) {
            setConnectError('All connection attempts failed. Please try connecting manually.');
          }
        }
      } catch (error) {
        debug('Connection error in effect:', error);
        setConnectError(`Error connecting: ${error.message || 'Unknown error'}`);
      }
    };

    // Delay connection attempt to ensure everything is loaded
    const timer = setTimeout(() => {
      connectWithRetries();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Update when connect error changes from hook
  useEffect(() => {
    if (connectHookError) {
      debug('Connect hook error updated:', connectHookError);
      setConnectError(connectHookError.message || 'Connection error');
    }
  }, [connectHookError]);

  // Render connected state
  if (isConnected && address) {
    debug('Rendering connected state for address:', address);
    return (
      <div className="wallet-connected">
        <span data-testid="connected-address">
          {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </span>
        <button 
          onClick={() => {
            debug('Disconnect button clicked');
            disconnect();
          }}
          className="wallet-button disconnect"
          data-testid="disconnect-button"
        >
          Disconnect
        </button>
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          className="debug-toggle"
          style={{ fontSize: '10px', marginLeft: '5px' }}
        >
          {showDebug ? 'Hide Debug' : 'Debug'}
        </button>
        
        {showDebug && (
          <div className="debug-info" style={{ fontSize: '10px', margin: '10px 0', padding: '5px', background: '#f0f0f0', borderRadius: '4px' }}>
            <div>Status: {accountStatus}</div>
            <div>Connection Status: {connectStatus}</div>
            <div>Disconnect Status: {disconnectStatus}</div>
          </div>
        )}
      </div>
    );
  }

  // Render connection UI
  debug('Rendering connection UI, status:', connectStatus);
  return (
    <div className="wallet-connect-wrapper">
      <button 
        onClick={async () => {
          debug('Connect button clicked');
          setConnectAttempted(true);
          try {
            // Try wagmi connect
            await connect();
          } catch (wagmiError) {
            debug('Wagmi connect failed on click, trying direct:', wagmiError);
            
            // Fallback to direct connect
            await attemptDirectProviderConnect();
          }
        }}
        className="wallet-button connect"
        data-testid="connect-button"
        disabled={connectStatus === 'pending'}
      >
        {connectStatus === 'pending' ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {connectError && (
        <div className="connect-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
          {connectError}
        </div>
      )}
      
      <button 
        onClick={() => setShowDebug(!showDebug)} 
        className="debug-toggle"
        style={{ fontSize: '10px', marginTop: '5px' }}
      >
        {showDebug ? 'Hide Debug' : 'Show Debug Info'}
      </button>
      
      {showDebug && (
        <div className="debug-info" style={{ 
          fontSize: '10px', 
          margin: '10px 0', 
          padding: '5px', 
          background: '#f0f0f0', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          <div><strong>Connection Attempted:</strong> {connectAttempted ? 'Yes' : 'No'}</div>
          <div><strong>Connect Status:</strong> {connectStatus}</div>
          <div><strong>Has Provider:</strong> {window.ethereum ? 'Yes' : 'No'}</div>
          <div><strong>Browser Info:</strong> <pre>{browserInfo}</pre></div>
          <div><strong>Provider Info:</strong> <pre>{providerInfo}</pre></div>
          <button onClick={attemptDirectProviderConnect} style={{ fontSize: '10px', marginTop: '5px' }}>
            Try Direct Connect
          </button>
        </div>
      )}
    </div>
  );
} 