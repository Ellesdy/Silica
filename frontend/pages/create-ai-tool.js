import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import Link from 'next/link';
import { parseEther } from 'viem';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect'),
  { ssr: false }
);

// Define ABI for the model registry contract
const MODEL_REGISTRY_ABI = [
  "function registerModel(string name, string description, string modelType, string version, string storageURI, string apiEndpoint, uint256 feePerCall) external returns (uint256)"
];

// Model types available for creation
const MODEL_TYPES = [
  "Text Generation",
  "Image Generation",
  "Text Classification",
  "Image Classification",
  "Audio Processing",
  "Translation",
  "Sentiment Analysis",
  "Data Analysis",
  "Prediction",
  "Other"
];

export default function CreateAITool() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: MODEL_TYPES[0],
    version: '1.0',
    storageURI: '',
    apiEndpoint: '',
    feePerCall: '0.001',
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  // Load contract address
  useEffect(() => {
    async function loadDeploymentData() {
      try {
        const response = await fetch('/api/deployment');
        if (response.ok) {
          const data = await response.json();
          setContractAddress(data.contracts.SilicaModelRegistry || '');
        }
      } catch (err) {
        console.error("Error loading deployment data:", err);
        setError("Could not load contract addresses. Please check network connection.");
      }
    }
    
    loadDeploymentData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }
    
    if (!contractAddress) {
      setError("Contract address not found. Please check network configuration.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validate form inputs
      if (!formData.name || !formData.description) {
        throw new Error('Name and description are required');
      }
      
      // Convert fee to wei
      const feeInWei = parseEther(formData.feePerCall);
      
      // Register the model
      await writeContract({
        address: contractAddress,
        abi: MODEL_REGISTRY_ABI,
        functionName: 'registerModel',
        args: [
          formData.name,
          formData.description,
          formData.type,
          formData.version,
          formData.storageURI || `ipfs://silica/${Date.now()}`, // Placeholder if empty
          formData.apiEndpoint,
          feeInWei
        ]
      });
      
      // Success message
      setSuccess("Your AI tool has been registered successfully!");
      
      // Clear form after successful submission
      setFormData({
        name: '',
        description: '',
        type: MODEL_TYPES[0],
        version: '1.0',
        storageURI: '',
        apiEndpoint: '',
        feePerCall: '0.001',
      });
      
      // Redirect to marketplace after a delay
      setTimeout(() => {
        router.push('/ai-marketplace');
      }, 3000);
      
    } catch (err) {
      console.error("Error creating AI tool:", err);
      setError(err.message || "Failed to create AI tool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Create AI Tool | Silica</title>
        <meta name="description" content="Create and monetize your AI tools on Silica" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="page-header">
          <h1>Create <span className="highlight">AI Tool</span></h1>
          
          <div className="wallet-section">
            {isConnected ? (
              <div className="connected">
                <p>Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</p>
                <button onClick={() => disconnect()} className="disconnect-button">Disconnect</button>
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>

        <div className="content-section">
          <div className="intro-section">
            <p>Create and monetize your AI model on the Silica platform. Each tool you create can generate revenue when users interact with it.</p>
            <div className="requirements">
              <h3>Requirements:</h3>
              <ul>
                <li>Connect your wallet to register your AI tool</li>
                <li>Provide a hosted endpoint or IPFS storage for your model</li>
                <li>Set a fee that users will pay for each interaction</li>
              </ul>
            </div>
          </div>

          <div className="form-container">
            <h2>AI Tool Details</h2>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <p>{success}</p>
                <p className="redirect-note">Redirecting to marketplace...</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="create-form">
              <div className="form-group">
                <label htmlFor="name">Tool Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Advanced Text Generator"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what your AI tool does and its capabilities..."
                  rows={4}
                  required
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Tool Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    {MODEL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="version">Version</label>
                  <input
                    type="text"
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.0"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="storageURI">
                  Model Storage URI 
                  <span className="optional">(IPFS, Arweave, etc.)</span>
                </label>
                <input
                  type="text"
                  id="storageURI"
                  name="storageURI"
                  value={formData.storageURI}
                  onChange={handleInputChange}
                  placeholder="e.g., ipfs://bafybeie..."
                />
                <small>URI where your model weights or files are stored (optional)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="apiEndpoint">
                  API Endpoint
                  <span className="optional">(for hosted models)</span>
                </label>
                <input
                  type="text"
                  id="apiEndpoint"
                  name="apiEndpoint"
                  value={formData.apiEndpoint}
                  onChange={handleInputChange}
                  placeholder="e.g., https://your-api-endpoint.com/predict"
                />
                <small>API endpoint where your model is hosted (optional)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="feePerCall">
                  Fee Per Call (ETH)
                </label>
                <input
                  type="number"
                  id="feePerCall"
                  name="feePerCall"
                  value={formData.feePerCall}
                  onChange={handleInputChange}
                  step="0.0001"
                  min="0"
                  placeholder="e.g., 0.001"
                  required
                />
                <small>Amount users will pay each time they use your model</small>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !isConnected}
                >
                  {loading ? 'Creating...' : 'Create AI Tool'}
                </button>
                
                <Link href="/ai-marketplace">
                  <span className="cancel-button">Cancel</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <footer className="footer">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/ai-marketplace">AI Marketplace</Link>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .main {
          flex: 1;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        h1 {
          font-size: 2.5rem;
          margin: 0;
        }
        
        .highlight {
          color: var(--accent-color);
        }
        
        .wallet-section {
          display: flex;
          align-items: center;
        }
        
        .connected {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .connected p {
          margin: 0;
        }
        
        .disconnect-button {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .disconnect-button:hover {
          background-color: rgba(239, 68, 68, 0.2);
        }
        
        .content-section {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
        }
        
        .intro-section {
          background-color: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 8px;
          height: fit-content;
        }
        
        .requirements {
          margin-top: 1.5rem;
        }
        
        .requirements h3 {
          margin-top: 0;
          margin-bottom: 0.75rem;
        }
        
        .requirements ul {
          padding-left: 1.5rem;
          margin: 0;
        }
        
        .requirements li {
          margin-bottom: 0.5rem;
        }
        
        .form-container {
          background-color: var(--card-bg);
          border-radius: 8px;
          padding: 2rem;
          box-shadow: var(--card-shadow);
        }
        
        .form-container h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }
        
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .optional {
          font-weight: normal;
          font-size: 0.875rem;
          margin-left: 0.5rem;
          color: var(--text-secondary);
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .form-group small {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .submit-button {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .submit-button:hover {
          background-color: var(--accent-hover);
          transform: translateY(-1px);
        }
        
        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        
        .cancel-button {
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .cancel-button:hover {
          text-decoration: underline;
        }
        
        .error-message {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }
        
        .error-message p {
          margin: 0;
        }
        
        .success-message {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }
        
        .success-message p {
          margin: 0;
        }
        
        .redirect-note {
          font-size: 0.875rem;
          margin-top: 0.5rem !important;
        }
        
        .footer {
          width: 100%;
          padding: 1.5rem 0;
          display: flex;
          justify-content: center;
          gap: 2rem;
          border-top: 1px solid var(--border-color);
          margin-top: 2rem;
        }
        
        .footer a {
          color: var(--accent-color);
        }
        
        @media (max-width: 768px) {
          .content-section {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .wallet-section {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 