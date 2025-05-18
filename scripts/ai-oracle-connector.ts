import { ethers } from "hardhat";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Configure these variables
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const AI_API_KEY = process.env.AI_API_KEY || ""; 
const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY || "";
// Use SEPOLIA_RPC_URL or MAINNET_RPC_URL for network selection
const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || process.env.MAINNET_RPC_URL || "http://localhost:8545";
const UPDATE_INTERVAL_MS = 3600000; // 1 hour in milliseconds

// MarketData API endpoints
const API_ENDPOINTS = {
  ethPrice: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=ETH&to_currency=USD&apikey=${ALPHAVANTAGE_API_KEY}`,
  btcPrice: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${ALPHAVANTAGE_API_KEY}`,
  economicData: "https://www.alphavantage.co/query?function=FEDERAL_FUNDS_RATE&interval=monthly&apikey=${ALPHAVANTAGE_API_KEY}"
};

// Mock AI API for insights (in production, connect to a real AI API)
async function getAIInsights(marketData: any) {
  // In production, replace with actual API call to your AI service
  // For example: const response = await axios.post('https://your-ai-api.com/insights', { marketData, apiKey: AI_API_KEY });
  
  // Mock response for demonstration
  const sentimentScore = Math.floor(Math.random() * 201) - 100; // -100 to 100
  const volatilityScore = Math.floor(Math.random() * 101); // 0 to 100
  const trends = ["bullish", "bearish", "neutral"];
  const trend = trends[Math.floor(Math.random() * trends.length)];
  
  const confidence = Math.floor(Math.random() * 81) + 20; // 20 to 100
  
  return {
    sentiment: sentimentScore,
    volatility: volatilityScore,
    trend: trend,
    confidence: confidence,
    marketPrediction: {
      summary: `The market appears to be ${trend} in the short term. ${
        sentimentScore > 50 ? "Strong positive sentiment detected." :
        sentimentScore < -50 ? "Strong negative sentiment detected." : 
        "Mixed market signals present."
      }`,
      data: JSON.stringify({
        technicalIndicators: {
          rsi: Math.floor(Math.random() * 101),
          macd: Math.random() * 2 - 1,
          bollingerBands: {
            upper: parseFloat(marketData.price) * 1.05,
            middle: parseFloat(marketData.price),
            lower: parseFloat(marketData.price) * 0.95
          }
        },
        forecastedRange: {
          oneDay: {
            low: parseFloat(marketData.price) * 0.97,
            high: parseFloat(marketData.price) * 1.03
          },
          oneWeek: {
            low: parseFloat(marketData.price) * 0.9,
            high: parseFloat(marketData.price) * 1.1
          }
        },
        recommendedActions: [
          sentimentScore > 30 ? "Increase allocation" : 
          sentimentScore < -30 ? "Reduce exposure" : "Maintain position"
        ]
      })
    },
    treasuryManagement: {
      summary: `Based on current market conditions, the treasury should ${
        sentimentScore > 50 ? "increase allocation to ETH." :
        sentimentScore < -50 ? "reduce exposure and increase stablecoin reserves." :
        "maintain diversified holdings with balanced risk."
      }`,
      data: JSON.stringify({
        assetAllocation: {
          ethereum: Math.max(10, Math.min(60, 40 + sentimentScore / 5)), // 10% to 60%
          stablecoins: Math.max(20, Math.min(80, 50 - sentimentScore / 5)), // 20% to 80%
          otherAssets: 10, // Fixed 10%
        },
        liquidityRecommendation: `Maintain at least ${
          volatilityScore > 70 ? "50" :
          volatilityScore > 40 ? "30" : "20"
        }% in liquid assets`,
        investmentOpportunities: [
          "Ethereum staking",
          "Yield farming in established protocols",
          "Treasury diversification"
        ]
      })
    }
  };
}

async function fetchMarketData(endpoint: string) {
  try {
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching market data:", error);
    return null;
  }
}

async function processAndUpdateOracle() {
  try {
    if (!ORACLE_ADDRESS) {
      console.error("Oracle address not configured!");
      return;
    }

    // Connect to the blockchain network
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Get oracle contract instance
    const oracleAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/SilicaAIOracle.sol/SilicaAIOracle.json', 'utf8')).abi;
    const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleAbi, wallet);

    // Fetch market data
    console.log("Fetching market data...");
    const ethData = await fetchMarketData(API_ENDPOINTS.ethPrice);
    const btcData = await fetchMarketData(API_ENDPOINTS.btcPrice);
    
    if (!ethData || !btcData) {
      console.error("Failed to fetch required market data");
      return;
    }
    
    // Parse market data
    const ethPrice = parseFloat(ethData['Realtime Currency Exchange Rate']['5. Exchange Rate']) * 10**8; // Convert to 8 decimals
    const btcPrice = parseFloat(btcData['Realtime Currency Exchange Rate']['5. Exchange Rate']) * 10**8;
    
    // Get AI insights for ETH
    console.log("Getting AI insights...");
    const ethInsights = await getAIInsights({ 
      symbol: "ETH/USD", 
      price: ethData['Realtime Currency Exchange Rate']['5. Exchange Rate']
    });
    
    // Update ETH market data on-chain
    console.log("Updating ETH market data on-chain...");
    const ethUpdateTx = await oracle.updateMarketData(
      "ETH/USD",
      ethPrice.toString(),
      ethInsights.sentiment,
      ethInsights.volatility,
      ethInsights.trend
    );
    await ethUpdateTx.wait();
    console.log(`ETH/USD market data updated. Tx: ${ethUpdateTx.hash}`);
    
    // Update BTC market data on-chain
    console.log("Updating BTC market data on-chain...");
    const btcInsights = await getAIInsights({ 
      symbol: "BTC/USD", 
      price: btcData['Realtime Currency Exchange Rate']['5. Exchange Rate']
    });
    
    const btcUpdateTx = await oracle.updateMarketData(
      "BTC/USD",
      btcPrice.toString(),
      btcInsights.sentiment,
      btcInsights.volatility,
      btcInsights.trend
    );
    await btcUpdateTx.wait();
    console.log(`BTC/USD market data updated. Tx: ${btcUpdateTx.hash}`);
    
    // Add AI market prediction insight
    console.log("Adding market prediction insight...");
    const marketPredictionTx = await oracle.addAIInsight(
      "market_prediction",
      ethInsights.marketPrediction.summary,
      ethInsights.marketPrediction.data,
      ethInsights.confidence
    );
    await marketPredictionTx.wait();
    console.log(`Market prediction insight added. Tx: ${marketPredictionTx.hash}`);
    
    // Add treasury management insight
    console.log("Adding treasury management insight...");
    const treasuryTx = await oracle.addAIInsight(
      "treasury_management",
      ethInsights.treasuryManagement.summary,
      ethInsights.treasuryManagement.data,
      ethInsights.confidence
    );
    await treasuryTx.wait();
    console.log(`Treasury management insight added. Tx: ${treasuryTx.hash}`);
    
    console.log("Oracle updates completed successfully!");
  } catch (error) {
    console.error("Error in oracle update process:", error);
  }
}

// Run on script start
processAndUpdateOracle();

// Set up recurring updates
if (process.env.RUN_CONTINUOUSLY === "true") {
  console.log(`Oracle will update every ${UPDATE_INTERVAL_MS/1000/60} minutes`);
  setInterval(processAndUpdateOracle, UPDATE_INTERVAL_MS);
} 