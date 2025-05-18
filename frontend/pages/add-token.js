import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Head from 'next/head';
import Link from 'next/link';

export default function AddToken() {
  const { address, isConnected } = useAccount();
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAdded, setTokenAdded] = useState(false);
  const [error, setError] = useState('');
  const [networkName, setNetworkName] = useState('');

  useEffect(() => {
    async function fetchDeployment() {
      try {
        const response = await fetch('/api/deployment');
        if (response.ok) {
          const data = await response.json();
          setTokenAddress(data.contracts.SilicaToken);
          setNetworkName(data.network);
        }
      } catch (err) {
        console.error("Error fetching token address:", err);
        setError("Failed to load token address");
      }
    }
    
    fetchDeployment();
  }, []);

  async function addTokenToWallet() {
    if (!window.ethereum) {
      setError("MetaMask not detected!");
      return;
    }

    try {
      setError('');
      
      // Request to add the token to user's wallet
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: 'SIL',
            decimals: 18,
            image: 'https://raw.githubusercontent.com/your-repo/silica/main/frontend/public/silica-logo.png', // Update this URL
          },
        },
      });

      if (wasAdded) {
        setTokenAdded(true);
      }
    } catch (error) {
      console.error("Error adding token:", error);
      setError("Failed to add token to wallet");
    }
  }

  return (
    <div className="container">
      <Head>
        <title>Add Silica Token to Wallet</title>
        <meta name="description" content="Add the Silica token to your MetaMask wallet" />
      </Head>

      <main className="main">
        <h1>Add Silica Token to Wallet</h1>
        
        {!isConnected ? (
          <div className="connect-prompt">
            <p>Please connect your wallet first.</p>
            <Link href="/">Back to Home</Link>
          </div>
        ) : (
          <div className="token-info">
            <p className="network-info">
              Network: <strong>{networkName}</strong>
            </p>
            
            <p className="token-address">
              Token Address: <code>{tokenAddress}</code>
            </p>
            
            <div className="button-container">
              <button 
                onClick={addTokenToWallet}
                disabled={!tokenAddress || tokenAdded}
                className="add-token-button"
              >
                {tokenAdded ? 'Token Added ✓' : 'Add Token to MetaMask'}
              </button>
            </div>
            
            {error && <p className="error">{error}</p>}
            
            {tokenAdded && (
              <div className="success-message">
                <p>Token added successfully!</p>
                <Link href="/ai-marketplace">Go to AI Marketplace</Link>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .main {
          padding: 2rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          max-width: 800px;
        }

        h1 {
          margin-bottom: 2rem;
          line-height: 1.15;
          font-size: 2.5rem;
          text-align: center;
        }

        .token-info {
          background: white;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 600px;
        }

        .network-info {
          margin-bottom: 1rem;
        }

        .token-address {
          background: #f5f5f5;
          padding: 0.75rem;
          border-radius: 5px;
          font-size: 0.9rem;
          word-break: break-all;
          margin-bottom: 1.5rem;
          border: 1px solid #eaeaea;
        }

        .button-container {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
        }

        .add-token-button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .add-token-button:hover {
          background: #0051a2;
        }

        .add-token-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error {
          color: #d32f2f;
          margin-top: 1rem;
        }

        .success-message {
          margin-top: 1.5rem;
          text-align: center;
          color: #4caf50;
        }

        .success-message a {
          display: inline-block;
          margin-top: 1rem;
          color: #0070f3;
          text-decoration: none;
        }

        .success-message a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
} 