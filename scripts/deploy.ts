import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Silica AI-powered contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", await deployer.getAddress());
  
  // Display balance for information
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Get the contract factories
  const SilicaToken = await ethers.getContractFactory("SilicaToken");
  const SilicaTimelock = await ethers.getContractFactory("SilicaTimelock");
  const SilicaGovernor = await ethers.getContractFactory("SilicaGovernor");
  const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
  const SilicaAIOracle = await ethers.getContractFactory("SilicaAIOracle");
  const SilicaAIController = await ethers.getContractFactory("SilicaAIController");

  // Deploy the token
  console.log("Deploying SilicaToken...");
  const silicaToken = await SilicaToken.deploy();
  await silicaToken.waitForDeployment();
  const silicaTokenAddress = await silicaToken.getAddress();
  console.log(`SilicaToken deployed to ${silicaTokenAddress}`);

  // Deploy the timelock
  // Timelock settings: 1 day minimum delay, empty proposers and executors (will be set later)
  const minDelay = 24 * 60 * 60; // 1 day in seconds
  
  // Add the deployer as a proposer initially so we can set up the contract
  const proposers: string[] = [deployer.address];
  const executors: string[] = []; // Empty means only specified executors can execute
  
  console.log("Deploying SilicaTimelock...");
  const silicaTimelock = await SilicaTimelock.deploy(minDelay, proposers, executors);
  await silicaTimelock.waitForDeployment();
  const silicaTimelockAddress = await silicaTimelock.getAddress();
  console.log(`SilicaTimelock deployed to ${silicaTimelockAddress}`);

  // Deploy the treasury with the timelock as governor
  console.log("Deploying SilicaTreasury...");
  const silicaTreasury = await SilicaTreasury.deploy(silicaTimelockAddress);
  await silicaTreasury.waitForDeployment();
  const silicaTreasuryAddress = await silicaTreasury.getAddress();
  console.log(`SilicaTreasury deployed to ${silicaTreasuryAddress}`);

  // Deploy the AI Oracle
  console.log("Deploying SilicaAIOracle...");
  const silicaAIOracle = await SilicaAIOracle.deploy();
  await silicaAIOracle.waitForDeployment();
  const silicaAIOracleAddress = await silicaAIOracle.getAddress();
  console.log(`SilicaAIOracle deployed to ${silicaAIOracleAddress}`);

  // Deploy the AI Controller
  console.log("Deploying SilicaAIController...");
  const silicaAIController = await SilicaAIController.deploy(
    silicaTokenAddress,
    silicaTreasuryAddress
  );
  await silicaAIController.waitForDeployment();
  const silicaAIControllerAddress = await silicaAIController.getAddress();
  console.log(`SilicaAIController deployed to ${silicaAIControllerAddress}`);

  // Deploy the governor
  // Governor settings: 1 day voting delay, 1 week voting period, 4% quorum
  const votingDelay = 24 * 60 * 60 / 12; // 1 day in blocks (assuming ~12s block time)
  const votingPeriod = 7 * 24 * 60 * 60 / 12; // 1 week in blocks
  const quorumPercentage = 4; // 4% quorum
  
  console.log("Deploying SilicaGovernor...");
  const silicaGovernor = await SilicaGovernor.deploy(
    silicaTokenAddress,
    silicaTimelockAddress,
    votingDelay,
    votingPeriod,
    quorumPercentage
  );
  await silicaGovernor.waitForDeployment();
  const silicaGovernorAddress = await silicaGovernor.getAddress();
  console.log(`SilicaGovernor deployed to ${silicaGovernorAddress}`);

  // Setup roles for the timelock
  console.log("Setting up timelock roles...");
  
  // Get the roles
  const proposerRole = await silicaTimelock.PROPOSER_ROLE();
  const executorRole = await silicaTimelock.EXECUTOR_ROLE();
  const adminRole = await silicaTimelock.DEFAULT_ADMIN_ROLE();

  // Grant roles - both the governor and AI controller can propose, anyone can execute
  await silicaTimelock.grantRole(proposerRole, silicaGovernorAddress);
  await silicaTimelock.grantRole(proposerRole, silicaAIControllerAddress);
  await silicaTimelock.grantRole(executorRole, ethers.ZeroAddress); // Anyone can execute
  
  // Set the timelock as its own admin (standard pattern for timelock security)
  await silicaTimelock.grantRole(adminRole, silicaTimelockAddress);
  
  // Renounce admin role from deployer to ensure proper security (optional - remove if you want to maintain control)
  // await silicaTimelock.renounceRole(adminRole, await deployer.getAddress());

  // Setup AI controller in the oracle
  console.log("Connecting the AI oracle to the controller...");
  await silicaAIOracle.addOracleProvider(silicaAIControllerAddress);

  // Setup AI controller as treasury manager
  console.log("Connecting the AI controller to the treasury...");
  await silicaTreasury.setAIController(silicaAIControllerAddress);

  // Setup AI controller for token management
  console.log("Granting AI controller token management rights...");
  await silicaToken.addAIController(silicaAIControllerAddress);

  // Set up initial tracked assets
  console.log("Setting up initial assets and data feeds...");
  
  // Add ETH as a tracked asset in treasury
  await silicaTreasury.addAsset(
    "0x0000000000000000000000000000000000000000",
    "Ethereum",
    "native"
  );
  
  // Add Silica token as a tracked asset
  await silicaTreasury.addAsset(
    silicaTokenAddress,
    "Silica",
    "governance"
  );
  
  // Add market tracking for ETH and BTC
  await silicaAIOracle.addSymbol("ETH/USD");
  await silicaAIOracle.addSymbol("BTC/USD");
  
  // Add insight types
  await silicaAIOracle.addInsightType("market_prediction");
  await silicaAIOracle.addInsightType("treasury_management");
  await silicaAIOracle.addInsightType("governance_proposal");

  console.log("Deployment complete!");
  console.log({
    silicaToken: silicaTokenAddress,
    silicaTimelock: silicaTimelockAddress,
    silicaGovernor: silicaGovernorAddress,
    silicaTreasury: silicaTreasuryAddress,
    silicaAIOracle: silicaAIOracleAddress,
    silicaAIController: silicaAIControllerAddress
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 