const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const deploymentInfo = require("../deployments/hardhat-latest.json");
  const modelRegistryAddress = deploymentInfo.contracts.SilicaModelRegistry;
  const executionEngineAddress = deploymentInfo.contracts.SilicaExecutionEngine;
  
  // Connect to contracts
  const SilicaModelRegistry = await ethers.getContractFactory("SilicaModelRegistry");
  const modelRegistry = await SilicaModelRegistry.attach(modelRegistryAddress);
  
  const SilicaExecutionEngine = await ethers.getContractFactory("SilicaExecutionEngine");
  const executionEngine = await SilicaExecutionEngine.attach(executionEngineAddress);
  
  // Get signers (default hardhat accounts)
  const [deployer, testWallet] = await ethers.getSigners();
  
  console.log("Admin account:", deployer.address);
  console.log("Test wallet:", testWallet.address);
  
  // Register a new AI model
  console.log("Registering a new AI model...");
  
  const modelName = "GPT-5 Text Generator";
  const modelDescription = "Next-generation language model for text generation";
  const modelType = "text-generation";
  const modelVersion = "1.0.0";
  const storageURI = "ipfs://QmXvZ8YZszEjsD9JLWbYh4LbVZR5sfFcwe7bYDbBD4rKvi";
  const apiEndpoint = "https://api.silica.ai/models/gpt5";
  const feePerCall = ethers.parseEther("0.01"); // 0.01 SILICA per call
  
  // Check if the deployer has MODEL_CREATOR_ROLE
  const MODEL_CREATOR_ROLE = await modelRegistry.MODEL_CREATOR_ROLE();
  const hasRole = await modelRegistry.hasRole(MODEL_CREATOR_ROLE, deployer.address);
  console.log(`Admin has MODEL_CREATOR_ROLE: ${hasRole}`);
  
  // Register the model
  console.log("Registering model...");
  const registerTx = await modelRegistry.registerModel(
    modelName,
    modelDescription,
    modelType,
    modelVersion,
    storageURI,
    apiEndpoint,
    feePerCall
  );
  
  const receipt = await registerTx.wait();
  console.log("Model registered successfully!");
  
  // Get the model ID from events
  const modelRegisteredEvent = receipt.logs
    .filter(log => log.fragment && log.fragment.name === 'ModelRegistered')
    .map(log => modelRegistry.interface.parseLog(log))[0];
  
  const modelId = modelRegisteredEvent ? modelRegisteredEvent.args.modelId : 0;
  console.log(`Model registered with ID: ${modelId}`);
  
  // Grant MODEL_CREATOR_ROLE to test wallet
  console.log("Granting MODEL_CREATOR_ROLE to test wallet...");
  const grantRoleTx = await modelRegistry.addModelCreator(testWallet.address);
  await grantRoleTx.wait();
  console.log(`Granted MODEL_CREATOR_ROLE to ${testWallet.address}`);
  
  // Use the model registry as test wallet
  console.log("Switching to test wallet...");
  const modelRegistryAsTestWallet = modelRegistry.connect(testWallet);
  
  // Register another model with test wallet
  console.log("Registering another model with test wallet...");
  const testModelName = "DALL-E 3 Image Generator";
  const testModelTx = await modelRegistryAsTestWallet.registerModel(
    testModelName,
    "Advanced image generation model",
    "image-generation",
    "3.0.0",
    "ipfs://QmVZ8JsEGpTtLPVbDZEFa5WuWYQg2tWZM1XfZ6JjHtUmQ5",
    "https://api.silica.ai/models/dalle3",
    ethers.parseEther("0.05")
  );
  
  const testReceipt = await testModelTx.wait();
  console.log("Second model registered successfully!");
  
  // Get all models
  const modelCount = await modelRegistry.getModelCount();
  console.log(`Total models registered: ${modelCount}`);
  
  // Get model info for first model
  const model = await modelRegistry.getModel(modelId);
  console.log("First model details:");
  console.log(`- Name: ${model.name}`);
  console.log(`- Type: ${model.modelType}`);
  console.log(`- Creator: ${model.creator}`);
  console.log(`- Fee per call: ${ethers.formatEther(model.feePerCall)} SILICA`);
  
  console.log("Model registration tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 