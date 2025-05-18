const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const deploymentInfo = require("../deployments/hardhat-latest.json");
  const silicaTokenAddress = deploymentInfo.contracts.SilicaToken;
  const controllerAddress = deploymentInfo.contracts.SilicaAIController;
  
  // Connect to contracts
  const SilicaAIController = await ethers.getContractFactory("SilicaAIController");
  const controller = await SilicaAIController.attach(controllerAddress);
  
  // The MetaMask wallet address you want to fund
  // REPLACE THIS WITH YOUR ACTUAL METAMASK ADDRESS
  const metamaskAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Funding from account:", deployer.address);
  
  // Fund MetaMask wallet with ETH
  console.log(`Funding MetaMask wallet ${metamaskAddress} with ETH...`);
  const ethAmount = ethers.parseEther("5.0"); // 5 ETH
  
  const txEth = await deployer.sendTransaction({
    to: metamaskAddress,
    value: ethAmount
  });
  await txEth.wait();
  console.log(`Sent ${ethers.formatEther(ethAmount)} ETH to ${metamaskAddress}`);

  // Mint tokens to the MetaMask wallet via the controller
  console.log(`Minting Silica tokens to MetaMask wallet ${metamaskAddress}...`);
  const mintAmount = ethers.parseEther("1000"); // 1000 tokens
  
  // Using the correct function signature discovered in previous test
  const mintTx = await controller.mintTokens(
    metamaskAddress,
    mintAmount,
    "Funding MetaMask wallet"
  );
  await mintTx.wait();
  console.log(`Minted ${ethers.formatEther(mintAmount)} SILICA tokens to ${metamaskAddress}`);
  
  console.log("MetaMask wallet funding completed successfully!");
  console.log("You can now access these funds in MetaMask by:");
  console.log("1. Connecting to the Hardhat network (localhost:8545, ChainID: 31337)");
  console.log(`2. Add the Silica token contract (${silicaTokenAddress}) as a custom token`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 