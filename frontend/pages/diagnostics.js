import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect'),
  { ssr: false }
);

export default function Diagnostics() {
  const [logs, setLogs] = useState([]);
  const [storageTestResult, setStorageTestResult] = useState('Not tested');
  const [cookieTestResult, setCookieTestResult] = useState('Not tested');
  const [providerTestResult, setProviderTestResult] = useState('Not tested');
  const [directConnectionResult, setDirectConnectionResult] = useState('Not tested');
  const [localStorageItems, setLocalStorageItems] = useState('None');
  
  const { address, isConnected } = useAccount();
  const { connect, error: connectError } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();

  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, timestamp, type }]);
  };

  // Test localStorage access
  const testLocalStorage = () => {
    try {
      log('Testing localStorage...');
      const testKey = 'silica_storage_test';
      const testValue = 'test_' + Date.now();
      
      // Try to write
      window.localStorage.setItem(testKey, testValue);
      
      // Try to read
      const readValue = window.localStorage.getItem(testKey);
      
      // Try to delete
      window.localStorage.removeItem(testKey);
      
      if (readValue === testValue) {
        setStorageTestResult('SUCCESS: localStorage is working properly');
        log('localStorage test passed', 'success');
      } else {
        setStorageTestResult(`FAILURE: Read value (${readValue}) did not match written value (${testValue})`);
        log('localStorage test failed - values don\'t match', 'error');
      }
    } catch (error) {
      setStorageTestResult(`ERROR: ${error.message}`);
      log(`localStorage test error: ${error.message}`, 'error');
    }
  };

  // Test cookie access
  const testCookies = () => {
    try {
      log('Testing cookies...');
      const testCookie = 'silica_cookie_test=test_' + Date.now();
      
      // Try to write
      document.cookie = testCookie + '; path=/';
      
      // Check if cookie was set
      if (document.cookie.indexOf('silica_cookie_test=') !== -1) {
        setCookieTestResult('SUCCESS: Cookies are working');
        log('Cookie test passed', 'success');
      } else {
        setCookieTestResult('FAILURE: Could not set or read cookies');
        log('Cookie test failed', 'error');
      }
    } catch (error) {
      setCookieTestResult(`ERROR: ${error.message}`);
      log(`Cookie test error: ${error.message}`, 'error');
    }
  };

  // Test Ethereum provider
  const testProvider = () => {
    try {
      log('Testing Ethereum provider...');
      
      if (!window.ethereum) {
        setProviderTestResult('ERROR: No Ethereum provider found (MetaMask not installed or not accessible)');
        log('No Ethereum provider found', 'error');
        return;
      }
      
      const providerInfo = {
        isMetaMask: window.ethereum.isMetaMask,
        chainId: window.ethereum.chainId,
        networkVersion: window.ethereum.networkVersion,
        selectedAddress: window.ethereum.selectedAddress,
        isConnected: window.ethereum.isConnected?.() || 'N/A',
      };
      
      setProviderTestResult(`SUCCESS: Provider detected\n${JSON.stringify(providerInfo, null, 2)}`);
      log('Ethereum provider found', 'success');
    } catch (error) {
      setProviderTestResult(`ERROR: ${error.message}`);
      log(`Provider test error: ${error.message}`, 'error');
    }
  };

  // Try direct wallet connection
  const connectDirectly = async () => {
    try {
      log('Attempting direct wallet connection...');
      
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        setDirectConnectionResult(`SUCCESS: Connected to ${accounts[0]}`);
        log(`Direct connection successful: ${accounts[0]}`, 'success');
      } else {
        setDirectConnectionResult('FAILURE: No accounts returned');
        log('No accounts returned from provider', 'error');
      }
    } catch (error) {
      setDirectConnectionResult(`ERROR: ${error.message}`);
      log(`Direct connection error: ${error.message}`, 'error');
    }
  };

  // List localStorage contents
  const listLocalStorage = () => {
    try {
      log('Listing localStorage contents...');
      
      if (!window.localStorage) {
        setLocalStorageItems('ERROR: localStorage not available');
        return;
      }
      
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        let value = localStorage.getItem(key);
        
        // Truncate long values
        if (value && value.length > 50) {
          value = value.substring(0, 50) + '...';
        }
        
        items[key] = value;
      }
      
      if (Object.keys(items).length === 0) {
        setLocalStorageItems('No items in localStorage');
      } else {
        setLocalStorageItems(JSON.stringify(items, null, 2));
      }
    } catch (error) {
      setLocalStorageItems(`ERROR: ${error.message}`);
    }
  };

  // Clear all diagnostic results
  const clearDiagnostics = () => {
    setLogs([]);
    setStorageTestResult('Not tested');
    setCookieTestResult('Not tested');
    setProviderTestResult('Not tested');
    setDirectConnectionResult('Not tested');
    setLocalStorageItems('None');
    log('Diagnostics cleared');
  };

  // Automatically run a basic check on load
  useEffect(() => {
    const runInitialChecks = () => {
      log('Running initial checks...');

      // Check if running in browser
      if (typeof window === 'undefined') {
        log('Not running in browser environment!', 'error');
        return;
      }

      // Check for localStorage
      try {
        if (window.localStorage) {
          log('localStorage is available', 'success');
        } else {
          log('localStorage is NOT available', 'error');
        }
      } catch (error) {
        log(`localStorage check error: ${error.message}`, 'error');
      }

      // Check for ethereum provider
      try {
        if (window.ethereum) {
          log('Ethereum provider detected', 'success');
        } else {
          log('No Ethereum provider detected', 'warning');
        }
      } catch (error) {
        log(`Provider check error: ${error.message}`, 'error');
      }

      // Check browser info
      log(`Browser: ${navigator.userAgent}`);
      log(`Cookies enabled: ${navigator.cookieEnabled}`);
      log(`Private mode detection: ${!window.localStorage ? 'Possibly in private mode' : 'Not in private mode'}`);
    };

    // Delay the checks to ensure the page is fully loaded
    const timer = setTimeout(runInitialChecks, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Silica - Wallet Connection Diagnostics</title>
        <meta name="description" content="Diagnostic tools for wallet connection issues" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main diagnostics-page">
        <h1>Wallet Connection Diagnostics</h1>
        
        <div className="diagnostics-container">
          <div className="diagnostics-panel">
            <h2>Tests</h2>
            
            <div className="test-buttons">
              <button onClick={testLocalStorage} className="test-button">
                Test localStorage
              </button>
              <button onClick={testCookies} className="test-button">
                Test Cookies
              </button>
              <button onClick={testProvider} className="test-button">
                Test Ethereum Provider
              </button>
              <button onClick={connectDirectly} className="test-button">
                Direct Wallet Connect
              </button>
              <button onClick={listLocalStorage} className="test-button">
                List localStorage Items
              </button>
              <button onClick={clearDiagnostics} className="test-button clear">
                Clear Results
              </button>
            </div>
            
            <div className="test-results">
              <div className="result-item">
                <h3>localStorage Test</h3>
                <pre>{storageTestResult}</pre>
              </div>
              
              <div className="result-item">
                <h3>Cookie Test</h3>
                <pre>{cookieTestResult}</pre>
              </div>
              
              <div className="result-item">
                <h3>Provider Test</h3>
                <pre>{providerTestResult}</pre>
              </div>
              
              <div className="result-item">
                <h3>Direct Connection Test</h3>
                <pre>{directConnectionResult}</pre>
              </div>
              
              <div className="result-item">
                <h3>localStorage Contents</h3>
                <pre>{localStorageItems}</pre>
              </div>
            </div>
          </div>
          
          <div className="wallet-panel">
            <h2>Wallet Connection</h2>
            
            <div className="wallet-status">
              <p><strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
              {isConnected && <p><strong>Address:</strong> {address}</p>}
              {connectError && <p className="error"><strong>Error:</strong> {connectError.message}</p>}
            </div>
            
            <div className="wallet-test">
              <h3>Standard Component</h3>
              <WalletConnect />
            </div>
            
            <div className="wallet-test">
              <h3>Manual Wagmi Connect</h3>
              {!isConnected ? (
                <button onClick={() => connect()} className="wallet-button connect">
                  Connect via Wagmi
                </button>
              ) : (
                <button onClick={() => disconnect()} className="wallet-button disconnect">
                  Disconnect via Wagmi
                </button>
              )}
            </div>
          </div>
          
          <div className="log-panel">
            <h2>Logs</h2>
            <div className="log-container">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="timestamp">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {logs.length === 0 && <p>No logs yet...</p>}
            </div>
          </div>
        </div>
        
        <div className="navigation">
          <Link href="/">
            <span className="nav-link">Back to Home</span>
          </Link>
        </div>
      </main>

      <style jsx>{`
        .diagnostics-page {
          padding-top: 5rem;
        }
        
        .diagnostics-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 20px;
          width: 100%;
        }
        
        .diagnostics-panel {
          grid-column: 1 / 3;
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          box-shadow: var(--card-shadow);
        }
        
        .wallet-panel {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          box-shadow: var(--card-shadow);
        }
        
        .log-panel {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          box-shadow: var(--card-shadow);
        }
        
        .test-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .test-button {
          padding: 8px 12px;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .test-button.clear {
          background: #666;
        }
        
        .test-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .result-item {
          background: var(--bg-secondary);
          padding: 10px;
          border-radius: 4px;
        }
        
        .result-item h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1rem;
        }
        
        pre {
          background: rgba(0, 0, 0, 0.05);
          padding: 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          overflow: auto;
          max-height: 150px;
          white-space: pre-wrap;
        }
        
        .log-container {
          background: #1e1e1e;
          color: #f0f0f0;
          font-family: monospace;
          padding: 10px;
          border-radius: 4px;
          height: 300px;
          overflow: auto;
          font-size: 0.8rem;
        }
        
        .log-entry {
          margin-bottom: 5px;
          line-height: 1.4;
        }
        
        .log-entry.error {
          color: #ff6b6b;
        }
        
        .log-entry.success {
          color: #69db7c;
        }
        
        .log-entry.warning {
          color: #ffd43b;
        }
        
        .timestamp {
          color: #adb5bd;
        }
        
        .navigation {
          margin-top: 30px;
        }
        
        .nav-link {
          color: var(--accent-color);
          cursor: pointer;
        }
        
        .wallet-status {
          margin-bottom: 20px;
        }
        
        .wallet-status .error {
          color: var(--error-color);
        }
        
        .wallet-test {
          margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
          .diagnostics-container {
            grid-template-columns: 1fr;
          }
          
          .diagnostics-panel {
            grid-column: 1;
          }
          
          .test-results {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 