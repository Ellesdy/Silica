import { useState, useEffect, useContext } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import Link from 'next/link';
import { parseEther, formatEther, isAddress } from 'viem';
import { ThemeContext } from './_app';

export default function Transfer() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();
  const { darkMode } = useContext(ThemeContext);
  const [networkInfo, setNetworkInfo] = useState({ name: 'Loading...', contracts: {} });
  
  // Transfer form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Token ABI (only the functions we need)
  const tokenABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];

  // Fetch deployment info on component mount
  useEffect(() => {
    async function fetchDeployment() {
      try {
        const response = await fetch('/api/deployment');
        if (response.ok) {
          const data = await response.json();
          setNetworkInfo(data);
        }
      } catch (err) {
        console.error("Error fetching deployment data:", err);
      }
    }
    
    fetchDeployment();
  }, []);

  // Read token balance if connected
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: networkInfo.contracts?.SilicaToken,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!networkInfo.contracts?.SilicaToken && !!address,
  });

  // Update balance when data changes
  useEffect(() => {
    if (balanceData) {
      setBalance(formatEther(balanceData));
    }
  }, [balanceData]);

  // Transfer function using wagmi's useWriteContract
  const { writeContract } = useWriteContract();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }
    
    if (!isAddress(recipient)) {
      setMessage({ text: 'Please enter a valid Ethereum address', type: 'error' });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }
    
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Convert amount to wei
      const amountInWei = parseEther(amount);
      
      // Check if user has enough balance
      if (balanceData && amountInWei > balanceData) {
        throw new Error('Insufficient balance');
      }
      
      // Send transaction
      const hash = await writeContract({ 
        address: networkInfo.contracts.SilicaToken,
        abi: tokenABI,
        functionName: 'transfer',
        args: [recipient, amountInWei]
      });
      
      setTxHash(hash);
      setMessage({ 
        text: `Successfully sent ${amount} SIL tokens to ${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`, 
        type: 'success' 
      });
      
      // Reset form
      setRecipient('');
      setAmount('');
      
      // Refresh balance
      setTimeout(() => refetchBalance(), 3000);
    } catch (error) {
      console.error("Error transferring tokens:", error);
      setMessage({ 
        text: error.message || 'Failed to transfer tokens. Try again later.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Transfer Tokens | Silica AI Platform</title>
        <meta name="description" content="Transfer SIL tokens to another address" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="section">
          <h1 className="title">Transfer SIL Tokens</h1>
          <p className="description">
            Send tokens to another wallet address
          </p>
          
          {!isConnected ? (
            <div className="connect-prompt">
              <p>Please connect your wallet to transfer tokens</p>
              <button className="button" onClick={() => connect()}>
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="transfer-container">
              <div className="wallet-info">
                <p>Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</p>
                <p className="balance">Your Balance: {parseFloat(balance).toFixed(4)} SIL</p>
              </div>
              
              <form className="transfer-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="recipient">Recipient Address</label>
                  <input
                    type="text"
                    id="recipient"
                    className="form-control"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    placeholder="0x..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <div className="amount-input-container">
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      id="amount"
                      className="form-control"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.0"
                    />
                    <span className="token-symbol">SIL</span>
                    <button 
                      type="button" 
                      className="max-button"
                      onClick={() => setAmount(balance)}
                    >
                      MAX
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="button" 
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Tokens'}
                </button>
                
                {message.text && (
                  <div className={`message ${message.type}`}>
                    <p>{message.text}</p>
                    {txHash && (
                      <a 
                        href={`https://${networkInfo.network}.etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        View transaction
                      </a>
                    )}
                  </div>
                )}
              </form>
              
              <div className="navigation-links">
                <Link href="/" className="back-link">
                  ← Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          Powered by <span className="highlight">Silica DAO</span>
        </p>
      </footer>

      <style jsx>{`
        .transfer-container {
          width: 100%;
          max-width: 600px;
          margin: 2rem auto;
        }
        
        .transfer-form {
          padding: 2rem;
          background-color: var(--card-bg);
          border-radius: 12px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
          margin: 2rem 0;
        }
        
        .wallet-info {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .balance {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--accent-color);
          margin: 0.5rem 0;
        }
        
        .connect-prompt {
          text-align: center;
          margin: 4rem 0;
        }
        
        .amount-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .token-symbol {
          position: absolute;
          right: 70px;
          color: var(--text-secondary);
        }
        
        .max-button {
          position: absolute;
          right: 12px;
          background-color: rgba(0, 112, 243, 0.1);
          color: var(--accent-color);
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .max-button:hover {
          background-color: rgba(0, 112, 243, 0.2);
        }
        
        .message {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .message.success {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--success-color);
          color: var(--success-color);
        }
        
        .message.error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error-color);
          color: var(--error-color);
        }
        
        .tx-link {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        
        .navigation-links {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .back-link {
          color: var(--accent-color);
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 