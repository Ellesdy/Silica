// Script to simulate AI behavior by populating Oracle with data and making decisions
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Market symbols to track
const SYMBOLS = ["ETH/USD", "BTC/USD", "LINK/USD", "UNI/USD"];

// Insight types
const INSIGHT_TYPES = [
  "market_prediction", 
  "treasury_management", 
  "trading_strategy", 
  "risk_assessment"
];

// Random price within range
function randomPrice(base, volatility) {
  return Math.floor(base * (1 + (Math.random() * volatility * 2 - volatility)) * 100000000);
}

// Random sentiment between -100 and 100
function randomSentiment() {
  return Math.floor(Math.random() * 200 - 100);
}

// Random volatility between 0 and 100
function randomVolatility() {
  return Math.floor(Math.random() * 100);
}

// Random trend
function randomTrend() {
  const trends = ["bullish", "bearish", "neutral", "highly_bullish", "highly_bearish"];
  return trends[Math.floor(Math.random() * trends.length)];
}

// Random confidence between 50 and 100
function randomConfidence() {
  return Math.floor(Math.random() * 50 + 50);
}

// Generate market insight summary
function generateInsightSummary(type) {
  const marketPredictions = [
    "Analysis suggests a bullish momentum building in the next 24-48 hours",
    "Technical indicators show overbought conditions, expect correction",
    "Recent volatility suggests consolidation before next significant move",
    "Market sentiment is turning positive following recent developments",
    "Volume analysis indicates accumulation phase, potential uptrend forming"
  ];
  
  const treasuryManagement = [
    "Current market conditions suggest increasing stablecoin allocation",
    "Recommend rebalancing portfolio to increase exposure to ETH",
    "Treasury diversification recommended to hedge against volatility",
    "Optimal strategy is to maintain current allocation with minor adjustments",
    "Liquidity position should be increased ahead of potential market movement"
  ];
  
  const tradingStrategy = [
    "Implement dollar-cost averaging strategy over next 72 hours",
    "Set limit orders at key support levels identified by technical analysis",
    "Current spread between exchanges presents arbitrage opportunity",
    "Maintain defensive position until volatility subsides",
    "Set trailing stop orders to protect recent gains"
  ];
  
  const riskAssessment = [
    "Current risk level: Moderate. Key metrics within normal parameters",
    "Market correlation increasing across assets, diversification less effective",
    "Liquidation risks minimal given current collateralization ratios",
    "Systemic risk indicators elevated, suggesting cautious positioning",
    "Volatility metrics suggest implementing hedging strategies"
  ];
  
  switch(type) {
    case "market_prediction":
      return marketPredictions[Math.floor(Math.random() * marketPredictions.length)];
    case "treasury_management":
      return treasuryManagement[Math.floor(Math.random() * treasuryManagement.length)];
    case "trading_strategy":
      return tradingStrategy[Math.floor(Math.random() * tradingStrategy.length)];
    case "risk_assessment":
      return riskAssessment[Math.floor(Math.random() * riskAssessment.length)];
    default:
      return "AI analysis complete. See data for details.";
  }
}

// Random decision type
function randomDecision() {
  const decisions = ["MINT", "BURN", "TRADE", "UPDATE_THRESHOLDS"];
  return decisions[Math.floor(Math.random() * decisions.length)];
}

// Generate decision rationale
function generateRationale(decisionType) {
  switch(decisionType) {
    case "MINT":
      return "Market conditions favorable for expanding token supply to increase liquidity and support ecosystem growth";
    case "BURN":
      return "Deflationary pressure recommended to stabilize token value amid current market volatility";
    case "TRADE":
      return "Portfolio rebalancing to optimize risk-adjusted returns based on current market momentum";
    case "UPDATE_THRESHOLDS":
      return "Adjusting trading parameters to adapt to changing market conditions and volatility patterns";
    default:
      return "Decision based on comprehensive market analysis and optimization algorithms";
  }
}

