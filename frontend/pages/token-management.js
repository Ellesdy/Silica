import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther, isAddress } from 'viem';
import Head from 'next/head';
import Header from '../components/Header';
import dynamic from 'next/dynamic';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect'),
  { ssr: false }
);

export default function TokenManagement() {
  const { address, isConnected } = useAccount();
  const [networkInfo, setNetworkInfo] = useState({ name: 'Loading...', contracts: {} });
  const [balance, setBalance] = useState('0');
  const [votingPower, setVotingPower] = useState('0');
  const [currentDelegate, setCurrentDelegate] = useState(null);
  
  // Form state
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    transferTo: '',
    transferAmount: '',
    delegateTo: ''
  });
  
  // Transaction state
  const [pendingTx, setPendingTx] = useState(null);
  const [txResult, setTxResult] = useState({ status: '', message: '', hash: '' });
  
  // Transaction history
  const [txHistory, setTxHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const silicaTokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function getVotes(address account) external view returns (uint256)",
    "function delegates(address account) external view returns (address)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function delegate(address delegatee) external",
    "function symbol() external view returns (string)"
  ];

  const { writeContract } = useWriteContract();
  
  // Fetch deployment info
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
  
  // Read token balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: networkInfo.contracts?.SilicaToken,
    abi: silicaTokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!networkInfo.contracts?.SilicaToken && !!address,
  });
  
  // Read voting power
  const { data: votesData, refetch: refetchVotes } = useReadContract({
    address: networkInfo.contracts?.SilicaToken,
    abi: silicaTokenABI,
    functionName: 'getVotes',
    args: [address],
    enabled: isConnected && !!networkInfo.contracts?.SilicaToken && !!address,
  });
  
  // Read current delegate
  const { data: delegateData, refetch: refetchDelegate } = useReadContract({
    address: networkInfo.contracts?.SilicaToken,
    abi: silicaTokenABI,
    functionName: 'delegates',
    args: [address],
    enabled: isConnected && !!networkInfo.contracts?.SilicaToken && !!address,
  });
  
  // Update state when data changes
  useEffect(() => {
    if (balanceData) {
      setBalance(formatEther(balanceData));
    }
    if (votesData) {
      setVotingPower(formatEther(votesData));
    }
    if (delegateData) {
      setCurrentDelegate(delegateData);
    }
  }, [balanceData, votesData, delegateData]);
  
  // Refresh all data
  const refreshData = () => {
    if (isConnected) {
      refetchBalance();
      refetchVotes();
      refetchDelegate();
      fetchTransactionHistory();
    }
  };
  
  // Validate address format
  const validateAddress = (address) => {
    if (!address) return 'Address is required';
    if (!isAddress(address)) return 'Invalid address format';
    if (address === ethers.ZeroAddress) return 'Cannot use zero address';
    return '';
  };

  // Validate amount
  const validateAmount = (amount, maxAmount) => {
    if (!amount) return 'Amount is required';
    if (isNaN(parseFloat(amount))) return 'Amount must be a number';
    if (parseFloat(amount) <= 0) return 'Amount must be greater than 0';
    
    try {
      const parsedAmount = parseEther(amount);
      if (maxAmount && parsedAmount > maxAmount) {
        return 'Amount exceeds your balance';
      }
    } catch (error) {
      return 'Invalid amount format';
    }
    
    return '';
  };

  // Validate form input
  const validateTransferForm = () => {
    const errors = {
      transferTo: validateAddress(transferTo),
      transferAmount: validateAmount(transferAmount, balanceData)
    };
    
    setFormErrors({
      ...formErrors,
      transferTo: errors.transferTo,
      transferAmount: errors.transferAmount
    });
    
    return !errors.transferTo && !errors.transferAmount;
  };

  // Validate delegation form
  const validateDelegateForm = () => {
    const errors = {
      delegateTo: validateAddress(delegateTo)
    };
    
    setFormErrors({
      ...formErrors,
      delegateTo: errors.delegateTo
    });
    
    return !errors.delegateTo;
  };

  // Handle input changes
  const handleTransferToChange = (e) => {
    const value = e.target.value;
    setTransferTo(value);
    if (value) {
      setFormErrors({
        ...formErrors,
        transferTo: validateAddress(value)
      });
    }
  };

  const handleTransferAmountChange = (e) => {
    const value = e.target.value;
    setTransferAmount(value);
    if (value) {
      setFormErrors({
        ...formErrors,
        transferAmount: validateAmount(value, balanceData)
      });
    }
  };

  const handleDelegateToChange = (e) => {
    const value = e.target.value;
    setDelegateTo(value);
    if (value) {
      setFormErrors({
        ...formErrors,
        delegateTo: validateAddress(value)
      });
    }
  };

  // Transfer tokens
  const handleTransfer = async () => {
    if (!isConnected || !networkInfo.contracts?.SilicaToken) {
      setTxResult({ 
        status: 'error', 
        message: 'Please connect your wallet first',
        hash: ''
      });
      return;
    }
    
    if (!validateTransferForm()) {
      // Form validation failed, errors are already set
      setTxResult({ 
        status: 'error', 
        message: 'Please fix the form errors before submitting',
        hash: ''
      });
      return;
    }
    
    try {
      const amount = parseEther(transferAmount);
      
      setPendingTx('transfer');
      setTxResult({ status: 'pending', message: 'Transaction pending...', hash: '' });
      
      const hash = await writeContract({
        address: networkInfo.contracts.SilicaToken,
        abi: silicaTokenABI,
        functionName: 'transfer',
        args: [transferTo, amount]
      });
      
      setTxResult({ 
        status: 'success', 
        message: `Successfully sent ${transferAmount} SIL tokens to ${transferTo.substring(0, 6)}...${transferTo.substring(transferTo.length - 4)}`,
        hash
      });
      
      // Reset form
      setTransferTo('');
      setTransferAmount('');
      setFormErrors({
        ...formErrors,
        transferTo: '',
        transferAmount: ''
      });
      
      // Refresh data after a short delay
      setTimeout(() => refreshData(), 2000);
    } catch (error) {
      console.error("Transfer error:", error);
      setTxResult({ 
        status: 'error', 
        message: error.message || 'Failed to transfer tokens. Try again later.',
        hash: ''
      });
    } finally {
      setPendingTx(null);
    }
  };
  
  // Delegate voting power
  const handleDelegate = async () => {
    if (!isConnected || !networkInfo.contracts?.SilicaToken) {
      setTxResult({ 
        status: 'error', 
        message: 'Please connect your wallet first',
        hash: ''
      });
      return;
    }
    
    if (!validateDelegateForm()) {
      // Form validation failed, errors are already set
      setTxResult({ 
        status: 'error', 
        message: 'Please fix the form errors before submitting',
        hash: ''
      });
      return;
    }
    
    try {
      setPendingTx('delegate');
      setTxResult({ status: 'pending', message: 'Transaction pending...', hash: '' });
      
      const hash = await writeContract({
        address: networkInfo.contracts.SilicaToken,
        abi: silicaTokenABI,
        functionName: 'delegate',
        args: [delegateTo]
      });
      
      setTxResult({ 
        status: 'success', 
        message: `Successfully delegated voting power to ${delegateTo.substring(0, 6)}...${delegateTo.substring(delegateTo.length - 4)}`,
        hash
      });
      
      // Reset form
      setDelegateTo('');
      setFormErrors({
        ...formErrors,
        delegateTo: ''
      });
      
      // Refresh data after a short delay
      setTimeout(() => refreshData(), 2000);
    } catch (error) {
      console.error("Delegation error:", error);
      setTxResult({ 
        status: 'error', 
        message: error.message || 'Failed to delegate voting power. Try again later.',
        hash: ''
      });
    } finally {
      setPendingTx(null);
    }
  };
  
  // Self-delegate voting power
  const handleSelfDelegate = async () => {
    if (!isConnected || !networkInfo.contracts?.SilicaToken || !address) {
      setTxResult({ 
        status: 'error', 
        message: 'Please connect your wallet first',
        hash: ''
      });
      return;
    }
    
    try {
      setPendingTx('selfDelegate');
      setTxResult({ status: 'pending', message: 'Transaction pending...', hash: '' });
      
      const hash = await writeContract({
        address: networkInfo.contracts.SilicaToken,
        abi: silicaTokenABI,
        functionName: 'delegate',
        args: [address]
      });
      
      setTxResult({ 
        status: 'success', 
        message: `Successfully self-delegated voting power`,
        hash
      });
      
      // Refresh data after a short delay
      setTimeout(() => refreshData(), 2000);
    } catch (error) {
      console.error("Self-delegation error:", error);
      setTxResult({ 
        status: 'error', 
        message: error.message || 'Failed to self-delegate. Try again later.',
        hash: ''
      });
    } finally {
      setPendingTx(null);
    }
  };
  
  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    if (!isConnected || !address) return;
    
    setLoadingHistory(true);
    try {
      // In a real app, this would be an API call to get transaction history
      // For this example, we'll simulate it with a timeout
      setTimeout(() => {
        setTxHistory([
          {
            type: 'Transfer',
            amount: '100',
            counterparty: '0x1234...5678',
            timestamp: Date.now() - 86400000,
            hash: '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
          },
          {
            type: 'Received',
            amount: '500',
            counterparty: '0x8765...4321',
            timestamp: Date.now() - 172800000,
            hash: '0xdcba4321dcba4321dcba4321dcba4321dcba4321dcba4321dcba4321dcba4321'
          }
        ]);
        setLoadingHistory(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setLoadingHistory(false);
    }
  };
  
  // Initialize
  useEffect(() => {
    if (isConnected) {
      fetchTransactionHistory();
    }
  }, [isConnected, address]);
  
  // Format address for display
  const formatAddress = (addr) => {
    if (!addr || addr === ethers.ZeroAddress) return 'None';
    if (addr === address) return 'Self';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="container">
      <Head>
        <title>Token Management | Silica</title>
        <meta name="description" content="Manage your Silica tokens, transfer to others, and delegate voting power" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="main">
        <section className="token-management">
          <h1 className="page-title">Token Management</h1>
          
          {!isConnected ? (
            <div className="connect-prompt">
              <p>Please connect your wallet to manage your SIL tokens</p>
              <WalletConnect />
            </div>
          ) : (
            <>
              <div className="token-stats">
                <div className="stat-card">
                  <h3>SIL Token Balance</h3>
                  <div className="stat-value">{Number(balance).toLocaleString()}</div>
                  <p className="stat-desc">Your current token balance</p>
                </div>
                
                <div className="stat-card">
                  <h3>Voting Power</h3>
                  <div className="stat-value">{Number(votingPower).toLocaleString()}</div>
                  <p className="stat-desc">Your current governance voting power</p>
                </div>
                
                <div className="stat-card">
                  <h3>Current Delegate</h3>
                  <div className="stat-value delegate">
                    {formatAddress(currentDelegate)}
                  </div>
                  <p className="stat-desc">Address with your delegated voting power</p>
                </div>
              </div>
              
              <div className="token-actions">
                <div className="action-card">
                  <h3>Transfer Tokens</h3>
                  <div className="form-group">
                    <label htmlFor="transferTo">Recipient Address</label>
                    <input
                      id="transferTo"
                      type="text"
                      placeholder="0x..."
                      value={transferTo}
                      onChange={handleTransferToChange}
                      className={formErrors.transferTo ? 'input-error' : ''}
                    />
                    {formErrors.transferTo && (
                      <p className="error-message">{formErrors.transferTo}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="transferAmount">Amount (SIL)</label>
                    <input
                      id="transferAmount"
                      type="text"
                      placeholder="0.0"
                      value={transferAmount}
                      onChange={handleTransferAmountChange}
                      className={formErrors.transferAmount ? 'input-error' : ''}
                    />
                    {formErrors.transferAmount && (
                      <p className="error-message">{formErrors.transferAmount}</p>
                    )}
                    <p className="balance-info">Available: {Number(balance).toLocaleString()} SIL</p>
                  </div>
                  <button 
                    className="action-button primary"
                    onClick={handleTransfer}
                    disabled={pendingTx === 'transfer' || !!formErrors.transferTo || !!formErrors.transferAmount}
                  >
                    {pendingTx === 'transfer' ? 'Transferring...' : 'Transfer Tokens'}
                  </button>
                </div>
                
                <div className="action-card">
                  <h3>Delegate Voting Power</h3>
                  <div className="form-group">
                    <label htmlFor="delegateTo">Delegate Address</label>
                    <input
                      id="delegateTo"
                      type="text"
                      placeholder="0x..."
                      value={delegateTo}
                      onChange={handleDelegateToChange}
                      className={formErrors.delegateTo ? 'input-error' : ''}
                    />
                    {formErrors.delegateTo && (
                      <p className="error-message">{formErrors.delegateTo}</p>
                    )}
                  </div>
                  <button 
                    className="action-button primary"
                    onClick={handleDelegate}
                    disabled={pendingTx === 'delegate' || !!formErrors.delegateTo}
                  >
                    {pendingTx === 'delegate' ? 'Delegating...' : 'Delegate to Address'}
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={handleSelfDelegate}
                    disabled={pendingTx === 'selfDelegate'}
                  >
                    {pendingTx === 'selfDelegate' ? 'Delegating...' : 'Self-Delegate'}
                  </button>
                </div>
              </div>
              
              {txResult.status && (
                <div className={`tx-result ${txResult.status}`}>
                  <p>{txResult.message}</p>
                  {txResult.hash && (
                    <a 
                      href={`https://${networkInfo.network === 'mainnet' ? '' : networkInfo.network + '.'}etherscan.io/tx/${txResult.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View transaction
                    </a>
                  )}
                </div>
              )}
              
              <div className="transaction-history">
                <h3>Recent Transactions</h3>
                {loadingHistory ? (
                  <p>Loading transaction history...</p>
                ) : txHistory.length === 0 ? (
                  <p>No recent transactions found</p>
                ) : (
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Address</th>
                        <th>Date</th>
                        <th>Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txHistory.map((tx, index) => (
                        <tr key={index}>
                          <td>{tx.type}</td>
                          <td>{tx.amount} SIL</td>
                          <td>{tx.counterparty}</td>
                          <td>{formatDate(tx.timestamp)}</td>
                          <td>
                            <a 
                              href={`https://${networkInfo.network === 'mainnet' ? '' : networkInfo.network + '.'}etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .main {
          flex: 1;
          padding: 2rem;
        }
        
        .token-management {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .page-title {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          color: var(--text-primary);
          text-align: center;
        }
        
        .connect-prompt {
          text-align: center;
          padding: 3rem;
          background-color: var(--bg-secondary);
          border-radius: 12px;
          margin-bottom: 2rem;
        }
        
        .connect-prompt p {
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
        }
        
        .token-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .stat-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--card-shadow);
          text-align: center;
        }
        
        .stat-card h3 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }
        
        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 1rem 0;
          color: var(--accent-color);
        }
        
        .stat-value.delegate {
          font-size: 1.5rem;
          word-break: break-all;
        }
        
        .stat-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .token-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .action-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--card-shadow);
        }
        
        .action-card h3 {
          font-size: 1.3rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .form-group {
          margin-bottom: 1.2rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.8rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 1rem;
        }
        
        .action-button {
          width: 100%;
          padding: 0.8rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-button.primary {
          background-color: var(--accent-color);
          color: white;
          border: none;
          margin-bottom: 0.8rem;
        }
        
        .action-button.primary:hover {
          background-color: var(--accent-hover);
        }
        
        .action-button.secondary {
          background-color: transparent;
          color: var(--accent-color);
          border: 1px solid var(--accent-color);
        }
        
        .action-button.secondary:hover {
          background-color: rgba(99, 102, 241, 0.1);
        }
        
        .action-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .tx-result {
          padding: 1rem;
          border-radius: 8px;
          margin: 1.5rem 0;
        }
        
        .tx-result.success {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        
        .tx-result.error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .tx-result.pending {
          background-color: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
          color: #eab308;
        }
        
        .tx-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: var(--accent-color);
          text-decoration: underline;
        }
        
        .transaction-history {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--card-shadow);
          margin-top: 2rem;
        }
        
        .transaction-history h3 {
          font-size: 1.3rem;
          margin-bottom: 1.5rem;
        }
        
        .tx-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .tx-table th, .tx-table td {
          padding: 0.8rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        .tx-table th {
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        @media (max-width: 768px) {
          .tx-table {
            display: block;
            overflow-x: auto;
          }
          
          .token-stats, .token-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 