import { useState, useEffect, useContext } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import Link from 'next/link';
import { parseEther } from 'viem';
import { ThemeContext } from './_app';

export default function CreateModel() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();
  const { darkMode } = useContext(ThemeContext);
  const [networkInfo, setNetworkInfo] = useState({ name: 'Loading...', contracts: {} });
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form state for model creation
  const [modelData, setModelData] = useState({
    name: '',
    description: '',
    category: 'Text Generation',
    version: '1.0',
    uri: '',
    endpoint: '',
    fee: '0.01'
  });

  // Model Registry contract ABI (only the functions we need)
  const modelRegistryABI = [
    "function registerModel(string name, string description, string category, string version, string uri, string endpoint, uint256 fee) external returns (uint256)",
    "function hasRole(bytes32 role, address account) external view returns (bool)"
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModelData({
      ...modelData,
      [name]: value
    });
  };

  // Register model function using wagmi's useWriteContract
  const { writeContract } = useWriteContract();

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }
    
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Convert fee to wei
      const feeInWei = parseEther(modelData.fee);
      
      const hash = await writeContract({ 
        address: networkInfo.contracts?.SilicaModelRegistry,
        abi: modelRegistryABI,
        functionName: 'registerModel',
        args: [
          modelData.name,
          modelData.description,
          modelData.category,
          modelData.version,
          modelData.uri,
          modelData.endpoint,
          feeInWei
        ] 
      });
      
      setTxHash(hash);
      setMessage({ 
        text: 'Model successfully registered! It will appear in the marketplace once the transaction is confirmed.', 
        type: 'success' 
      });
      
      // Reset form
      setModelData({
        name: '',
        description: '',
        category: 'Text Generation',
        version: '1.0',
        uri: '',
        endpoint: '',
        fee: '0.01'
      });
    } catch (error) {
      console.error("Error registering model:", error);
      setMessage({ 
        text: error.message || 'Failed to register model. Try again later.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Create AI Model | Silica AI Platform</title>
        <meta name="description" content="Register your AI model on the Silica platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="section">
          <h1 className="title">Register Your AI Model</h1>
          <p className="description">
            Share your AI model with the world and earn fees when others use it
          </p>
          
          {!isConnected ? (
            <div className="connect-prompt">
              <p>Please connect your wallet to register a model</p>
              <button className="button" onClick={() => connect()}>
                Connect Wallet
              </button>
            </div>
          ) : (
            <form className="create-model-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Model Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={modelData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., My Awesome AI Model"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  value={modelData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe what your model does..."
                  rows={4}
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    className="form-control"
                    value={modelData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Text Generation">Text Generation</option>
                    <option value="Image Generation">Image Generation</option>
                    <option value="Translation">Translation</option>
                    <option value="Classification">Classification</option>
                    <option value="Sentiment Analysis">Sentiment Analysis</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="version">Version</label>
                  <input
                    type="text"
                    id="version"
                    name="version"
                    className="form-control"
                    value={modelData.version}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 1.0"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="uri">URI (IPFS or other storage link)</label>
                <input
                  type="text"
                  id="uri"
                  name="uri"
                  className="form-control"
                  value={modelData.uri}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ipfs://..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endpoint">API Endpoint</label>
                <input
                  type="text"
                  id="endpoint"
                  name="endpoint"
                  className="form-control"
                  value={modelData.endpoint}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., https://api.example.com/model"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fee">Fee per call (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  id="fee"
                  name="fee"
                  className="form-control"
                  value={modelData.fee}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="button" 
                disabled={submitting}
              >
                {submitting ? 'Registering...' : 'Register Model'}
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
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          Powered by <span className="highlight">Silica DAO</span>
        </p>
      </footer>

      <style jsx>{`
        .create-model-form {
          width: 100%;
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          background-color: var(--card-bg);
          border-radius: 12px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
        }
        
        .connect-prompt {
          text-align: center;
          margin: 4rem 0;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 