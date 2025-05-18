const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration parameters
const VOTING_DELAY = 1; // 1 block
const VOTING_PERIOD = 45818; // 1 week (at ~13 sec per block)
const QUORUM_PERCENTAGE = 4; // 4% of total supply
const MIN_TIMELOCK_DELAY = 172800; // 48 hours in seconds

// Addresses
let tokenAddress;
let timelockAddress;
let governorAddress;
let treasuryAddress;
let aiControllerAddress;
let aiOracleAddress;
let modelRegistryAddress;
let executionEngineAddress;

async function main() {
  console.log("Beginning Silica mainnet deployment with safety checks...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`Deployer balance: ${balanceInEth} ETH`);
  
  // Safety check for minimum funds
  if (balance < ethers.parseEther("2")) {
    console.error("WARNING: Deployer has less than 2 ETH. This may not be enough for complete deployment.");
    const confirmation = await promptForConfirmation("Continue anyway?");
    if (!confirmation) {
      console.log("Deployment aborted by user.");
      return;
    }
  }
  
  console.log("\n=== Network Information ===");
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`Chain ID: ${chainId}`);
  
  // Safety check for chain ID
  if (chainId !== 1) {
    console.error("WARNING: Chain ID is not 1 (Ethereum Mainnet). Make sure you're connected to the right network.");
    const confirmation = await promptForConfirmation("Are you sure you want to deploy to this network?");
    if (!confirmation) {
      console.log("Deployment aborted by user.");
      return;
    }
  }
  
  // Deploy with confirmations between each step
  await deployToken(deployer);
  await deployTimelock(deployer);
  await deployGovernor(deployer);
  await deployTreasury(deployer);
  await deployAIController(deployer);
  await deployAIOracle(deployer);
  await deployModelRegistry(deployer);
  await deployExecutionEngine(deployer);
  
  // Setup relationships between contracts
  await setupRoles(deployer);
  
  // Final verification
  await verifyContracts();
  
  // Save deployment info
  saveDeploymentInfo();
  
  console.log("\n=== Silica Deployment Complete ===");
  console.log("All contracts deployed and configured successfully.");
  console.log("Verify deployment information in the ./deployments/mainnet.json file.");
}

async function deployToken(deployer) {
  console.log("\n=== Deploying SilicaToken ===");
  
  await confirmationStep("Deploy SilicaToken?");
  
  const SilicaToken = await ethers.getContractFactory("SilicaToken");
  const silicaToken = await SilicaToken.deploy();
  await silicaToken.waitForDeployment();
  
  tokenAddress = await silicaToken.getAddress();
  console.log(`SilicaToken deployed to: ${tokenAddress}`);
  
  // Mint initial supply to deployer
  console.log("Minting initial supply...");
  const initialSupply = ethers.parseEther("10000000"); // 10M tokens
  
  const mintTx = await silicaToken.mint(deployer.address, initialSupply);
  await mintTx.wait();
  console.log(`Minted ${ethers.formatEther(initialSupply)} SIL tokens to deployer`);
  
  return silicaToken;
}

async function deployTimelock(deployer) {
  console.log("\n=== Deploying SilicaTimelock ===");
  
  await confirmationStep("Deploy SilicaTimelock?");
  
  // Initially empty arrays for proposers and executors
  // We'll set these up after other contracts are deployed
  const SilicaTimelock = await ethers.getContractFactory("SilicaTimelock");
  const silicaTimelock = await SilicaTimelock.deploy(
    MIN_TIMELOCK_DELAY,
    [], // proposers - will grant later
    []  // executors - will grant later
  );
  await silicaTimelock.waitForDeployment();
  
  timelockAddress = await silicaTimelock.getAddress();
  console.log(`SilicaTimelock deployed to: ${timelockAddress}`);
  
  return silicaTimelock;
}

async function deployGovernor(deployer) {
  console.log("\n=== Deploying SilicaGovernor ===");
  
  await confirmationStep("Deploy SilicaGovernor?");
  
  const SilicaGovernor = await ethers.getContractFactory("SilicaGovernor");
  const silicaGovernor = await SilicaGovernor.deploy(
    tokenAddress,
    timelockAddress,
    VOTING_DELAY,
    VOTING_PERIOD,
    QUORUM_PERCENTAGE
  );
  await silicaGovernor.waitForDeployment();
  
  governorAddress = await silicaGovernor.getAddress();
  console.log(`SilicaGovernor deployed to: ${governorAddress}`);
  
  return silicaGovernor;
}

