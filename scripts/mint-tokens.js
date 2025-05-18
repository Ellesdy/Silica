const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const deploymentInfo = require("../deployments/hardhat-latest.json");
  const silicaTokenAddress = deploymentInfo.contracts.SilicaToken;
  
  // Connect to contracts
  const SilicaToken = await ethers.getContractFactory("SilicaToken");
  const silicaToken = await SilicaToken.attach(silicaTokenAddress);
  
  // Get signers (default hardhat accounts)
  const [deployer, testWallet] = await ethers.getSigners();
  
  console.log("Admin account:", deployer.address);
  console.log("Test wallet:", testWallet.address);
  
  // Check current token balance
  let adminBalance = await silicaToken.balanceOf(deployer.address);
  let testBalance = await silicaToken.balanceOf(testWallet.address);
  
  console.log("Initial token balances:");
  console.log(`Admin: ${ethers.formatEther(adminBalance)} SILICA`);
  console.log(`Test wallet: ${ethers.formatEther(testBalance)} SILICA`);
  
  // Mint tokens to test wallet
  console.log("Minting tokens to test wallet...");
  const mintAmount = ethers.parseEther("1000"); // 1000 tokens
  
  // Direct mint using deployer (who has AI_CONTROLLER_ROLE)
  const mintTx = await silicaToken.aiMint(testWallet.address, mintAmount);
  await mintTx.wait();
  console.log(`Minted ${ethers.formatEther(mintAmount)} SILICA tokens to ${testWallet.address}`);
  
  // Check updated token balances
  adminBalance = await silicaToken.balanceOf(deployer.address);
  testBalance = await silicaToken.balanceOf(testWallet.address);
  
  console.log("Updated token balances:");
  console.log(`Admin: ${ethers.formatEther(adminBalance)} SILICA`);
  console.log(`Test wallet: ${ethers.formatEther(testBalance)} SILICA`);
  
  // Transfer tokens from test wallet to admin (to test transfer)
  console.log("Testing token transfer...");
  const transferAmount = ethers.parseEther("100"); // 100 tokens
  
  // Connect to token contract as test wallet
  const silicaTokenAsTestWallet = silicaToken.connect(testWallet);
  const transferTx = await silicaTokenAsTestWallet.transfer(deployer.address, transferAmount);
  await transferTx.wait();
  console.log(`Transferred ${ethers.formatEther(transferAmount)} SILICA from test wallet to admin`);
  
  // Final token balances
  adminBalance = await silicaToken.balanceOf(deployer.address);
  testBalance = await silicaToken.balanceOf(testWallet.address);
  
  console.log("Final token balances:");
  console.log(`Admin: ${ethers.formatEther(adminBalance)} SILICA`);
  console.log(`Test wallet: ${ethers.formatEther(testBalance)} SILICA`);
  
  console.log("Token minting and transfer tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 