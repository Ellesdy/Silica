import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import { ethers } from 'ethers';
import Link from 'next/link';

// ABIs will be imported from built artifacts
const AI_CONTROLLER_ABI = [
  "function getDecisions(uint256 start, uint256 end) external view returns (tuple(uint256 timestamp, string decisionType, string rationale, bytes executionData)[])",
  "function decisionCount() external view returns (uint256)",
  "function buyThreshold() external view returns (uint256)",
  "function sellThreshold() external view returns (uint256)",
  "function maxTradePercentage() external view returns (uint256)",
  "function updateThresholds(uint256 _buyThreshold, uint256 _sellThreshold, uint256 _maxTradePercentage) external"
];

const ORACLE_ABI = [
  "function getMarketData(string calldata symbol) external view returns (tuple(uint256 timestamp, string symbol, uint256 price, int256 sentiment, uint256 volatility, string predictiveTrend))",
  "function getInsightsByType(string calldata insightType, uint256 start, uint256 count) external view returns (tuple(uint256 timestamp, string insightType, string summary, string data, uint256 confidence)[])",
  "function getAllSymbols() external view returns (string[] memory)",
  "function getAllInsightTypes() external view returns (string[] memory)"
];

const TREASURY_ABI = [
  "function getAllAssets() external view returns (address[] memory)",
  "function getTokenBalance(address token) external view returns (uint256)",
  "function assets(address) external view returns (string, string, bool)"
];

