const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const deploymentInfo = require("../deployments/hardhat-latest.json");
  const silicaTokenAddress = deploymentInfo.contracts.SilicaToken;
  const controllerAddress = deploymentInfo.contracts.SilicaAIController;
  
  // Connect to contracts
  const SilicaToken = await ethers.getContractFactory("SilicaToken");
  const silicaToken = await SilicaToken.attach(silicaTokenAddress);
  
  const SilicaAIController = await ethers.getContractFactory("SilicaAIController");
  const controller = await SilicaAIController.attach(controllerAddress);
  
  // Get signers (default hardhat accounts)
  const [deployer, testWallet] = await ethers.getSigners();
  
  console.log("Admin account:", deployer.address);
  console.log("Test wallet:", testWallet.address);
  
  // Fund test wallet with ETH
  console.log("Funding test wallet with ETH...");
  const ethAmount = ethers.parseEther("10.0"); // 10 ETH
  const txEth = await deployer.sendTransaction({
    to: testWallet.address,
    value: ethAmount
  });
  await txEth.wait();
  console.log(`Sent ${ethers.formatEther(ethAmount)} ETH to ${testWallet.address}`);

  // Check balances before
  console.log("Checking token balances...");
  const initialBalance = await silicaToken.balanceOf(deployer.address);
  console.log(`Admin token balance: ${ethers.formatEther(initialBalance)} SILICA`);
  
  // Mint tokens via AI Controller
  console.log("Minting tokens via AIController...");
  const mintAmount = ethers.parseEther("1000"); // 1000 tokens
  const mintTx = await controller.mintTokens(
    deployer.address,  // to address
    mintAmount,        // amount to mint
    "Initial test minting" // rationale
  );
  await mintTx.wait();
  console.log(`Minted ${ethers.formatEther(mintAmount)} SILICA tokens`);
  
  // Get new balance and transfer tokens to test wallet
  const newDeployerBalance = await silicaToken.balanceOf(deployer.address);
  console.log(`Admin new token balance: ${ethers.formatEther(newDeployerBalance)} SILICA`);
  
  // Transfer tokens to test wallet
  console.log("Transferring tokens to test wallet...");
  const transferAmount = ethers.parseEther("500"); // 500 tokens
  const transferTx = await silicaToken.transfer(testWallet.address, transferAmount);
  await transferTx.wait();
  console.log(`Transferred ${ethers.formatEther(transferAmount)} SILICA to ${testWallet.address}`);
  
  // Check final balances
  const finalDeployerBalance = await silicaToken.balanceOf(deployer.address);
  const testWalletBalance = await silicaToken.balanceOf(testWallet.address);
  console.log("Final balances:");
  console.log(`Admin: ${ethers.formatEther(finalDeployerBalance)} SILICA`);
  console.log(`Test wallet: ${ethers.formatEther(testWalletBalance)} SILICA`);
  
  console.log("Test transactions completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 