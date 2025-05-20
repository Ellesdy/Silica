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

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    version: '',
    uri: '',
    endpoint: '',
    fee: ''
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

  // Validate URI format
  const validateURI = (uri) => {
    if (!uri) return 'URI is required';
    
    // Check if it's a valid IPFS URI
    if (uri.startsWith('ipfs://')) {
      const cid = uri.slice(7);
      if (!cid || cid.length < 10) {
        return 'Invalid IPFS CID format';
      }
    } 
    // Check if it's a valid HTTP(S) URI
    else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      try {
        new URL(uri);
      } catch {
        return 'Invalid URL format';
      }
    } else {
      return 'URI must start with ipfs://, http://, or https://';
    }
    
    return '';
  };

  // Validate endpoint URI
  const validateEndpoint = (endpoint) => {
    if (!endpoint) return 'API endpoint is required';
    
    // Must be HTTP or HTTPS
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      return 'Endpoint must start with http:// or https://';
    }
    
    // Check if it's a valid URL
    try {
      new URL(endpoint);
    } catch {
      return 'Invalid URL format';
    }
    
    return '';
  };

  // Validate fee amount
  const validateFee = (fee) => {
    if (!fee) return 'Fee is required';
    if (isNaN(parseFloat(fee))) return 'Fee must be a number';
    if (parseFloat(fee) < 0) return 'Fee cannot be negative';
    return '';
  };

  // Validate the entire form
  const validateForm = () => {
    const errors = {
      name: !modelData.name ? 'Model name is required' : '',
      description: !modelData.description ? 'Description is required' : '',
      version: !modelData.version ? 'Version is required' : '',
      uri: validateURI(modelData.uri),
      endpoint: validateEndpoint(modelData.endpoint),
      fee: validateFee(modelData.fee)
    };
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };

  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setModelData({
      ...modelData,
      [name]: value
    });
    
    // Validate the field that changed
    switch (name) {
      case 'name':
        setFormErrors({
          ...formErrors,
          name: !value ? 'Model name is required' : ''
        });
        break;
      case 'description':
        setFormErrors({
          ...formErrors,
          description: !value ? 'Description is required' : ''
        });
        break;
      case 'version':
        setFormErrors({
          ...formErrors,
          version: !value ? 'Version is required' : ''
        });
        break;
      case 'uri':
        setFormErrors({
          ...formErrors,
          uri: validateURI(value)
        });
        break;
      case 'endpoint':
        setFormErrors({
          ...formErrors,
          endpoint: validateEndpoint(value)
        });
        break;
      case 'fee':
        setFormErrors({
          ...formErrors,
          fee: validateFee(value)
        });
        break;
      default:
        break;
    }
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
    
    // Validate the form before submission
    if (!validateForm()) {
      setMessage({ text: 'Please fix the form errors before submitting', type: 'error' });
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
      
      // Reset validation errors
      setFormErrors({
        name: '',
        description: '',
        version: '',
        uri: '',
        endpoint: '',
        fee: ''
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
                  className={`form-control ${formErrors.name ? 'error-input' : ''}`}
                  value={modelData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., My Awesome AI Model"
                />
                {formErrors.name && <p className="error-text">{formErrors.name}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className={`form-control ${formErrors.description ? 'error-input' : ''}`}
                  value={modelData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe what your model does..."
                  rows={4}
                ></textarea>
                {formErrors.description && <p className="error-text">{formErrors.description}</p>}
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
                    className={`form-control ${formErrors.version ? 'error-input' : ''}`}
                    value={modelData.version}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 1.0"
                  />
                  {formErrors.version && <p className="error-text">{formErrors.version}</p>}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="uri">URI (IPFS or other storage link)</label>
                <input
                  type="text"
                  id="uri"
                  name="uri"
                  className={`form-control ${formErrors.uri ? 'error-input' : ''}`}
                  value={modelData.uri}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ipfs://... or https://..."
                />
                {formErrors.uri && <p className="error-text">{formErrors.uri}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="endpoint">API Endpoint</label>
                <input
                  type="text"
                  id="endpoint"
                  name="endpoint"
                  className={`form-control ${formErrors.endpoint ? 'error-input' : ''}`}
                  value={modelData.endpoint}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., https://api.example.com/model"
                />
                {formErrors.endpoint && <p className="error-text">{formErrors.endpoint}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="fee">Fee per call (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  id="fee"
                  name="fee"
                  className={`form-control ${formErrors.fee ? 'error-input' : ''}`}
                  value={modelData.fee}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.fee && <p className="error-text">{formErrors.fee}</p>}
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
        
        .error-input {
          border-color: var(--error-color) !important;
        }
        
        .error-text {
          color: var(--error-color);
          font-size: 0.85rem;
          margin-top: 0.25rem;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
} 