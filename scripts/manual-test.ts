import { ethers } from "hardhat";

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy SilicaToken
  console.log("Deploying SilicaToken...");
  const SilicaToken = await ethers.getContractFactory("SilicaToken");
  const silicaToken = await SilicaToken.deploy();
  await silicaToken.waitForDeployment();
  const silicaTokenAddress = await silicaToken.getAddress();
  console.log("SilicaToken deployed to:", silicaTokenAddress);

  // Deploy SilicaTimelock
  console.log("Deploying SilicaTimelock...");
  const minDelay = 86400; // 1 day
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

  // Setting up connections
  console.log("Setting up connections between contracts...");

  // Grant AI controller role to the AI controller
  await silicaToken.addAIController(silicaAIControllerAddress);
  console.log("Granted AI controller role to:", silicaAIControllerAddress);

  // Grant AI controller role to the treasury
  await silicaTreasury.setAIController(silicaAIControllerAddress);
  console.log("Set AI controller for treasury");

  // Add oracle provider
  await silicaAIOracle.addOracleProvider(silicaAIControllerAddress);
  console.log("Added AI controller as oracle provider");

  // Add tracked assets
  await silicaTreasury.addAsset(
    silicaTokenAddress, 
    "Silica",
    "governance"
  );
  console.log("Added Silica token as tracked asset");

  // Test token transfer
  console.log("Testing token transfer...");
  const initialBalance = await silicaToken.balanceOf(deployer.address);
  console.log("Initial deployer balance:", ethers.formatEther(initialBalance));

  // Transfer tokens to user1
  const transferAmount = ethers.parseEther("1000");
  await silicaToken.transfer(user1.address, transferAmount);
  
  // Check balances
  const deployerBalance = await silicaToken.balanceOf(deployer.address);
  const user1Balance = await silicaToken.balanceOf(user1.address);
  
  console.log("Deployer balance after transfer:", ethers.formatEther(deployerBalance));
  console.log("User1 balance after transfer:", ethers.formatEther(user1Balance));

  // Test AI minting
  console.log("Testing AI minting...");
  const mintAmount = ethers.parseEther("10000");
  await silicaAIController.mintTokens(user2.address, mintAmount, "Initial AI allocation");
  
  const user2Balance = await silicaToken.balanceOf(user2.address);
  console.log("User2 balance after AI mint:", ethers.formatEther(user2Balance));

  console.log("Test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 