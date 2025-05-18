import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect'),
  { ssr: false }
);

// ABIs for our new contracts
const MODEL_REGISTRY_ABI = [
  "function getModelCount() external view returns (uint256)",
  "function getModel(uint256 modelId) external view returns (tuple(uint256 id, address creator, string name, string description, string modelType, string version, string storageURI, string apiEndpoint, bool isActive, uint256 createdAt, uint256 updatedAt, uint256 usageCount, uint256 feePerCall))",
  "function registerModel(string name, string description, string modelType, string version, string storageURI, string apiEndpoint, uint256 feePerCall) external returns (uint256)",
  "function getModelsByCreator(address creator) external view returns (uint256[] memory)"
];

const EXECUTION_ENGINE_ABI = [
  "function createRequest(uint256 modelId, string inputData) external payable returns (uint256)",
  "function requests(uint256 requestId) external view returns (tuple(uint256 id, uint256 modelId, address requester, address computeProvider, string inputData, string outputData, uint256 fee, uint256 createdAt, uint256 completedAt, uint8 status))",
  "function getUserRequests(address user) external view returns (uint256[] memory)"
];

// Model categories
const MODEL_CATEGORIES = [
  "Text Generation",
  "Image Generation",
  "Text Classification",
  "Image Classification",
  "Audio Processing",
  "Machine Translation",
  "Recommendation",
  "Other"
];