const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();

  // Contract addresses (would be loaded from deployment file)
  const [addresses, setAddresses] = useState({
    controller: '',
    oracle: '',
    treasury: '',
    token: ''
  });

  // Contract states
  const [decisions, setDecisions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [thresholds, setThresholds] = useState({
    buyThreshold: '0',
    sellThreshold: '0',
    maxTradePercentage: '0'
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('overview'); // overview, decisions, insights, treasury

  // Load contract addresses from deployments
  useEffect(() => {
    async function loadDeploymentAddresses() {
      try {
        const response = await fetch('/api/deployment');
        if (response.ok) {
          const data = await response.json();
          
          setAddresses({
            controller: data.contracts.SilicaAIController || '',
            oracle: data.contracts.SilicaAIOracle || '',
            treasury: data.contracts.SilicaTreasury || '',
            token: data.contracts.SilicaToken || ''
          });
        } else {
          // Fallback to localStorage if API fails
          setAddresses({
            controller: localStorage.getItem('controller_address') || '',
            oracle: localStorage.getItem('oracle_address') || '',
            treasury: localStorage.getItem('treasury_address') || '',
            token: localStorage.getItem('token_address') || ''
          });
        }
      } catch (err) {
        console.error("Error loading deployment addresses:", err);
        // Fallback to localStorage
        setAddresses({
          controller: localStorage.getItem('controller_address') || '',
          oracle: localStorage.getItem('oracle_address') || '',
          treasury: localStorage.getItem('treasury_address') || '',
          token: localStorage.getItem('token_address') || ''
        });
      }
    }
    
    loadDeploymentAddresses();
  }, []);

  // Connect to contracts when addresses and wallet are available
  useEffect(() => {
    if (isConnected && addresses.controller && addresses.oracle && addresses.treasury) {
      loadDashboardData();
    }
  }, [isConnected, addresses]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError('');

      // Get provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Initialize contracts
      const controllerContract = new ethers.Contract(addresses.controller, AI_CONTROLLER_ABI, signer);
      const oracleContract = new ethers.Contract(addresses.oracle, ORACLE_ABI, signer);
      const treasuryContract = new ethers.Contract(addresses.treasury, TREASURY_ABI, signer);

      // Load decision count
      const decisionCount = await controllerContract.decisionCount();
      
      // Load decisions (last 10)
      if (decisionCount > 0) {
        const start = decisionCount > 10 ? decisionCount - 10 : 0;
        const decisionsData = await controllerContract.getDecisions(start, decisionCount);
        
        // Format decisions
        const formattedDecisions = decisionsData.map(decision => ({
          timestamp: new Date(Number(decision.timestamp) * 1000).toLocaleString(),
          type: decision.decisionType,
          rationale: decision.rationale,
          executionData: decision.executionData
        }));
        
        setDecisions(formattedDecisions);
      }

      // Load thresholds
      const buyThreshold = await controllerContract.buyThreshold();
      const sellThreshold = await controllerContract.sellThreshold();
      const maxTradePercentage = await controllerContract.maxTradePercentage();
      
      setThresholds({
        buyThreshold: ethers.formatUnits(buyThreshold, 'ether'),
        sellThreshold: ethers.formatUnits(sellThreshold, 'ether'),
        maxTradePercentage: maxTradePercentage.toString()
      });

      // Load assets from treasury
      const assetAddresses = await treasuryContract.getAllAssets();
      
      const assetPromises = assetAddresses.map(async (assetAddress) => {
        // Get asset details
        const [name, assetType, isActive] = await treasuryContract.assets(assetAddress);
        
        // Get token balance
        const balance = await treasuryContract.getTokenBalance(assetAddress);
        
        // If it's a token, get its symbol and decimals
        let symbol = 'Unknown';
        let decimals = 18;
        
        try {
          const tokenContract = new ethers.Contract(assetAddress, TOKEN_ABI, provider);
          symbol = await tokenContract.symbol();
          decimals = await tokenContract.decimals();
        } catch (err) {
          console.error("Error getting token info:", err);
        }
        
        return {
          address: assetAddress,
          name,
          type: assetType,
          isActive,
          balance: ethers.formatUnits(balance, decimals),
          symbol
        };
      });
      
      const assetResults = await Promise.all(assetPromises);
      setAssets(assetResults);

      // Load market data
      try {
        const symbols = await oracleContract.getAllSymbols();
        
        const marketDataPromises = symbols.map(async (symbol) => {
          const data = await oracleContract.getMarketData(symbol);
          
          return {
            symbol: data.symbol,
            price: ethers.formatUnits(data.price, 8), // Assuming 8 decimals
            sentiment: Number(data.sentiment),
            volatility: Number(data.volatility),
            trend: data.predictiveTrend,
            timestamp: new Date(Number(data.timestamp) * 1000).toLocaleString()
          };
        });
        
        const marketDataResults = await Promise.all(marketDataPromises);
        const marketDataMap = {};
        
        marketDataResults.forEach(data => {
          marketDataMap[data.symbol] = data;
        });
        
        setMarketData(marketDataMap);
      } catch (err) {
        console.error("Error loading market data:", err);
      }

      // Load insights (latest)
      try {
        const insightTypes = await oracleContract.getAllInsightTypes();
        
        const insightPromises = insightTypes.map(async (insightType) => {
          try {
            const data = await oracleContract.getInsightsByType(insightType, 0, 1);
            
            if (data.length > 0) {
              return {
                type: insightType,
                summary: data[0].summary,
                confidence: Number(data[0].confidence),
                timestamp: new Date(Number(data[0].timestamp) * 1000).toLocaleString(),
                data: data[0].data
              };
            }
            return null;
          } catch (err) {
            console.error(`Error getting insights for ${insightType}:`, err);
            return null;
          }
        });
        
        const insightResults = await Promise.all(insightPromises);
        setInsights(insightResults.filter(insight => insight !== null));
      } catch (err) {
        console.error("Error loading insights:", err);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(`Error loading dashboard data: ${err.message}`);
      setLoading(false);
    }
  }

  function handleAddressChange(key, value) {
    setAddresses({
      ...addresses,
      [key]: value
    });
    localStorage.setItem(`${key}_address`, value);
  }

  async function updateThresholdsHandler(e) {
    e.preventDefault();
    
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const controllerContract = new ethers.Contract(addresses.controller, AI_CONTROLLER_ABI, signer);

      // Convert to proper values
      const buyThresholdValue = ethers.parseUnits(thresholds.buyThreshold, 'ether');
      const sellThresholdValue = ethers.parseUnits(thresholds.sellThreshold, 'ether');
      const maxTradePercentageValue = thresholds.maxTradePercentage;

      const tx = await controllerContract.updateThresholds(
        buyThresholdValue,
        sellThresholdValue,
        maxTradePercentageValue
      );

      await tx.wait();
      
      alert("Thresholds updated successfully!");
      await loadDashboardData();
    } catch (err) {
      console.error("Error updating thresholds:", err);
      setError(`Error updating thresholds: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Render the dashboard UI
  return (
    <div className="container">
      <Head>
        <title>Silica AI Dashboard</title>
        <meta name="description" content="Dashboard for the Silica AI-powered cryptocurrency" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="header">
          <h1>Silica <span className="highlight">AI Dashboard</span></h1>
          
          <div className="wallet-section">
            {isConnected ? (
              <div className="connected">
                <p>Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</p>
                <button onClick={() => disconnect()}>Disconnect</button>
              </div>
            ) : (
              <button onClick={() => connect()}>Connect Wallet</button>
            )}
          </div>
        </div>

        {/* Contract addresses input */}
        <div className="addresses-section">
          <div className="address-input">
            <label>Controller:</label>
            <input 
              type="text" 
              value={addresses.controller} 
              onChange={(e) => handleAddressChange('controller', e.target.value)}
              placeholder="AI Controller Address" 
            />
          </div>
          <div className="address-input">
            <label>Oracle:</label>
            <input 
              type="text" 
              value={addresses.oracle} 
              onChange={(e) => handleAddressChange('oracle', e.target.value)}
              placeholder="AI Oracle Address" 
            />
          </div>
          <div className="address-input">
            <label>Treasury:</label>
            <input 
              type="text" 
              value={addresses.treasury} 
              onChange={(e) => handleAddressChange('treasury', e.target.value)}
              placeholder="Treasury Address" 
            />
          </div>
          <div className="address-input">
            <label>Token:</label>
            <input 
              type="text" 
              value={addresses.token} 
              onChange={(e) => handleAddressChange('token', e.target.value)}
              placeholder="Token Address" 
            />
          </div>
          
          <button 
            onClick={loadDashboardData} 
            disabled={!isConnected || !addresses.controller || !addresses.oracle || !addresses.treasury}
          >
            Load Dashboard
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading dashboard data...</div>}

        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={activeView === 'overview' ? 'active' : ''} 
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button 
            className={activeView === 'decisions' ? 'active' : ''} 
            onClick={() => setActiveView('decisions')}
          >
            AI Decisions
          </button>
          <button 
            className={activeView === 'insights' ? 'active' : ''} 
            onClick={() => setActiveView('insights')}
          >
            Market Insights
          </button>
          <button 
            className={activeView === 'treasury' ? 'active' : ''} 
            onClick={() => setActiveView('treasury')}
          >
            Treasury
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Overview View */}
          {activeView === 'overview' && (
            <div className="overview">
              <h2>AI Trading Parameters</h2>
              <form className="thresholds-form" onSubmit={updateThresholdsHandler}>
                <div className="form-group">
                  <label>Buy Threshold (ETH):</label>
                  <input 
                    type="text" 
                    value={thresholds.buyThreshold} 
                    onChange={(e) => setThresholds({...thresholds, buyThreshold: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Sell Threshold (ETH):</label>
                  <input 
                    type="text" 
                    value={thresholds.sellThreshold} 
                    onChange={(e) => setThresholds({...thresholds, sellThreshold: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Max Trade % (0-100):</label>
                  <input 
                    type="number" 
                    value={thresholds.maxTradePercentage} 
                    onChange={(e) => setThresholds({...thresholds, maxTradePercentage: e.target.value})}
                    min="0" 
                    max="100"
                  />
                </div>
                <button type="submit">Update Parameters</button>
              </form>
              
              <div className="summary-cards">
                <div className="card">
                  <h3>AI Decisions</h3>
                  <p className="stat">{decisions.length}</p>
                  <p>Latest decisions made by the AI</p>
                </div>
                
                <div className="card">
                  <h3>Treasury Assets</h3>
                  <p className="stat">{assets.length}</p>
                  <p>Assets controlled by the treasury</p>
                </div>
                
                <div className="card">
                  <h3>Market Data</h3>
                  <p className="stat">{Object.keys(marketData).length}</p>
                  <p>Market symbols tracked</p>
                </div>
              </div>
              
              {/* Latest Insight */}
              {insights.length > 0 && (
                <div className="latest-insight">
                  <h3>Latest AI Insight</h3>
                  <div className="insight-card">
                    <div className="insight-header">
                      <span>{insights[0].type}</span>
                      <span>Confidence: {insights[0].confidence}%</span>
                    </div>
                    <p className="insight-summary">{insights[0].summary}</p>
                    <p className="timestamp">{insights[0].timestamp}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* AI Decisions View */}
          {activeView === 'decisions' && (
            <div className="decisions">
              <h2>AI Decision History</h2>
              
              {decisions.length === 0 ? (
                <p>No decisions have been made yet.</p>
              ) : (
                <div className="decisions-list">
                  {decisions.map((decision, index) => (
                    <div className="decision-card" key={index}>
                      <div className="decision-header">
                        <span className="decision-type">{decision.type}</span>
                        <span className="timestamp">{decision.timestamp}</span>
                      </div>
                      <p className="rationale">{decision.rationale}</p>
                      <details>
                        <summary>View Execution Data</summary>
                        <div className="execution-data">
                          <pre>{decision.executionData}</pre>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Market Insights View */}
          {activeView === 'insights' && (
            <div className="insights">
              <h2>Market Data & AI Insights</h2>
              
              <div className="market-data-section">
                <h3>Current Market Data</h3>
                
                {Object.keys(marketData).length === 0 ? (
                  <p>No market data available.</p>
                ) : (
                  <div className="market-data-grid">
                    {Object.values(marketData).map((data, index) => (
                      <div className="market-card" key={index}>
                        <h4>{data.symbol}</h4>
                        <p><strong>Price:</strong> ${parseFloat(data.price).toFixed(2)}</p>
                        <p>
                          <strong>Sentiment:</strong> {data.sentiment}
                          <span className={`sentiment-indicator ${
                            data.sentiment > 30 ? 'positive' : 
                            data.sentiment < -30 ? 'negative' : 'neutral'
                          }`}></span>
                        </p>
                        <p><strong>Volatility:</strong> {data.volatility}%</p>
                        <p><strong>Trend:</strong> <span className={`trend ${data.trend.toLowerCase()}`}>{data.trend}</span></p>
                        <p className="timestamp">{data.timestamp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="insights-section">
                <h3>AI Insights</h3>
                
                {insights.length === 0 ? (
                  <p>No insights available.</p>
                ) : (
                  <div className="insights-list">
                    {insights.map((insight, index) => (
                      <div className="insight-card" key={index}>
                        <div className="insight-header">
                          <span>{insight.type}</span>
                          <span>Confidence: {insight.confidence}%</span>
                        </div>
                        <p className="insight-summary">{insight.summary}</p>
                        <details>
                          <summary>View Technical Data</summary>
                          <pre>{insight.data}</pre>
                        </details>
                        <p className="timestamp">{insight.timestamp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Treasury View */}
          {activeView === 'treasury' && (
            <div className="treasury">
              <h2>Treasury Holdings</h2>
              
              {assets.length === 0 ? (
                <p>No assets in treasury.</p>
              ) : (
                <div className="assets-list">
                  {assets.map((asset, index) => (
                    <div className="asset-card" key={index}>
                      <h3>{asset.name} ({asset.symbol})</h3>
                      <p className="balance">{parseFloat(asset.balance).toFixed(4)} {asset.symbol}</p>
                      <p className="asset-type">Type: {asset.type}</p>
                      <p className="asset-address">
                        <small>{asset.address}</small>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/ai-marketplace">AI Marketplace</Link>
        <a 
          href={`https://sepolia.etherscan.io/address/${addresses.controller}`} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          View on Etherscan
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 1rem;
        }
        
        .main {
          padding: 2rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 2rem;
        }
        
        .highlight {
          color: #0070f3;
        }
        
        .wallet-section {
          display: flex;
          align-items: center;
        }
        
        .connected {
          display: flex;
          align-items: center;
        }
        
        .connected p {
          margin-right: 1rem;
        }
        
        button {
          background-color: #0070f3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        
        button:hover {
          background-color: #0051a2;
        }
        
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .addresses-section {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #f7f7f7;
          border-radius: 0.5rem;
        }
        
        .address-input {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 200px;
        }
        
        .address-input label {
          margin-bottom: 0.25rem;
          font-weight: bold;
        }
        
        .address-input input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .error {
          color: #d32f2f;
          margin: 1rem 0;
          padding: 0.5rem;
          background-color: #ffebee;
          border-radius: 4px;
        }
        
        .loading {
          margin: 1rem 0;
          padding: 0.5rem;
          background-color: #e3f2fd;
          border-radius: 4px;
        }
        
        .tabs {
          display: flex;
          margin-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .tabs button {
          background-color: transparent;
          color: #333;
          padding: 0.75rem 1.5rem;
          border: none;
          margin-right: 0.5rem;
          cursor: pointer;
        }
        
        .tabs button.active {
          border-bottom: 2px solid #0070f3;
          color: #0070f3;
          font-weight: bold;
        }
        
        .dashboard-content {
          flex: 1;
          width: 100%;
        }
        
        .summary-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-width: 200px;
        }
        
        .card h3 {
          margin-top: 0;
          color: #333;
        }
        
        .card .stat {
          font-size: 2rem;
          font-weight: bold;
          color: #0070f3;
          margin: 0.5rem 0;
        }
        
        .thresholds-form {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }
        
        .form-group label {
          width: 150px;
          font-weight: bold;
        }
        
        .form-group input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          flex: 1;
        }
        
        .latest-insight {
          margin-top: 2rem;
        }
        
        .insight-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }
        
        .insight-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }
        
        .insight-summary {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        
        .timestamp {
          font-size: 0.8rem;
          color: #666;
        }
        
        .decisions-list, .insights-list, .assets-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .decision-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .decision-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .decision-type {
          font-weight: bold;
          color: #0070f3;
        }
        
        .rationale {
          margin: 0.5rem 0 1rem;
        }
        
        .execution-data {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #f7f7f7;
          border-radius: 4px;
          overflow-x: auto;
        }
        
        .execution-data pre {
          margin: 0;
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        .market-data-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .market-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-width: 250px;
        }
        
        .market-card h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #333;
        }
        
        .sentiment-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-left: 10px;
        }
        
        .positive {
          background-color: #4caf50;
        }
        
        .negative {
          background-color: #f44336;
        }
        
        .neutral {
          background-color: #ffeb3b;
        }
        
        .trend {
          text-transform: capitalize;
        }
        
        .trend.bullish {
          color: #4caf50;
        }
        
        .trend.bearish {
          color: #f44336;
        }
        
        .asset-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .asset-card h3 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .balance {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        
        .asset-type {
          color: #666;
          margin: 0.25rem 0;
        }
        
        .asset-address {
          font-size: 0.8rem;
          color: #999;
          word-break: break-all;
        }
        
        .footer {
          width: 100%;
          height: 70px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
        }
        
        .footer a {
          color: #0070f3;
        }
      `}</style>
    </div>
  );
} 