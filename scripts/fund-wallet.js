const { ethers } = require("hardhat");

async function main() {
  // Get signers (default hardhat accounts)
  const [deployer, testWallet] = await ethers.getSigners();
  
  console.log("Admin account:", deployer.address);
  console.log("Test wallet:", testWallet.address);
  
  // Show initial balances
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  const testWalletBalance = await ethers.provider.getBalance(testWallet.address);
  
  console.log("Initial balances:");
  console.log(`Admin: ${ethers.formatEther(deployerBalance)} ETH`);
  console.log(`Test wallet: ${ethers.formatEther(testWalletBalance)} ETH`);
  
  // Fund test wallet with ETH
  console.log("Funding test wallet with ETH...");
  const ethAmount = ethers.parseEther("10.0"); // 10 ETH
  const txEth = await deployer.sendTransaction({
    to: testWallet.address,
    value: ethAmount
  });
  await txEth.wait();
  console.log(`Sent ${ethers.formatEther(ethAmount)} ETH to ${testWallet.address}`);

  // Check updated balances
  const newDeployerBalance = await ethers.provider.getBalance(deployer.address);
  const newTestWalletBalance = await ethers.provider.getBalance(testWallet.address);
  
  console.log("Updated balances:");
  console.log(`Admin: ${ethers.formatEther(newDeployerBalance)} ETH`);
  console.log(`Test wallet: ${ethers.formatEther(newTestWalletBalance)} ETH`);
  
  console.log("Wallet funding completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 