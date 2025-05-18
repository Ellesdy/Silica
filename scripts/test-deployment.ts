import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Define interfaces for the contracts
interface SilicaToken {
  name(): Promise<string>;
  symbol(): Promise<string>;
  totalSupply(): Promise<bigint>;
  balanceOf(address: string): Promise<bigint>;
}

interface SilicaModelRegistry {
  registerModel(
    name: string,
    description: string,
    modelType: string,
    version: string,
    storageURI: string,
    apiEndpoint: string,
    feePerCall: bigint
  ): Promise<any>;
  getModelCount(): Promise<bigint>;
  getModel(modelId: number): Promise<any>;
}

interface SilicaExecutionEngine {
  createRequest(modelId: number, inputData: string, options: any): Promise<any>;
  assignRequest(requestId: number): Promise<any>;
  completeRequest(requestId: number, outputData: string): Promise<any>;
  registerComputeProvider(
    name: string,
    endpoint: string,
    capacityGPUs: number,
    stakeAmount: bigint
  ): Promise<any>;
}

async function main() {
  // Get network
  const network = process.env.HARDHAT_NETWORK || "sepolia";
  console.log(`Testing deployment on ${network}...`);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-latest.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found at ${deploymentPath}`);
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deployment.contracts;
  
  // Get signers
  const [deployer, user1, provider1] = await ethers.getSigners();
  console.log(`Using deployer account: ${deployer.address}`);
  
  // Connect to deployed contracts
  console.log("\n1. Connecting to contracts...");
  
  const token = await ethers.getContractAt("SilicaToken", contracts.SilicaToken) as unknown as SilicaToken;
  console.log("- Connected to SilicaToken");
  
  const modelRegistry = await ethers.getContractAt("SilicaModelRegistry", contracts.SilicaModelRegistry) as unknown as SilicaModelRegistry;
  console.log("- Connected to SilicaModelRegistry");
  
  const executionEngine = await ethers.getContractAt("SilicaExecutionEngine", contracts.SilicaExecutionEngine) as unknown as SilicaExecutionEngine;
  console.log("- Connected to SilicaExecutionEngine");
  
  // 2. Test SilicaToken
  console.log("\n2. Testing SilicaToken...");
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const deployerBalance = await token.balanceOf(deployer.address);
  
  console.log(`- Token Name: ${tokenName}`);
  console.log(`- Token Symbol: ${tokenSymbol}`);
  console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} SIL`);
  console.log(`- Deployer Balance: ${ethers.formatEther(deployerBalance)} SIL`);
  
  // 3. Register an AI Model
  console.log("\n3. Registering a new AI model...");
  try {
    const modelName = "Test LLM Model";
    const modelDesc = "A test language model for the Silica platform";
    const modelType = "Text Generation";
    const modelVersion = "1.0.0";
    const modelURI = "ipfs://QmTest123456789";
    const modelAPI = "https://api.example.com/model/test";
    const modelFee = ethers.parseEther("0.01"); // 0.01 ETH per use
    
    const tx = await modelRegistry.registerModel(
      modelName,
      modelDesc,
      modelType,
      modelVersion,
      modelURI,
      modelAPI,
      modelFee
    );
    
    await tx.wait();
    
    const modelCount = await modelRegistry.getModelCount();
    console.log(`- Model registered successfully! Model ID: ${Number(modelCount) - 1}`);
    
    // Get and display model details
    const model = await modelRegistry.getModel(Number(modelCount) - 1);
    console.log(`- Model name: ${model.name}`);
    console.log(`- Model fee: ${ethers.formatEther(model.feePerCall)} ETH`);
  } catch (error: any) {
    console.error(`Failed to register model: ${error.message}`);
  }
  
  // 4. Test Compute Provider Registration
  console.log("\n4. Register a compute provider (skipped on testnets)");
  console.log("- Compute provider registration requires staking tokens");
  console.log("- For testnet, this can be tested manually through the frontend");
  
  // 5. Test Creating a Request
  console.log("\n5. Create an inference request (skipped on testnets)");
  console.log("- Creating a request requires paying the model fee");
  console.log("- For testnet, this can be tested manually through the frontend");
  
  console.log("\nDeployment test completed!");
  console.log("For complete testing including token transfers and payment functions,");
  console.log("please use the frontend interface to test the full user flow.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test error:", error);
    process.exit(1);
  }); 