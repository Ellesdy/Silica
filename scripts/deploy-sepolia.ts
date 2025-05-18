import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Display balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));
  
  // Deploy SilicaToken
  console.log("Deploying SilicaToken...");
  const SilicaToken = await ethers.getContractFactory("SilicaToken");
  const silicaToken = await SilicaToken.deploy();
  await silicaToken.waitForDeployment();
  const silicaTokenAddress = await silicaToken.getAddress();
  console.log("SilicaToken deployed to:", silicaTokenAddress);

  // Deploy SilicaTimelock
  console.log("Deploying SilicaTimelock...");
  const minDelay = 86400; // 1 day in seconds
  const SilicaTimelock = await ethers.getContractFactory("SilicaTimelock");
  const silicaTimelock = await SilicaTimelock.deploy(minDelay, [], []);
  await silicaTimelock.waitForDeployment();
  const silicaTimelockAddress = await silicaTimelock.getAddress();
  console.log("SilicaTimelock deployed to:", silicaTimelockAddress);

  // Deploy SilicaTreasury
  console.log("Deploying SilicaTreasury...");
  const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
  const silicaTreasury = await SilicaTreasury.deploy(silicaTimelockAddress);
  await silicaTreasury.waitForDeployment();
  const silicaTreasuryAddress = await silicaTreasury.getAddress();
  console.log("SilicaTreasury deployed to:", silicaTreasuryAddress);

  // Deploy SilicaAIOracle
  console.log("Deploying SilicaAIOracle...");
  const SilicaAIOracle = await ethers.getContractFactory("SilicaAIOracle");
  const silicaAIOracle = await SilicaAIOracle.deploy();
  await silicaAIOracle.waitForDeployment();
  const silicaAIOracleAddress = await silicaAIOracle.getAddress();
  console.log("SilicaAIOracle deployed to:", silicaAIOracleAddress);

  // Deploy SilicaAIController
  console.log("Deploying SilicaAIController...");
  const SilicaAIController = await ethers.getContractFactory("SilicaAIController");
  const silicaAIController = await SilicaAIController.deploy(
    silicaTokenAddress,
    silicaTreasuryAddress
  );
  await silicaAIController.waitForDeployment();
  const silicaAIControllerAddress = await silicaAIController.getAddress();
  console.log("SilicaAIController deployed to:", silicaAIControllerAddress);

  // Deploy SilicaModelRegistry (NEW)
  console.log("Deploying SilicaModelRegistry...");
  const SilicaModelRegistry = await ethers.getContractFactory("SilicaModelRegistry");
  const silicaModelRegistry = await SilicaModelRegistry.deploy();
  await silicaModelRegistry.waitForDeployment();
  const silicaModelRegistryAddress = await silicaModelRegistry.getAddress();
  console.log("SilicaModelRegistry deployed to:", silicaModelRegistryAddress);

  // Deploy SilicaExecutionEngine (NEW)
  console.log("Deploying SilicaExecutionEngine...");
  const SilicaExecutionEngine = await ethers.getContractFactory("SilicaExecutionEngine");
  const silicaExecutionEngine = await SilicaExecutionEngine.deploy(
    silicaModelRegistryAddress,
    silicaTokenAddress,
    silicaTreasuryAddress
  );
  await silicaExecutionEngine.waitForDeployment();
  const silicaExecutionEngineAddress = await silicaExecutionEngine.getAddress();
  console.log("SilicaExecutionEngine deployed to:", silicaExecutionEngineAddress);

  // Setting up connections
  console.log("Setting up connections between contracts...");

  // Grant AI controller role to the AI controller
  const addControllerTx = await silicaToken.addAIController(silicaAIControllerAddress);
  await addControllerTx.wait();
  console.log("Granted AI controller role to:", silicaAIControllerAddress);

  // Grant AI controller role to the treasury
  const setAIControllerTx = await silicaTreasury.setAIController(silicaAIControllerAddress);
  await setAIControllerTx.wait();
  console.log("Set AI controller for treasury");

  // Add oracle provider
  const addProviderTx = await silicaAIOracle.addOracleProvider(silicaAIControllerAddress);
  await addProviderTx.wait();
  console.log("Added AI controller as oracle provider");

  // Add tracked assets
  const addAssetTx = await silicaTreasury.addAsset(
    silicaTokenAddress, 
    "Silica",
    "governance"
  );
  await addAssetTx.wait();
  console.log("Added Silica token as tracked asset");

  // Grant MODEL_CREATOR_ROLE to the AI controller and execution engine
  const addCreatorTx = await silicaModelRegistry.addModelCreator(silicaAIControllerAddress);
  await addCreatorTx.wait();
  console.log("Granted MODEL_CREATOR_ROLE to AI controller");

  const addExecutionCreatorTx = await silicaModelRegistry.addModelCreator(silicaExecutionEngineAddress);
  await addExecutionCreatorTx.wait();
  console.log("Granted MODEL_CREATOR_ROLE to execution engine");

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      SilicaToken: silicaTokenAddress,
      SilicaTimelock: silicaTimelockAddress,
      SilicaTreasury: silicaTreasuryAddress,
      SilicaAIOracle: silicaAIOracleAddress,
      SilicaAIController: silicaAIControllerAddress,
      SilicaModelRegistry: silicaModelRegistryAddress,
      SilicaExecutionEngine: silicaExecutionEngineAddress
    }
  };

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }

  // Save deployment info
  fs.writeFileSync(
    `./deployments/sepolia-${new Date().toISOString().replace(/:/g, "-")}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Also save to a consistent location for easier access by frontend
  fs.writeFileSync(
    `./deployments/sepolia-latest.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment completed successfully!");
  console.log("Deployment info saved to deployments/ directory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 