export default function AIMarketplace() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();

  // Contract addresses (would be loaded from deployment file)
  const [addresses, setAddresses] = useState({
    modelRegistry: '',
    executionEngine: ''
  });

  // State variables
  const [models, setModels] = useState([]);
  const [userModels, setUserModels] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('discover'); // discover, create, myModels, myRequests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form states for creating a model
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modelType: MODEL_CATEGORIES[0],
    version: '1.0',
    storageURI: '',
    apiEndpoint: '',
    feePerCall: '0.001'
  });

  // Load contract addresses from deployments
  useEffect(() => {
    async function loadDeploymentAddresses() {
      try {
        const response = await fetch('/api/deployment');
        if (response.ok) {
          const data = await response.json();
          
          setAddresses({
            modelRegistry: data.contracts.SilicaModelRegistry || '',
            executionEngine: data.contracts.SilicaExecutionEngine || ''
          });
        } else {
          console.error("Failed to load deployment addresses");
        }
      } catch (err) {
        console.error("Error loading deployment addresses:", err);
      }
    }
    
    loadDeploymentAddresses();
  }, []);

  // Connect to contracts when addresses and wallet are available
  useEffect(() => {
    if (isConnected && addresses.modelRegistry && addresses.executionEngine) {
      loadMarketplaceData();
    }
  }, [isConnected, addresses]);

  async function loadMarketplaceData() {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }

      // Create a public client to interact with the blockchain
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      });

      // Initialize contracts - in viem we use the client to read and write to contracts
      if (!addresses.modelRegistry || !addresses.executionEngine) {
        throw new Error("Contract addresses not loaded yet");
      }

      // Load all models
      const modelCount = await publicClient.readContract({
        address: addresses.modelRegistry,
        abi: MODEL_REGISTRY_ABI,
        functionName: 'getModelCount'
      });
      
      const modelPromises = [];
      for (let i = 0; i < Number(modelCount); i++) {
        modelPromises.push(publicClient.readContract({
          address: addresses.modelRegistry,
          abi: MODEL_REGISTRY_ABI,
          functionName: 'getModel',
          args: [i]
        }));
      }
      
      const modelsData = await Promise.all(modelPromises);
      
      const formattedModels = modelsData.map(model => ({
        id: Number(model.id),
        creator: model.creator,
        name: model.name,
        description: model.description,
        modelType: model.modelType,
        version: model.version,
        storageURI: model.storageURI,
        apiEndpoint: model.apiEndpoint,
        isActive: model.isActive,
        createdAt: new Date(Number(model.createdAt) * 1000).toLocaleString(),
        updatedAt: new Date(Number(model.updatedAt) * 1000).toLocaleString(),
        usageCount: Number(model.usageCount),
        feePerCall: formatEther(model.feePerCall),
        isUserModel: model.creator.toLowerCase() === address?.toLowerCase()
      }));
      
      setModels(formattedModels);
      
      // Load user's models
      if (address) {
        const userModelIds = await publicClient.readContract({
          address: addresses.modelRegistry,
          abi: MODEL_REGISTRY_ABI,
          functionName: 'getModelsByCreator',
          args: [address]
        });
        
        const userModelsData = formattedModels.filter(model => 
          userModelIds.some(id => Number(id) === model.id)
        );
        setUserModels(userModelsData);
        
        // Load user's requests
        const userRequestIds = await publicClient.readContract({
          address: addresses.executionEngine,
          abi: EXECUTION_ENGINE_ABI,
          functionName: 'getUserRequests',
          args: [address]
        });
        
        const requestPromises = userRequestIds.map(id => 
          publicClient.readContract({
            address: addresses.executionEngine,
            abi: EXECUTION_ENGINE_ABI,
            functionName: 'requests',
            args: [id]
          })
        );
        
        const requestsData = await Promise.all(requestPromises);
        
        const formattedRequests = requestsData.map((request, index) => {
          const model = formattedModels.find(m => Number(m.id) === Number(request.modelId));
          
          return {
            id: Number(request.id),
            modelId: Number(request.modelId),
            modelName: model ? model.name : `Model #${request.modelId}`,
            requester: request.requester,
            computeProvider: request.computeProvider,
            inputData: request.inputData,
            outputData: request.outputData,
            fee: formatEther(request.fee),
            createdAt: new Date(Number(request.createdAt) * 1000).toLocaleString(),
            completedAt: Number(request.completedAt) > 0 ? 
              new Date(Number(request.completedAt) * 1000).toLocaleString() : 'Not completed',
            status: ['Pending', 'Processing', 'Completed', 'Failed', 'Disputed'][request.status]
          };
        });
        
        setUserRequests(formattedRequests);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading marketplace data:", err);
      setError(`Error loading marketplace data: ${err.message}`);
      setLoading(false);
    }
  }

  // Use the writeContract hook for writing to contracts
  const { writeContract } = useWriteContract();

  async function handleModelCreate(e) {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check if connected and contracts are loaded
      if (!isConnected || !addresses.modelRegistry) {
        throw new Error("Please connect your wallet and ensure contracts are loaded");
      }
      
      await writeContract({
        address: addresses.modelRegistry,
        abi: MODEL_REGISTRY_ABI,
        functionName: 'registerModel',
        args: [
          formData.name,
          formData.description,
          formData.modelType,
          formData.version,
          formData.storageURI,
          formData.apiEndpoint,
          parseEther(formData.feePerCall)
        ]
      });
      
      alert("Model created successfully!");
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        modelType: MODEL_CATEGORIES[0],
        version: '1.0',
        storageURI: '',
        apiEndpoint: '',
        feePerCall: '0.001'
      });
      
      // Reload data
      await loadMarketplaceData();
      
      // Switch to My Models tab
      setActiveTab('myModels');
    } catch (err) {
      console.error("Error creating model:", err);
      setError(`Error creating model: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleModelUse(e) {
    e.preventDefault();
    
    try {
      if (!selectedModel) return;
      
      setLoading(true);
      
      // Check if connected and contracts are loaded
      if (!isConnected || !addresses.executionEngine) {
        throw new Error("Please connect your wallet and ensure contracts are loaded");
      }
      
      const fee = parseEther(selectedModel.feePerCall);
      
      await writeContract({
        address: addresses.executionEngine,
        abi: EXECUTION_ENGINE_ABI,
        functionName: 'createRequest',
        args: [selectedModel.id, inputPrompt],
        value: fee
      });
      
      alert("Request submitted successfully!");
      setInputPrompt('');
      
      // Reload data
      await loadMarketplaceData();
      
      // Switch to My Requests tab
      setActiveTab('myRequests');
    } catch (err) {
      console.error("Error using model:", err);
      setError(`Error using model: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }

  // Filter models by category
  const filteredModels = selectedCategory === 'all' 
    ? models 
    : models.filter(model => model.modelType === selectedCategory);

  return (
    <div className="container">
      <Head>
        <title>Silica AI Marketplace</title>
        <meta name="description" content="AI Tools Marketplace for the Silica ecosystem" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="header">
          <h1>Silica <span className="highlight">AI Marketplace</span></h1>
          
          <div className="wallet-section">
            {isConnected ? (
              <div className="connected">
                <p>Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</p>
                <button onClick={() => disconnect()}>Disconnect</button>
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading marketplace data...</div>}

        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={activeTab === 'discover' ? 'active' : ''} 
            onClick={() => setActiveTab('discover')}
          >
            Discover AI Tools
          </button>
          <button 
            className={activeTab === 'create' ? 'active' : ''} 
            onClick={() => setActiveTab('create')}
            disabled={!isConnected}
          >
            Create AI Tool
          </button>
          <button 
            className={activeTab === 'myModels' ? 'active' : ''} 
            onClick={() => setActiveTab('myModels')}
            disabled={!isConnected}
          >
            My AI Tools
          </button>
          <button 
            className={activeTab === 'myRequests' ? 'active' : ''} 
            onClick={() => setActiveTab('myRequests')}
            disabled={!isConnected}
          >
            My Requests
          </button>
        </div>

        {/* Marketplace Content */}
        <div className="marketplace-content">
          {/* Discover AI Tools View */}
          {activeTab === 'discover' && (
            <div className="discover-view">
              <h2>Discover AI Tools</h2>
              
              <div className="filter-section">
                <label>Filter by Category:</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {MODEL_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {filteredModels.length === 0 ? (
                <p>No AI tools available in this category.</p>
              ) : (
                <div className="models-grid">
                  {filteredModels.map(model => (
                    <div className="model-card" key={model.id}>
                      <h3>{model.name} <span className="version">v{model.version}</span></h3>
                      <p className="model-type">{model.modelType}</p>
                      <p className="model-description">{model.description}</p>
                      <div className="model-details">
                        <p><strong>Usage Fee:</strong> {model.feePerCall} ETH</p>
                        <p><strong>Usage Count:</strong> {model.usageCount}</p>
                        <p><strong>Creator:</strong> {model.creator.substring(0, 6)}...{model.creator.substring(model.creator.length - 4)}</p>
                      </div>
                      <button 
                        className="use-button"
                        onClick={() => {
                          setSelectedModel(model);
                          document.getElementById('use-modal').style.display = 'block';
                        }}
                        disabled={!isConnected || !model.isActive}
                      >
                        Use This Model
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Create AI Tool View */}
          {activeTab === 'create' && (
            <div className="create-view">
              <h2>Create a New AI Tool</h2>
              
              <form className="create-form" onSubmit={handleModelCreate}>
                <div className="form-group">
                  <label htmlFor="name">Model Name:</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea 
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="modelType">Model Type:</label>
                  <select 
                    id="modelType"
                    name="modelType"
                    value={formData.modelType}
                    onChange={handleInputChange}
                  >
                    {MODEL_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="version">Version:</label>
                  <input 
                    type="text" 
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="storageURI">Storage URI (IPFS, Arweave, etc.):</label>
                  <input 
                    type="text" 
                    id="storageURI"
                    name="storageURI"
                    value={formData.storageURI}
                    onChange={handleInputChange}
                    required
                    placeholder="ipfs://..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="apiEndpoint">API Endpoint (optional):</label>
                  <input 
                    type="text" 
                    id="apiEndpoint"
                    name="apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="feePerCall">Fee per API Call (ETH):</label>
                  <input 
                    type="number" 
                    id="feePerCall"
                    name="feePerCall"
                    value={formData.feePerCall}
                    onChange={handleInputChange}
                    step="0.0001"
                    min="0"
                    required
                  />
                </div>
                
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create AI Tool'}
                </button>
              </form>
            </div>
          )}
          
          {/* My AI Tools View */}
          {activeTab === 'myModels' && (
            <div className="my-models-view">
              <h2>My AI Tools</h2>
              
              {userModels.length === 0 ? (
                <p>You haven't created any AI tools yet.</p>
              ) : (
                <div className="models-grid">
                  {userModels.map(model => (
                    <div className="model-card" key={model.id}>
                      <h3>{model.name} <span className="version">v{model.version}</span></h3>
                      <p className="model-type">{model.modelType}</p>
                      <p className="model-description">{model.description}</p>
                      <div className="model-details">
                        <p><strong>Usage Fee:</strong> {model.feePerCall} ETH</p>
                        <p><strong>Usage Count:</strong> {model.usageCount}</p>
                        <p><strong>Status:</strong> {model.isActive ? 'Active' : 'Inactive'}</p>
                        <p><strong>Created:</strong> {model.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* My Requests View */}
          {activeTab === 'myRequests' && (
            <div className="my-requests-view">
              <h2>My Requests</h2>
              
              {userRequests.length === 0 ? (
                <p>You haven't made any requests yet.</p>
              ) : (
                <div className="requests-list">
                  {userRequests.map(request => (
                    <div className="request-card" key={request.id}>
                      <div className="request-header">
                        <h3>Request #{request.id}</h3>
                        <span className={`status status-${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </div>
                      
                      <p><strong>Model:</strong> {request.modelName}</p>
                      <p><strong>Input:</strong> {request.inputData}</p>
                      
                      {request.status === 'Completed' && (
                        <div className="output-section">
                          <p><strong>Output:</strong></p>
                          <div className="output-data">{request.outputData}</div>
                        </div>
                      )}
                      
                      <div className="request-footer">
                        <p><strong>Fee:</strong> {request.fee} ETH</p>
                        <p><strong>Created:</strong> {request.createdAt}</p>
                        {request.status === 'Completed' && (
                          <p><strong>Completed:</strong> {request.completedAt}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Use Model Modal */}
        <div id="use-modal" className="modal">
          <div className="modal-content">
            <span 
              className="close" 
              onClick={() => {
                document.getElementById('use-modal').style.display = 'none';
                setSelectedModel(null);
                setInputPrompt('');
              }}
            >&times;</span>
            
            {selectedModel && (
              <div className="use-model-form">
                <h2>Use {selectedModel.name}</h2>
                <p>{selectedModel.description}</p>
                
                <form onSubmit={handleModelUse}>
                  <div className="form-group">
                    <label htmlFor="inputPrompt">Input Data:</label>
                    <textarea 
                      id="inputPrompt"
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      required
                      rows={5}
                      placeholder="Enter your prompt or input data here..."
                    ></textarea>
                  </div>
                  
                  <p className="fee-info">
                    Fee: {selectedModel.feePerCall} ETH
                  </p>
                  
                  <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit Request'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <Link href="/" className="footer-link">Home</Link>
        <Link href="/dashboard" className="footer-link">Dashboard</Link>
        <Link href="/ai-marketplace" className="footer-link">AI Marketplace</Link>
      </footer>

      <style jsx>{`
        .marketplace-content {
          width: 100%;
          padding: 20px 0;
        }
        
        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .model-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        
        .model-card h3 {
          margin-top: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .version {
          font-size: 0.8rem;
          color: #666;
          font-weight: normal;
        }
        
        .model-type {
          display: inline-block;
          background: #e1f5fe;
          color: #0288d1;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          margin-bottom: 10px;
        }
        
        .model-description {
          flex-grow: 1;
          margin-bottom: 15px;
        }
        
        .model-details {
          font-size: 0.9rem;
          margin-bottom: 15px;
        }
        
        .model-details p {
          margin: 5px 0;
        }
        
        .use-button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .use-button:hover {
          background: #0051a2;
        }
        
        .use-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .filter-section {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        }
        
        .filter-section label {
          margin-right: 10px;
        }
        
        .filter-section select {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .create-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .form-group textarea {
          min-height: 100px;
        }
        
        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .request-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .request-header h3 {
          margin: 0;
        }
        
        .status {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        
        .status-pending {
          background: #fff9c4;
          color: #fbc02d;
        }
        
        .status-processing {
          background: #e1f5fe;
          color: #0288d1;
        }
        
        .status-completed {
          background: #e8f5e9;
          color: #4caf50;
        }
        
        .status-failed {
          background: #ffebee;
          color: #f44336;
        }
        
        .status-disputed {
          background: #f3e5f5;
          color: #9c27b0;
        }
        
        .output-section {
          margin-top: 15px;
          margin-bottom: 15px;
        }
        
        .output-data {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          white-space: pre-wrap;
        }
        
        .request-footer {
          margin-top: 15px;
          font-size: 0.9rem;
          color: #666;
        }
        
        .modal {
          display: none;
          position: fixed;
          z-index: 999;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .modal-content {
          background: white;
          margin: 10% auto;
          padding: 20px;
          border-radius: 8px;
          width: 80%;
          max-width: 600px;
          position: relative;
        }
        
        .close {
          position: absolute;
          right: 20px;
          top: 10px;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .use-model-form h2 {
          margin-top: 0;
        }
        
        .fee-info {
          font-weight: bold;
          color: #0070f3;
          margin: 15px 0;
        }
      `}</style>
    </div>
  );
} 