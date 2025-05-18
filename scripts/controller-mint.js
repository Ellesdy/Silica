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
  
  // Try simplified mint function - check if it's compatible
  try {
    console.log("Attempting to mint tokens via controller...");
    const mintAmount = ethers.parseEther("1000");
    
    // Try different parameter combinations based on the contract implementation
    // First attempt: just the amount
    const mintTx = await controller.mintTokens(mintAmount);
    await mintTx.wait();
    console.log("Minting successful with just amount parameter!");
  } catch (error) {
    console.log("First mint attempt failed:", error.message);
    
    try {
      // Second attempt: destination address and amount
      console.log("Trying second mint approach...");
      const mintAmount = ethers.parseEther("1000");
      const mintTx = await controller.mintTokens(deployer.address, mintAmount);
      await mintTx.wait();
      console.log("Minting successful with address and amount parameters!");
    } catch (error) {
      console.log("Second mint attempt failed:", error.message);
      
      try {
        // Third attempt: all three parameters
        console.log("Trying third mint approach...");
        const mintAmount = ethers.parseEther("1000");
        const mintTx = await controller.mintTokens(deployer.address, mintAmount, "Test minting");
        await mintTx.wait();
        console.log("Minting successful with address, amount, and rationale parameters!");
      } catch (error) {
        console.log("Third mint attempt failed:", error.message);
        console.log("Could not determine the correct mint function signature");
      }
    }
  }
  
  // Check balances regardless of success
  try {
    const deployerBalance = await silicaToken.balanceOf(deployer.address);
    console.log(`Admin token balance: ${ethers.formatEther(deployerBalance)} SILICA`);
  } catch (error) {
    console.log("Could not retrieve token balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 