async function main() {
  // Load deployment addresses
  let deploymentData;
  try {
    // Try localhost first, then fall back to sepolia if specified
    const network = process.env.NETWORK || 'localhost';
    const deploymentPath = path.join(
      __dirname, 
      `../deployments/${network}-latest.json`
    );
    
    console.log(`Loading deployment from ${deploymentPath}`);
    
    deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  } catch (err) {
    console.error("Error loading deployment data:", err);
    console.log("Please make sure contracts are deployed and the deployment file exists");
    return;
  }
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Contract addresses
  const oracleAddress = deploymentData.contracts.SilicaAIOracle;
  const controllerAddress = deploymentData.contracts.SilicaAIController;
  
  // Get contract instances
  const aiOracle = await ethers.getContractAt("SilicaAIOracle", oracleAddress, signer);
  const aiController = await ethers.getContractAt("SilicaAIController", controllerAddress, signer);
  
  console.log(`Connected to Oracle at ${oracleAddress}`);
  console.log(`Connected to Controller at ${controllerAddress}`);
  
  // Add market symbols to track
  console.log("\nAdding market symbols to Oracle...");
  for (const symbol of SYMBOLS) {
    try {
      await aiOracle.addSymbol(symbol);
      console.log(`Added symbol: ${symbol}`);
    } catch (err) {
      console.log(`Symbol ${symbol} might already exist or error: ${err.message}`);
    }
  }
  
  // Add insight types
  console.log("\nAdding insight types to Oracle...");
  for (const insightType of INSIGHT_TYPES) {
    try {
      await aiOracle.addInsightType(insightType);
      console.log(`Added insight type: ${insightType}`);
    } catch (err) {
      console.log(`Insight type ${insightType} might already exist or error: ${err.message}`);
    }
  }
  
  // Update market data
  console.log("\nUpdating market data...");
  for (const symbol of SYMBOLS) {
    const basePrice = symbol.startsWith("ETH") ? 3000 : 
                      symbol.startsWith("BTC") ? 60000 : 
                      symbol.startsWith("LINK") ? 15 : 30;
    
    const price = randomPrice(basePrice, 0.05); // 5% volatility
    const sentiment = randomSentiment();
    const volatility = randomVolatility();
    const trend = randomTrend();
    
    await aiOracle.updateMarketData(symbol, price, sentiment, volatility, trend);
    console.log(`Updated market data for ${symbol}: $${(price / 100000000).toFixed(2)}, sentiment: ${sentiment}, volatility: ${volatility}%, trend: ${trend}`);
  }
  
  // Add AI insights
  console.log("\nAdding AI insights...");
  for (const insightType of INSIGHT_TYPES) {
    const summary = generateInsightSummary(insightType);
    const data = JSON.stringify({
      timestamp: Date.now(),
      technicalIndicators: {
        rsi: Math.floor(Math.random() * 100),
        macd: (Math.random() * 2 - 1).toFixed(2),
        bollingerBands: {
          upper: 100 + Math.random() * 10,
          middle: 100,
          lower: 100 - Math.random() * 10
        }
      },
      confidenceFactors: {
        historicalAccuracy: (Math.random() * 20 + 80).toFixed(2),
        dataQuality: (Math.random() * 20 + 80).toFixed(2),
        marketConditions: (Math.random() * 20 + 80).toFixed(2)
      }
    });
    
    const confidence = randomConfidence();
    
    await aiOracle.addAIInsight(insightType, summary, data, confidence);
    console.log(`Added ${insightType} insight: "${summary.substring(0, 60)}..." (${confidence}% confidence)`);
  }
  
  // Execute AI decisions
  console.log("\nExecuting AI decisions...");
  
  try {
    // Random decision: update trading thresholds
    const buyThreshold = ethers.parseEther((2800 + Math.random() * 200).toString());
    const sellThreshold = ethers.parseEther((3200 + Math.random() * 200).toString());
    const maxTradePercentage = Math.floor(Math.random() * 20 + 5); // 5-25%
    
    console.log(`Updating thresholds: buy at ${ethers.formatEther(buyThreshold)} ETH, sell at ${ethers.formatEther(sellThreshold)} ETH, max trade ${maxTradePercentage}%`);
    
    // Call updateThresholds directly instead of using executeDecision
    await aiController.updateThresholds(
      buyThreshold,
      sellThreshold,
      maxTradePercentage
    );
    console.log(`Updated trading thresholds`);
    
    // Mint some tokens
    const mintAmount = ethers.parseEther((100 + Math.random() * 900).toString()); // 100-1000 tokens
    console.log(`Minting ${ethers.formatEther(mintAmount)} tokens to ${signer.address}`);
    
    await aiController.mintTokens(
      signer.address, 
      mintAmount, 
      "Strategic inflation to increase market liquidity and support ecosystem growth"
    );
    console.log(`Minted ${ethers.formatEther(mintAmount)} tokens to ${signer.address}`);
  } catch (error) {
    console.error("Error executing AI decisions:", error.message);
  }

  console.log("\nAI simulation complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in AI simulation:", error);
    process.exit(1);
  }); 