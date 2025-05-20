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

export default function Governance() {
  const { address, isConnected } = useAccount();
  const [networkInfo, setNetworkInfo] = useState({ name: 'Loading...', contracts: {} });
  const [proposals, setProposals] = useState([]);
  const [votingPower, setVotingPower] = useState('0');
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  
  // New proposal form state
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalTarget, setProposalTarget] = useState('');
  const [proposalValue, setProposalValue] = useState('0');
  const [proposalFunction, setProposalFunction] = useState('transfer');
  const [proposalRecipient, setProposalRecipient] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    target: '',
    value: '',
    recipient: '',
    amount: ''
  });

  // Transaction state
  const [pendingTx, setPendingTx] = useState(null);
  const [txResult, setTxResult] = useState({ status: '', message: '', hash: '' });

  const silicaGovernorABI = [
    "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
    "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
    "function state(uint256 proposalId) external view returns (uint8)",
    "function proposalVotes(uint256 proposalId) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
    "function proposalDeadline(uint256 proposalId) external view returns (uint256)",
    "function proposalSnapshot(uint256 proposalId) external view returns (uint256)",
    "function votingDelay() external view returns (uint256)",
    "function votingPeriod() external view returns (uint256)",
    "function quorum(uint256 blockNumber) external view returns (uint256)"
  ];

  const silicaTokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function getVotes(address account) external view returns (uint256)",
    "function symbol() external view returns (string)"
  ];

  const erc20ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)"
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
  
  // Read voting power
  const { data: votesData, refetch: refetchVotes } = useReadContract({
    address: networkInfo.contracts?.SilicaToken,
    abi: silicaTokenABI,
    functionName: 'getVotes',
    args: [address],
    enabled: isConnected && !!networkInfo.contracts?.SilicaToken && !!address,
  });
  
  // Update state when data changes
  useEffect(() => {
    if (votesData) {
      setVotingPower(formatEther(votesData));
    }
  }, [votesData]);
  
  // Fetch current proposals
  const fetchProposals = async () => {
    if (!isConnected || !networkInfo.contracts?.SilicaGovernor) return;
    
    setLoadingProposals(true);
    try {
      // In a production app, this would be an API call to fetch proposal data
      // For this example, we'll use simulated data
      
      setTimeout(() => {
        const mockProposals = [
          {
            id: '0x14a54f5ea11a4708cb011112778ec58238a7d4ab15fc32dae6b0cda6075538c2',
            title: 'Treasury Funding Allocation',
            description: 'Allocate 10,000 SIL tokens to the treasury for future investments',
            proposer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            status: 'Active',
            forVotes: ethers.parseEther('500000'),
            againstVotes: ethers.parseEther('200000'),
            abstainVotes: ethers.parseEther('50000'),
            deadline: Date.now() + 86400000, // 24 hours from now
            targets: [networkInfo.contracts.SilicaToken],
            values: ['0'],
            calldatas: ['0x'],
            actions: [
              {
                target: 'SilicaToken',
                value: '0',
                function: 'transfer',
                params: [networkInfo.contracts.SilicaTreasury, ethers.parseEther('10000')]
              }
            ]
          },
          {
            id: '0x9a2ec328d417df0d0a224a3fa74f044270b7ff60fcb6130a8bd05fec937d1921',
            title: 'Protocol Parameter Update',
            description: 'Update fee structure for AI model usage to 2.5%',
            proposer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            status: 'Queued',
            forVotes: ethers.parseEther('650000'),
            againstVotes: ethers.parseEther('150000'),
            abstainVotes: ethers.parseEther('25000'),
            deadline: Date.now() - 86400000, // 24 hours ago
            targets: [networkInfo.contracts.SilicaModelRegistry],
            values: ['0'],
            calldatas: ['0x'],
            actions: [
              {
                target: 'SilicaModelRegistry',
                value: '0',
                function: 'updateFeePercentage',
                params: ['250'] // 2.5% with 2 decimal places
              }
            ]
          }
        ];
        
        setProposals(mockProposals);
        setLoadingProposals(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setLoadingProposals(false);
    }
  };
  
  // Initialize
  useEffect(() => {
    if (isConnected && networkInfo.contracts?.SilicaGovernor) {
      fetchProposals();
    }
  }, [isConnected, networkInfo.contracts?.SilicaGovernor]);
  
  // Validate address format
  const validateAddress = (address) => {
    if (!address) return 'Address is required';
    if (!isAddress(address)) return 'Invalid address format';
    if (address === ethers.ZeroAddress) return 'Cannot use zero address';
    return '';
  };

  // Validate ETH amount
  const validateEthAmount = (amount) => {
    if (!amount) return '';
    if (isNaN(parseFloat(amount))) return 'Value must be a number';
    if (parseFloat(amount) < 0) return 'Value cannot be negative';
    return '';
  };

  // Validate token amount
  const validateTokenAmount = (amount) => {
    if (!amount) return 'Amount is required';
    if (isNaN(parseFloat(amount))) return 'Amount must be a number';
    if (parseFloat(amount) <= 0) return 'Amount must be greater than 0';
    return '';
  };

  // Validate form input
  const validateProposalForm = () => {
    const errors = {
      title: !proposalTitle ? 'Title is required' : '',
      description: !proposalDescription ? 'Description is required' : '',
      target: validateAddress(proposalTarget),
      value: validateEthAmount(proposalValue),
      recipient: proposalFunction === 'transfer' ? validateAddress(proposalRecipient) : '',
      amount: proposalFunction === 'transfer' ? validateTokenAmount(proposalAmount) : ''
    };
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };

  // Handle input changes with validation
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setProposalTitle(value);
    setFormErrors({
      ...formErrors,
      title: !value ? 'Title is required' : ''
    });
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setProposalDescription(value);
    setFormErrors({
      ...formErrors,
      description: !value ? 'Description is required' : ''
    });
  };

  const handleTargetChange = (e) => {
    const value = e.target.value;
    setProposalTarget(value);
    if (value) {
      setFormErrors({
        ...formErrors,
        target: validateAddress(value)
      });
    }
  };

  const handleValueChange = (e) => {
    const value = e.target.value;
    setProposalValue(value);
    setFormErrors({
      ...formErrors,
      value: validateEthAmount(value)
    });
  };

  const handleRecipientChange = (e) => {
    const value = e.target.value;
    setProposalRecipient(value);
    if (proposalFunction === 'transfer') {
      setFormErrors({
        ...formErrors,
        recipient: validateAddress(value)
      });
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setProposalAmount(value);
    if (proposalFunction === 'transfer') {
      setFormErrors({
        ...formErrors,
        amount: validateTokenAmount(value)
      });
    }
  };

  const handleFunctionChange = (e) => {
    const value = e.target.value;
    setProposalFunction(value);
    // Reset validation errors for function-specific fields
    setFormErrors({
      ...formErrors,
      recipient: '',
      amount: ''
    });
  };

  // Handle proposal creation
  const createProposal = async () => {
    if (!isConnected || !networkInfo.contracts?.SilicaGovernor) {
      setTxResult({ 
        status: 'error', 
        message: 'Please connect your wallet first',
        hash: ''
      });
      return;
    }
    
    if (!validateProposalForm()) {
      setTxResult({ 
        status: 'error', 
        message: 'Please fix the form errors before submitting',
        hash: ''
      });
      return;
    }
    
    try {
      setPendingTx('proposal');
      setTxResult({ status: 'pending', message: 'Creating proposal...', hash: '' });
      
      let targets = [proposalTarget];
      let values = [proposalValue || '0'];
      let calldatas = ['0x'];
      
      // Generate calldata based on function selection
      if (proposalFunction === 'transfer') {
        const amount = parseEther(proposalAmount);
        const erc20Interface = new ethers.Interface(erc20ABI);
        calldatas = [erc20Interface.encodeFunctionData('transfer', [proposalRecipient, amount])];
      }
      
      // Format proposal description with title
      const fullDescription = `# ${proposalTitle}\n\n${proposalDescription}`;
      
      const hash = await writeContract({
        address: networkInfo.contracts.SilicaGovernor,
        abi: silicaGovernorABI,
        functionName: 'propose',
        args: [targets, values, calldatas, fullDescription]
      });
      
      setTxResult({ 
        status: 'success', 
        message: 'Proposal created successfully!',
        hash
      });
      
      // Reset form
      setShowNewProposalForm(false);
      setProposalTitle('');
      setProposalDescription('');
      setProposalTarget('');
      setProposalValue('0');
      setProposalFunction('transfer');
      setProposalRecipient('');
      setProposalAmount('');
      setFormErrors({
        title: '',
        description: '',
        target: '',
        value: '',
        recipient: '',
        amount: ''
      });
      
      // Refresh proposals after a short delay
      setTimeout(() => fetchProposals(), 3000);
    } catch (error) {
      console.error("Proposal creation error:", error);
      setTxResult({ 
        status: 'error', 
        message: error.message || 'Failed to create proposal. Try again later.',
        hash: ''
      });
    } finally {
      setPendingTx(null);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  // Calculate percentage
  const calculatePercentage = (value, total) => {
    if (total === 0n) return 0;
    return Number((value * 100n) / total);
  };

  return (
    <div className="container">
      <Head>
        <title>Governance | Silica</title>
        <meta name="description" content="Participate in Silica DAO governance by creating and voting on proposals" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="main">
        <section className="governance">
          <h1 className="page-title">Governance</h1>
          
          {!isConnected ? (
            <div className="connect-prompt">
              <p>Please connect your wallet to participate in governance</p>
              <WalletConnect />
            </div>
          ) : (
            <>
              <div className="governance-overview">
                <div className="overview-card">
                  <h3>Your Voting Power</h3>
                  <div className="power-value">{Number(votingPower).toLocaleString()} SIL</div>
                  <p className="power-desc">
                    Your voting power is determined by your delegated SIL tokens.
                    <a href="/token-management" className="power-link">Manage delegation</a>
                  </p>
                </div>
                
                <div className="actions-card">
                  <button
                    className="action-button primary"
                    onClick={() => setShowNewProposalForm(true)}
                    disabled={pendingTx === 'proposal'}
                  >
                    Create New Proposal
                  </button>
                  <p className="action-desc">
                    Creating a proposal requires voting power of at least 1% of total supply.
                  </p>
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
              
              {showNewProposalForm && (
                <div className="proposal-form-container">
                  <div className="proposal-form">
                    <div className="form-header">
                      <h3>Create New Proposal</h3>
                      <button
                        className="close-button"
                        onClick={() => setShowNewProposalForm(false)}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="proposalTitle">Title</label>
                      <input
                        id="proposalTitle"
                        type="text"
                        placeholder="Proposal Title"
                        value={proposalTitle}
                        onChange={handleTitleChange}
                        className={formErrors.title ? 'input-error' : ''}
                      />
                      {formErrors.title && (
                        <p className="error-message">{formErrors.title}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="proposalDescription">Description</label>
                      <textarea
                        id="proposalDescription"
                        placeholder="Detailed description of the proposal"
                        value={proposalDescription}
                        onChange={handleDescriptionChange}
                        rows={4}
                        className={formErrors.description ? 'input-error' : ''}
                      />
                      {formErrors.description && (
                        <p className="error-message">{formErrors.description}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="proposalTarget">Contract Target</label>
                      <select
                        id="proposalTarget"
                        value={proposalTarget}
                        onChange={handleTargetChange}
                        className={formErrors.target ? 'input-error' : ''}
                      >
                        <option value="">Select Contract</option>
                        <option value={networkInfo.contracts?.SilicaToken}>SilicaToken</option>
                        <option value={networkInfo.contracts?.SilicaTreasury}>SilicaTreasury</option>
                        <option value={networkInfo.contracts?.SilicaModelRegistry}>SilicaModelRegistry</option>
                        <option value={networkInfo.contracts?.SilicaExecutionEngine}>SilicaExecutionEngine</option>
                      </select>
                      {formErrors.target && (
                        <p className="error-message">{formErrors.target}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="proposalValue">Value (ETH)</label>
                      <input
                        id="proposalValue"
                        type="text"
                        placeholder="0"
                        value={proposalValue}
                        onChange={handleValueChange}
                        className={formErrors.value ? 'input-error' : ''}
                      />
                      {formErrors.value && (
                        <p className="error-message">{formErrors.value}</p>
                      )}
                      <small>Only needed for ETH transfers</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="proposalFunction">Function</label>
                      <select
                        id="proposalFunction"
                        value={proposalFunction}
                        onChange={handleFunctionChange}
                      >
                        <option value="transfer">Token Transfer</option>
                      </select>
                    </div>
                    
                    {proposalFunction === 'transfer' && (
                      <>
                        <div className="form-group">
                          <label htmlFor="proposalRecipient">Recipient</label>
                          <input
                            id="proposalRecipient"
                            type="text"
                            placeholder="0x..."
                            value={proposalRecipient}
                            onChange={handleRecipientChange}
                            className={formErrors.recipient ? 'input-error' : ''}
                          />
                          {formErrors.recipient && (
                            <p className="error-message">{formErrors.recipient}</p>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="proposalAmount">Amount</label>
                          <input
                            id="proposalAmount"
                            type="text"
                            placeholder="0.0"
                            value={proposalAmount}
                            onChange={handleAmountChange}
                            className={formErrors.amount ? 'input-error' : ''}
                          />
                          {formErrors.amount && (
                            <p className="error-message">{formErrors.amount}</p>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="form-actions">
                      <button
                        className="action-button secondary"
                        onClick={() => setShowNewProposalForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="action-button primary"
                        onClick={createProposal}
                        disabled={pendingTx === 'proposal'}
                      >
                        {pendingTx === 'proposal' ? 'Creating...' : 'Create Proposal'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="proposals-tabs">
                <button
                  className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  Active
                </button>
                <button
                  className={`tab-button ${activeTab === 'queued' ? 'active' : ''}`}
                  onClick={() => setActiveTab('queued')}
                >
                  Queued
                </button>
                <button
                  className={`tab-button ${activeTab === 'executed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('executed')}
                >
                  Executed
                </button>
                <button
                  className={`tab-button ${activeTab === 'defeated' ? 'active' : ''}`}
                  onClick={() => setActiveTab('defeated')}
                >
                  Defeated
                </button>
              </div>
              
              <div className="proposals-list">
                {loadingProposals ? (
                  <div className="loading-proposals">Loading proposals...</div>
                ) : proposals.filter(p => p.status.toLowerCase() === activeTab.toLowerCase()).length === 0 ? (
                  <div className="no-proposals">No {activeTab} proposals found</div>
                ) : (
                  proposals
                    .filter(p => p.status.toLowerCase() === activeTab.toLowerCase())
                    .map(proposal => (
                      <div key={proposal.id} className="proposal-card">
                        <div className="proposal-header">
                          <h3 className="proposal-title">{proposal.title}</h3>
                          <span className={`proposal-status ${proposal.status.toLowerCase()}`}>
                            {proposal.status}
                          </span>
                        </div>
                        
                        <p className="proposal-desc">{proposal.description}</p>
                        
                        <div className="proposal-meta">
                          <div className="meta-item">
                            <span className="meta-label">Proposer:</span>
                            <span className="meta-value">{formatAddress(proposal.proposer)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Deadline:</span>
                            <span className="meta-value">{formatDate(proposal.deadline)}</span>
                          </div>
                        </div>
                        
                        <div className="proposal-votes">
                          <div className="votes-header">
                            <span>Votes</span>
                            <span>
                              {Number(ethers.formatEther(proposal.forVotes + proposal.againstVotes + proposal.abstainVotes)).toLocaleString()} SIL total
                            </span>
                          </div>
                          
                          <div className="vote-bars">
                            <div className="vote-bar-container">
                              <div className="vote-bar-label">
                                <span>For</span>
                                <span>{Number(ethers.formatEther(proposal.forVotes)).toLocaleString()} SIL</span>
                              </div>
                              <div className="vote-bar-wrap">
                                <div 
                                  className="vote-bar for" 
                                  style={{ 
                                    width: `${calculatePercentage(
                                      proposal.forVotes, 
                                      proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
                                    )}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="vote-bar-container">
                              <div className="vote-bar-label">
                                <span>Against</span>
                                <span>{Number(ethers.formatEther(proposal.againstVotes)).toLocaleString()} SIL</span>
                              </div>
                              <div className="vote-bar-wrap">
                                <div 
                                  className="vote-bar against" 
                                  style={{ 
                                    width: `${calculatePercentage(
                                      proposal.againstVotes, 
                                      proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
                                    )}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="vote-bar-container">
                              <div className="vote-bar-label">
                                <span>Abstain</span>
                                <span>{Number(ethers.formatEther(proposal.abstainVotes)).toLocaleString()} SIL</span>
                              </div>
                              <div className="vote-bar-wrap">
                                <div 
                                  className="vote-bar abstain" 
                                  style={{ 
                                    width: `${calculatePercentage(
                                      proposal.abstainVotes, 
                                      proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
                                    )}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          {proposal.status === 'Active' && (
                            <div className="vote-actions">
                              <button className="vote-button for">Vote For</button>
                              <button className="vote-button against">Vote Against</button>
                              <button className="vote-button abstain">Abstain</button>
                            </div>
                          )}
                          
                          {proposal.status === 'Queued' && (
                            <div className="proposal-actions">
                              <button className="action-button primary">Execute</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
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
        
        .governance {
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
        
        .governance-overview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }
        
        .overview-card, .actions-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--card-shadow);
        }
        
        .overview-card h3 {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }
        
        .power-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0.75rem 0;
          color: var(--accent-color);
        }
        
        .power-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        .power-link {
          display: inline-block;
          margin-left: 0.5rem;
          color: var(--accent-color);
          text-decoration: underline;
        }
        
        .actions-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .action-button {
          padding: 0.8rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1rem;
        }
        
        .action-button.primary {
          background-color: var(--accent-color);
          color: white;
          border: none;
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
        
        .action-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
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
        
        .proposal-form-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }
        
        .proposal-form {
          background-color: var(--bg-primary);
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .form-header h3 {
          font-size: 1.5rem;
          margin: 0;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }
        
        .form-group {
          margin-bottom: 1.2rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 0.8rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 1rem;
        }
        
        .form-group small {
          display: block;
          margin-top: 0.3rem;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .form-actions button {
          min-width: 120px;
        }
        
        .proposals-tabs {
          display: flex;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .tab-button {
          padding: 0.8rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }
        
        .tab-button:hover {
          color: var(--text-primary);
        }
        
        .tab-button.active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
        }
        
        .proposals-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .loading-proposals, .no-proposals {
          text-align: center;
          padding: 3rem;
          background-color: var(--bg-secondary);
          border-radius: 12px;
          color: var(--text-secondary);
        }
        
        .proposal-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--card-shadow);
        }
        
        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .proposal-title {
          font-size: 1.3rem;
          margin: 0;
        }
        
        .proposal-status {
          padding: 0.3rem 0.6rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .proposal-status.active {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .proposal-status.queued {
          background-color: rgba(234, 179, 8, 0.1);
          color: #eab308;
        }
        
        .proposal-status.executed {
          background-color: rgba(99, 102, 241, 0.1);
          color: var(--accent-color);
        }
        
        .proposal-status.defeated {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .proposal-desc {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        .proposal-meta {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }
        
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        
        .meta-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .meta-value {
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .proposal-votes {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }
        
        .votes-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        
        .vote-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .vote-bar-container {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        
        .vote-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        
        .vote-bar-wrap {
          height: 8px;
          background-color: var(--bg-secondary);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .vote-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .vote-bar.for {
          background-color: #10b981;
        }
        
        .vote-bar.against {
          background-color: #ef4444;
        }
        
        .vote-bar.abstain {
          background-color: #6b7280;
        }
        
        .vote-actions, .proposal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .vote-button {
          flex: 1;
          padding: 0.6rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .vote-button.for {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .vote-button.for:hover {
          background-color: rgba(16, 185, 129, 0.2);
        }
        
        .vote-button.against {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .vote-button.against:hover {
          background-color: rgba(239, 68, 68, 0.2);
        }
        
        .vote-button.abstain {
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }
        
        .vote-button.abstain:hover {
          background-color: rgba(107, 114, 128, 0.2);
        }
        
        @media (max-width: 768px) {
          .governance-overview {
            grid-template-columns: 1fr;
          }
          
          .proposal-meta {
            flex-direction: column;
            gap: 1rem;
          }
          
          .vote-actions {
            flex-direction: column;
          }
          
          .proposal-form {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
} 