const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const deploymentInfo = require("../deployments/hardhat-latest.json");
  const oracleAddress = deploymentInfo.contracts.SilicaAIOracle;
  const controllerAddress = deploymentInfo.contracts.SilicaAIController;
  
  // Connect to contracts
  const SilicaAIOracle = await ethers.getContractFactory("SilicaAIOracle");
  const oracle = await SilicaAIOracle.attach(oracleAddress);
  
  // Get signers (default hardhat accounts)
  const [deployer] = await ethers.getSigners();
  
  console.log("Admin account:", deployer.address);
  
  // Add market symbols
  console.log("Adding market symbols...");
  const symbols = ["ETH/USD", "BTC/USD", "SILICA/USD"];
  
  for (const symbol of symbols) {
    // Check if symbol already exists
    const allSymbols = await oracle.getAllSymbols();
    if (!allSymbols.includes(symbol)) {
      console.log(`Adding symbol: ${symbol}`);
      const addSymbolTx = await oracle.addSymbol(symbol);
      await addSymbolTx.wait();
    } else {
      console.log(`Symbol ${symbol} already exists`);
    }
  }
  
  // Add market data
  console.log("Adding market data...");
  
  // Current timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  
  // ETH/USD data (price in USD cents)
  await oracle.updateMarketData(
    "ETH/USD",
    350000, // $3,500.00
    348500, // $3,485.00
    355000, // $3,550.00
    28000000, // 24h volume: $28M
    timestamp
  );
  console.log("Added ETH/USD market data");
  
  // BTC/USD data (price in USD cents)
  await oracle.updateMarketData(
    "BTC/USD",
    6200000, // $62,000.00
    6150000, // $61,500.00
    6300000, // $63,000.00
    125000000, // 24h volume: $125M
    timestamp
  );
  console.log("Added BTC/USD market data");
  
  // SILICA/USD data (price in USD cents)
  await oracle.updateMarketData(
    "SILICA/USD",
    500, // $5.00
    480, // $4.80
    520, // $5.20
    500000, // 24h volume: $500K
    timestamp
  );
  console.log("Added SILICA/USD market data");
  
  // Add insight types
  console.log("Adding insight types...");
  const insightTypes = ["market_prediction", "treasury_management", "governance_proposal"];
  
  for (const insightType of insightTypes) {
    // Check if insight type already exists
    const allTypes = await oracle.getAllInsightTypes();
    if (!allTypes.includes(insightType)) {
      console.log(`Adding insight type: ${insightType}`);
      const addTypeTx = await oracle.addInsightType(insightType);
      await addTypeTx.wait();
    } else {
      console.log(`Insight type ${insightType} already exists`);
    }
  }
  
  // Add AI insights
  console.log("Adding AI insights...");
  
  // Market prediction insight
  await oracle.addAIInsight(
    "market_prediction",
    "ETH price is expected to increase by 5-8% over the next week based on technical indicators and market sentiment analysis.",
    JSON.stringify({
      symbol: "ETH/USD",
      prediction: "bullish",
      confidence: 0.85,
      timeframe: "1 week",
      expectedPriceChange: 0.065
    }),
    timestamp,
    timestamp + 7 * 24 * 60 * 60 // Valid for 1 week
  );
  console.log("Added market prediction insight");
  
  // Treasury management insight
  await oracle.addAIInsight(
    "treasury_management",
    "Recommend increasing ETH allocation to 40% of treasury due to positive price action expected.",
    JSON.stringify({
      action: "increase_allocation",
      asset: "ETH",
      targetAllocation: 0.4,
      reason: "positive_outlook"
    }),
    timestamp,
    timestamp + 14 * 24 * 60 * 60 // Valid for 2 weeks
  );
  console.log("Added treasury management insight");
  
  // Governance proposal insight
  await oracle.addAIInsight(
    "governance_proposal",
    "Recommend expanding the model creator role to verified community developers to increase the number of AI models in the ecosystem.",
    JSON.stringify({
      proposal: "expand_model_creator_role",
      targetAudience: "verified_developers",
      expectedBenefit: "increased_model_variety",
      implementationComplexity: "low"
    }),
    timestamp,
    timestamp + 30 * 24 * 60 * 60 // Valid for 1 month
  );
  console.log("Added governance proposal insight");
  
  // Get and display insights
  console.log("\nRetrieving insights from oracle...");
  const marketInsights = await oracle.getInsightsByType("market_prediction");
  console.log(`Found ${marketInsights.length} market prediction insights`);
  if (marketInsights.length > 0) {
    console.log("Latest market prediction:");
    console.log(`- Content: ${marketInsights[marketInsights.length - 1].content}`);
    console.log(`- Created at: ${new Date(marketInsights[marketInsights.length - 1].timestamp * 1000).toISOString()}`);
  }
  
  console.log("Oracle interaction tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 