async function deployTreasury(deployer) {
  console.log("\n=== Deploying SilicaTreasury ===");
  
  await confirmationStep("Deploy SilicaTreasury?");
  
  const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
  const silicaTreasury = await SilicaTreasury.deploy(timelockAddress);
  await silicaTreasury.waitForDeployment();
  
  treasuryAddress = await silicaTreasury.getAddress();
  console.log(`SilicaTreasury deployed to: ${treasuryAddress}`);
  
  return silicaTreasury;
}

async function deployAIController(deployer) {
  console.log("\n=== Deploying SilicaAIController ===");
  
  await confirmationStep("Deploy SilicaAIController?");
  
  const SilicaAIController = await ethers.getContractFactory("SilicaAIController");
  const silicaAIController = await SilicaAIController.deploy(
    tokenAddress,
    treasuryAddress
  );
  await silicaAIController.waitForDeployment();
  
  aiControllerAddress = await silicaAIController.getAddress();
  console.log(`SilicaAIController deployed to: ${aiControllerAddress}`);
  
  return silicaAIController;
}

async function deployAIOracle(deployer) {
  console.log("\n=== Deploying SilicaAIOracle ===");
  
  await confirmationStep("Deploy SilicaAIOracle?");
  
  const SilicaAIOracle = await ethers.getContractFactory("SilicaAIOracle");
  const silicaAIOracle = await SilicaAIOracle.deploy(
    aiControllerAddress,
    timelockAddress
  );
  await silicaAIOracle.waitForDeployment();
  
  aiOracleAddress = await silicaAIOracle.getAddress();
  console.log(`SilicaAIOracle deployed to: ${aiOracleAddress}`);
  
  return silicaAIOracle;
}

async function deployModelRegistry(deployer) {
  console.log("\n=== Deploying SilicaModelRegistry ===");
  
  await confirmationStep("Deploy SilicaModelRegistry?");
  
  const SilicaModelRegistry = await ethers.getContractFactory("SilicaModelRegistry");
  const silicaModelRegistry = await SilicaModelRegistry.deploy(
    tokenAddress,
    treasuryAddress
  );
  await silicaModelRegistry.waitForDeployment();
  
  modelRegistryAddress = await silicaModelRegistry.getAddress();
  console.log(`SilicaModelRegistry deployed to: ${modelRegistryAddress}`);
  
  return silicaModelRegistry;
}

async function deployExecutionEngine(deployer) {
  console.log("\n=== Deploying SilicaExecutionEngine ===");
  
  await confirmationStep("Deploy SilicaExecutionEngine?");
  
  const SilicaExecutionEngine = await ethers.getContractFactory("SilicaExecutionEngine");
  const silicaExecutionEngine = await SilicaExecutionEngine.deploy(
    modelRegistryAddress,
    tokenAddress,
    treasuryAddress
  );
  await silicaExecutionEngine.waitForDeployment();
  
  executionEngineAddress = await silicaExecutionEngine.getAddress();
  console.log(`SilicaExecutionEngine deployed to: ${executionEngineAddress}`);
  
  return silicaExecutionEngine;
}

async function setupRoles(deployer) {
  console.log("\n=== Setting Up Contract Roles and Permissions ===");
  
  await confirmationStep("Proceed with role setup?");
  
  // Setup Timelock roles
  console.log("Setting up timelock roles...");
  const timelock = await ethers.getContractAt("SilicaTimelock", timelockAddress);
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
  
  console.log("Granting PROPOSER_ROLE to Governor...");
  await (await timelock.grantRole(PROPOSER_ROLE, governorAddress)).wait();
  
  console.log("Granting EXECUTOR_ROLE to Governor and zero address (anyone)...");
  await (await timelock.grantRole(EXECUTOR_ROLE, governorAddress)).wait();
  await (await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress)).wait();
  
  console.log("Revoking TIMELOCK_ADMIN_ROLE from deployer...");
  await (await timelock.renounceRole(TIMELOCK_ADMIN_ROLE, deployer.address)).wait();
  
  // Setup Treasury
  console.log("Setting up treasury...");
  const treasury = await ethers.getContractAt("SilicaTreasury", treasuryAddress);
  
  console.log("Granting MANAGER_ROLE to AIController...");
  await (await treasury.setAIController(aiControllerAddress)).wait();
  
  // Setup AIController
  console.log("Setting up AI controller...");
  const aiController = await ethers.getContractAt("SilicaAIController", aiControllerAddress);
  
  console.log("Granting AI_OPERATOR_ROLE to AIOracle...");
  await (await aiController.addAIOperator(aiOracleAddress)).wait();
  
  // Transfer token ownership to timelock
  console.log("Transferring SilicaToken ownership to timelock...");
  const token = await ethers.getContractAt("SilicaToken", tokenAddress);
  await (await token.transferOwnership(timelockAddress)).wait();
  
  // Setup ModelRegistry role
  console.log("Setting up ModelRegistry roles...");
  const modelRegistry = await ethers.getContractAt("SilicaModelRegistry", modelRegistryAddress);
  
  console.log("Granting EXECUTION_ENGINE_ROLE to ExecutionEngine...");
  await (await modelRegistry.setExecutionEngine(executionEngineAddress)).wait();
  
  // Transfer initial tokens to treasury
  console.log("Funding treasury with initial tokens...");
  const initialTreasuryFunds = ethers.parseEther("1000000"); // 1M tokens
  
  await (await token.transfer(treasuryAddress, initialTreasuryFunds)).wait();
  console.log(`Transferred ${ethers.formatEther(initialTreasuryFunds)} SIL tokens to treasury`);
  
  console.log("All roles and permissions set up successfully");
}

