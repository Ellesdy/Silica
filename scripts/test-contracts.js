// Script to test interaction with deployed contracts
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Load deployment addresses
  let deploymentData;
  try {
    const deploymentPath = path.join(__dirname, "../deployments/localhost-latest.json");
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
  const tokenAddress = deploymentData.contracts.SilicaToken;
  const oracleAddress = deploymentData.contracts.SilicaAIOracle;
  const controllerAddress = deploymentData.contracts.SilicaAIController;
  const treasuryAddress = deploymentData.contracts.SilicaTreasury;
  
  console.log("Token address:", tokenAddress);
  console.log("Oracle address:", oracleAddress);
  console.log("Controller address:", controllerAddress);
  console.log("Treasury address:", treasuryAddress);
  
  // Get contract instances
  const token = await ethers.getContractAt("SilicaToken", tokenAddress, signer);
  const oracle = await ethers.getContractAt("SilicaAIOracle", oracleAddress, signer);
  const controller = await ethers.getContractAt("SilicaAIController", controllerAddress, signer);
  const treasury = await ethers.getContractAt("SilicaTreasury", treasuryAddress, signer);
  
  // 1. Query token info
  console.log("\nToken Information:");
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const balance = await token.balanceOf(signer.address);
  
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
  console.log(`Balance of ${signer.address}: ${ethers.formatEther(balance)} ${symbol}`);
  
  // 2. Query AI Controller thresholds
  console.log("\nAI Controller Thresholds:");
  const buyThreshold = await controller.buyThreshold();
  const sellThreshold = await controller.sellThreshold();
  const maxTradePercentage = await controller.maxTradePercentage();
  
  console.log(`Buy Threshold: ${ethers.formatEther(buyThreshold)} ETH`);
  console.log(`Sell Threshold: ${ethers.formatEther(sellThreshold)} ETH`);
  console.log(`Max Trade Percentage: ${maxTradePercentage}%`);
  
  // 3. Query oracle data for market symbols
  console.log("\nMarket Data from Oracle:");
  try {
    const symbols = await oracle.getAllSymbols();
    console.log(`Tracking ${symbols.length} symbols: ${symbols.join(", ")}`);
    
    for (const symbol of symbols) {
      const marketData = await oracle.getMarketData(symbol);
      console.log(`\n${symbol}:`);
      console.log(`  Price: $${ethers.formatUnits(marketData.price, 8)}`);
      console.log(`  Sentiment: ${marketData.sentiment}`);
      console.log(`  Volatility: ${marketData.volatility}%`);
      console.log(`  Trend: ${marketData.predictiveTrend}`);
      console.log(`  Updated: ${new Date(Number(marketData.timestamp) * 1000).toLocaleString()}`);
    }
  } catch (err) {
    console.log("No market data available yet");
  }
  
  // 4. Query oracle AI insights
  console.log("\nAI Insights from Oracle:");
  try {
    const insightTypes = await oracle.getAllInsightTypes();
    console.log(`Tracking ${insightTypes.length} insight types: ${insightTypes.join(", ")}`);
    
    for (const insightType of insightTypes) {
      try {
        const insights = await oracle.getInsightsByType(insightType, 0, 1);
        if (insights.length > 0) {
          console.log(`\n${insightType}:`);
          console.log(`  Summary: ${insights[0].summary}`);
          console.log(`  Confidence: ${insights[0].confidence}%`);
          console.log(`  Updated: ${new Date(Number(insights[0].timestamp) * 1000).toLocaleString()}`);
        }
      } catch (err) {
        console.log(`No insights available for ${insightType}`);
      }
    }
  } catch (err) {
    console.log("No insight types available yet");
  }
  
  // 5. Query treasury assets
  console.log("\nTreasury Assets:");
  try {
    const assets = await treasury.getAllAssets();
    console.log(`Treasury contains ${assets.length} assets`);
    
    for (const assetAddress of assets) {
      const [name, assetType, isActive] = await treasury.assets(assetAddress);
      const balance = await treasury.getTokenBalance(assetAddress);
      
      console.log(`\n${name} (${assetAddress}):`);
      console.log(`  Type: ${assetType}`);
      console.log(`  Active: ${isActive}`);
      console.log(`  Balance: ${ethers.formatEther(balance)}`);
    }
  } catch (err) {
    console.log("No treasury assets available yet or error:", err.message);
  }
  
  console.log("\nContract test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in test:", error);
    process.exit(1);
  }); 