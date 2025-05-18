import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Head from 'next/head';
import { ethers } from 'ethers';

// This would be generated from the contract ABI
const ORACLE_ABI = [
  "function getMarketData(string calldata symbol) external view returns (tuple(uint256 timestamp, string symbol, uint256 price, int256 sentiment, uint256 volatility, string predictiveTrend))",
  "function getInsightsByType(string calldata insightType, uint256 start, uint256 count) external view returns (tuple(uint256 timestamp, string insightType, string summary, string data, uint256 confidence)[])",
  "function getAllSymbols() external view returns (string[] memory)",
  "function getAllInsightTypes() external view returns (string[] memory)"
];

export default function Insights() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();

  const [oracleAddress, setOracleAddress] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [insightTypes, setInsightTypes] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedInsightType, setSelectedInsightType] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to load initial data
  useEffect(() => {
    if (isConnected) {
      fetchSymbolsAndInsightTypes();
    }
  }, [isConnected]);

  // Effect to fetch market data when symbol changes
  useEffect(() => {
    if (selectedSymbol && isConnected) {
      fetchMarketData(selectedSymbol);
    }
  }, [selectedSymbol, isConnected]);

  // Effect to fetch insights when type changes
  useEffect(() => {
    if (selectedInsightType && isConnected) {
      fetchInsights(selectedInsightType);
    }
  }, [selectedInsightType, isConnected]);

  async function fetchSymbolsAndInsightTypes() {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // This would be fetched from a config or environment variable in production
      // For now, using a placeholder address (needs to be replaced with actual deployed address)
      const oracleAddressValue = oracleAddress || localStorage.getItem('oracleAddress') || '';
      
      if (!oracleAddressValue) {
        setError('Please enter the oracle contract address');
        setLoading(false);
        return;
      }

      const oracleContract = new ethers.Contract(oracleAddressValue, ORACLE_ABI, provider);
      
      // Fetch available symbols and insight types
      const allSymbols = await oracleContract.getAllSymbols();
      const allInsightTypes = await oracleContract.getAllInsightTypes();
      
      setSymbols(allSymbols);
      setInsightTypes(allInsightTypes);
      
      if (allSymbols.length > 0) {
        setSelectedSymbol(allSymbols[0]);
      }
      
      if (allInsightTypes.length > 0) {
        setSelectedInsightType(allInsightTypes[0]);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMarketData(symbol) {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const oracleContract = new ethers.Contract(
        oracleAddress || localStorage.getItem('oracleAddress'),
        ORACLE_ABI,
        provider
      );
      
      const data = await oracleContract.getMarketData(symbol);
      setMarketData({
        timestamp: new Date(Number(data.timestamp) * 1000).toLocaleString(),
        symbol: data.symbol,
        price: ethers.formatUnits(data.price, 8), // Assuming 8 decimals for price
        sentiment: Number(data.sentiment),
        volatility: Number(data.volatility),
        predictiveTrend: data.predictiveTrend
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(`Error fetching market data: ${err.message}`);
      setMarketData(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInsights(insightType) {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const oracleContract = new ethers.Contract(
        oracleAddress || localStorage.getItem('oracleAddress'),
        ORACLE_ABI,
        provider
      );
      
      // Fetch the 5 most recent insights
      const data = await oracleContract.getInsightsByType(insightType, 0, 5);
      
      const formattedInsights = data.map(insight => ({
        timestamp: new Date(Number(insight.timestamp) * 1000).toLocaleString(),
        type: insight.insightType,
        summary: insight.summary,
        data: insight.data,
        confidence: Number(insight.confidence)
      }));
      
      setInsights(formattedInsights);
      setError('');
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(`Error fetching insights: ${err.message}`);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  function handleOracleAddressChange(e) {
    const address = e.target.value;
    setOracleAddress(address);
    localStorage.setItem('oracleAddress', address);
  }

  return (
    <div className="container">
      <Head>
        <title>Silica AI Insights</title>
        <meta name="description" content="AI-powered insights for the Silica ecosystem" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          Silica <span className="highlight">AI Insights</span>
        </h1>

        <div className="wallet-section">
          {isConnected ? (
            <div>
              <p>Connected to {address}</p>
              <button onClick={() => disconnect()}>Disconnect</button>
            </div>
          ) : (
            <button onClick={() => connect()}>Connect Wallet</button>
          )}
        </div>

        <div className="oracle-address">
          <label>
            Oracle Contract Address:
            <input 
              type="text" 
              value={oracleAddress} 
              onChange={handleOracleAddressChange}
              placeholder="Enter the deployed oracle address"
              className="address-input"
            />
          </label>
          <button onClick={fetchSymbolsAndInsightTypes} disabled={!isConnected}>
            Connect to Oracle
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        <div className="data-section">
          <div className="market-data">
            <h2>Market Data</h2>
            
            {symbols.length > 0 && (
              <div className="selector">
                <label>
                  Select Market:
                  <select 
                    value={selectedSymbol} 
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                  >
                    {symbols.map((sym) => (
                      <option key={sym} value={sym}>{sym}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            
            {marketData && (
              <div className="data-card">
                <h3>{marketData.symbol}</h3>
                <p><strong>Last Updated:</strong> {marketData.timestamp}</p>
                <p><strong>Price:</strong> ${parseFloat(marketData.price).toFixed(2)}</p>
                <p><strong>Sentiment:</strong> {marketData.sentiment} 
                  <span className={`sentiment-indicator ${
                    marketData.sentiment > 30 ? 'positive' : 
                    marketData.sentiment < -30 ? 'negative' : 'neutral'
                  }`}></span>
                </p>
                <p><strong>Volatility:</strong> {marketData.volatility}%</p>
                <p><strong>Trend:</strong> {marketData.predictiveTrend}</p>
              </div>
            )}
          </div>

          <div className="ai-insights">
            <h2>AI Insights</h2>
            
            {insightTypes.length > 0 && (
              <div className="selector">
                <label>
                  Insight Type:
                  <select 
                    value={selectedInsightType} 
                    onChange={(e) => setSelectedInsightType(e.target.value)}
                  >
                    {insightTypes.map((type) => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            
            {insights.length > 0 ? (
              <div className="insights-list">
                {insights.map((insight, idx) => (
                  <div className="insight-card" key={idx}>
                    <div className="insight-header">
                      <span className="timestamp">{insight.timestamp}</span>
                      <span className="confidence">Confidence: {insight.confidence}%</span>
                    </div>
                    <p className="summary">{insight.summary}</p>
                    <details>
                      <summary>View Technical Data</summary>
                      <pre>{JSON.stringify(JSON.parse(insight.data), null, 2)}</pre>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <p>No insights available</p>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .oracle-address {
          margin: 20px 0;
          width: 100%;
          max-width: 600px;
        }
        
        .address-input {
          width: 100%;
          padding: 8px;
          margin: 5px 0 10px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        
        .data-section {
          display: flex;
          flex-wrap: wrap;
          width: 100%;
          margin-top: 30px;
          gap: 20px;
        }
        
        .market-data, .ai-insights {
          flex: 1;
          min-width: 300px;
        }
        
        .data-card {
          background-color: white;
          border-radius: 10px;
          padding: 20px;
          margin-top: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
        
        .selector {
          margin-bottom: 15px;
        }
        
        select {
          padding: 8px;
          border-radius: 4px;
          margin-left: 10px;
        }
        
        .insight-card {
          background-color: white;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .insight-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: #666;
        }
        
        .summary {
          font-size: 1.1rem;
          margin-bottom: 15px;
        }
        
        details {
          margin-top: 10px;
        }
        
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.85rem;
        }
        
        .error {
          color: #f44336;
          margin: 10px 0;
        }
        
        .loading {
          margin: 10px 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
} 