async function verifyContracts() {
  console.log("\n=== Verifying Contracts on Etherscan ===");
  
  try {
    console.log("Waiting 30 seconds before verification to ensure Etherscan has indexed the contracts...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Verify SilicaToken
    console.log("Verifying SilicaToken...");
    await hre.run("verify:verify", { address: tokenAddress, constructorArguments: [] });
    
    // Verify SilicaTimelock
    console.log("Verifying SilicaTimelock...");
    await hre.run("verify:verify", {
      address: timelockAddress,
      constructorArguments: [MIN_TIMELOCK_DELAY, [], []]
    });
    
    // Verify SilicaGovernor
    console.log("Verifying SilicaGovernor...");
    await hre.run("verify:verify", {
      address: governorAddress,
      constructorArguments: [tokenAddress, timelockAddress, VOTING_DELAY, VOTING_PERIOD, QUORUM_PERCENTAGE]
    });
    
    // Verify SilicaTreasury
    console.log("Verifying SilicaTreasury...");
    await hre.run("verify:verify", {
      address: treasuryAddress,
      constructorArguments: [timelockAddress]
    });
    
    // Verify SilicaAIController
    console.log("Verifying SilicaAIController...");
    await hre.run("verify:verify", {
      address: aiControllerAddress,
      constructorArguments: [tokenAddress, treasuryAddress]
    });
    
    // Verify SilicaAIOracle
    console.log("Verifying SilicaAIOracle...");
    await hre.run("verify:verify", {
      address: aiOracleAddress,
      constructorArguments: [aiControllerAddress, timelockAddress]
    });
    
    // Verify SilicaModelRegistry
    console.log("Verifying SilicaModelRegistry...");
    await hre.run("verify:verify", {
      address: modelRegistryAddress,
      constructorArguments: [tokenAddress, treasuryAddress]
    });
    
    // Verify SilicaExecutionEngine
    console.log("Verifying SilicaExecutionEngine...");
    await hre.run("verify:verify", {
      address: executionEngineAddress,
      constructorArguments: [modelRegistryAddress, tokenAddress, treasuryAddress]
    });
    
    console.log("All contracts verified successfully");
  } catch (error) {
    console.error("Error during contract verification:", error);
    console.log("You may need to verify some contracts manually");
  }
}

function saveDeploymentInfo() {
  console.log("\n=== Saving Deployment Information ===");
  
  const deploymentInfo = {
    network: "mainnet",
    chainId: 1,
    contracts: {
      SilicaToken: tokenAddress,
      SilicaTimelock: timelockAddress,
      SilicaGovernor: governorAddress,
      SilicaTreasury: treasuryAddress,
      SilicaAIController: aiControllerAddress,
      SilicaAIOracle: aiOracleAddress,
      SilicaModelRegistry: modelRegistryAddress,
      SilicaExecutionEngine: executionEngineAddress
    },
    parameters: {
      votingDelay: VOTING_DELAY,
      votingPeriod: VOTING_PERIOD,
      quorumPercentage: QUORUM_PERCENTAGE,
      minTimelockDelay: MIN_TIMELOCK_DELAY
    },
    timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "mainnet.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment information saved to ./deployments/mainnet.json");
}

async function confirmationStep(message) {
  const confirmation = await promptForConfirmation(message);
  if (!confirmation) {
    console.log("Deployment step skipped.");
    return false;
  }
  return true;
}

async function promptForConfirmation(message) {
  // In a production script, you'd implement real user input here
  // For this example, we'll just return true and output the message
  console.log(`${message} [y/N]`);
  console.log("Automatically confirming for this example");
  return true;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 