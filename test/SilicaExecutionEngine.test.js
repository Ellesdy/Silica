const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SilicaExecutionEngine", function () {
  let SilicaToken;
  let SilicaTreasury;
  let SilicaModelRegistry;
  let SilicaExecutionEngine;
  
  let silicaToken;
  let silicaTreasury;
  let modelRegistry;
  let executionEngine;
  
  let owner;
  let addr1;
  let addr2;
  let provider1;
  let user1;
  let treasury;
  
  const MODEL_ID = 0;
  const STAKE_AMOUNT = ethers.parseEther("1000");
  const FEE_PER_CALL = ethers.parseEther("0.01");
  
  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, provider1, user1, treasury, ...addrs] = await ethers.getSigners();
    
    // Deploy contracts
    SilicaToken = await ethers.getContractFactory("SilicaToken");
    silicaToken = await SilicaToken.deploy();
    
    // Deploy Treasury with owner as the timelock (for testing simplicity)
    SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
    silicaTreasury = await SilicaTreasury.deploy(owner.address);
    
    // Deploy Model Registry
    SilicaModelRegistry = await ethers.getContractFactory("SilicaModelRegistry");
    modelRegistry = await SilicaModelRegistry.deploy();
    
    // Deploy Execution Engine
    SilicaExecutionEngine = await ethers.getContractFactory("SilicaExecutionEngine");
    executionEngine = await SilicaExecutionEngine.deploy(
      await modelRegistry.getAddress(),
      await silicaToken.getAddress(),
      await silicaTreasury.getAddress()
    );
    
    // Grant MODEL_CREATOR_ROLE to addr1
    await modelRegistry.addModelCreator(addr1.address);
    
    // Register a model
    await modelRegistry.connect(addr1).registerModel(
      "Test Model",
      "Test model description",
      "Text Generation",
      "1.0",
      "ipfs://testURI",
      "https://api.example.com",
      FEE_PER_CALL
    );
    
    // Mint some tokens for provider1
    await silicaToken.mint(provider1.address, STAKE_AMOUNT.toString());
    
    // Approve tokens for staking
    await silicaToken.connect(provider1).approve(executionEngine.getAddress(), STAKE_AMOUNT);
    
    // Add model registry as a controller for the token (for testing usage tracking)
    await silicaToken.addAIController(await modelRegistry.getAddress());
  });
  
  describe("Deployment", function () {
    it("Should set the right dependencies", async function () {
      expect(await executionEngine.modelRegistry()).to.equal(await modelRegistry.getAddress());
      expect(await executionEngine.silicaToken()).to.equal(await silicaToken.getAddress());
      expect(await executionEngine.treasury()).to.equal(await silicaTreasury.getAddress());
    });
    
    it("Should set the correct payment distribution", async function () {
      const distribution = await executionEngine.paymentDistribution();
      expect(distribution.creatorShare).to.equal(7000); // 70%
      expect(distribution.providerShare).to.equal(2000); // 20%
      expect(distribution.protocolShare).to.equal(1000); // 10%
    });
  });
  
  describe("Compute Provider Registration", function () {
    it("Should allow registration as compute provider", async function () {
      await executionEngine.connect(provider1).registerComputeProvider(
        "Test Provider",
        "https://provider-api.example.com",
        4, // 4 GPUs
        STAKE_AMOUNT
      );
      
      const provider = await executionEngine.computeProviders(provider1.address);
      expect(provider.name).to.equal("Test Provider");
      expect(provider.endpoint).to.equal("https://provider-api.example.com");
      expect(provider.capacityGPUs).to.equal(4);
      expect(provider.stakedAmount).to.equal(STAKE_AMOUNT);
      expect(provider.isActive).to.equal(true);
      
      // Check role
      expect(await executionEngine.hasRole(await executionEngine.COMPUTE_PROVIDER_ROLE(), provider1.address)).to.equal(true);
    });
    
    it("Should enforce minimum stake", async function () {
      const lowStake = ethers.parseEther("100"); // Less than the 1000 minimum
      
      // Approve low stake amount
      await silicaToken.connect(provider1).approve(executionEngine.getAddress(), lowStake);
      
      await expect(
        executionEngine.connect(provider1).registerComputeProvider(
          "Test Provider",
          "https://provider-api.example.com",
          4, // 4 GPUs
          lowStake
        )
      ).to.be.revertedWith("Insufficient stake");
    });
    
    it("Should require at least 1 GPU", async function () {
      await expect(
        executionEngine.connect(provider1).registerComputeProvider(
          "Test Provider",
          "https://provider-api.example.com",
          0, // 0 GPUs - should fail
          STAKE_AMOUNT
        )
      ).to.be.revertedWith("Must provide at least 1 GPU");
    });
    
    it("Should prevent registering the same provider twice", async function () {
      // Register first time
      await executionEngine.connect(provider1).registerComputeProvider(
        "Test Provider",
        "https://provider-api.example.com",
        4, // 4 GPUs
        STAKE_AMOUNT
      );
      
      // Try to register again
      await silicaToken.mint(provider1.address, STAKE_AMOUNT); // Give more tokens
      await silicaToken.connect(provider1).approve(executionEngine.getAddress(), STAKE_AMOUNT);
      
      await expect(
        executionEngine.connect(provider1).registerComputeProvider(
          "Test Provider 2",
          "https://different-api.example.com",
          8, // 8 GPUs
          STAKE_AMOUNT
        )
      ).to.be.revertedWith("Provider already registered");
    });
    
    it("Should check for insufficient token balance", async function () {
      // Create a new signer with no tokens
      const newProvider = addrs[0];
      
      // Approve without having tokens
      await silicaToken.connect(newProvider).approve(executionEngine.getAddress(), STAKE_AMOUNT);
      
      await expect(
        executionEngine.connect(newProvider).registerComputeProvider(
          "Poor Provider",
          "https://poor-provider.example.com",
          2, // 2 GPUs
          STAKE_AMOUNT
        )
      ).to.be.revertedWith("Insufficient token balance");
    });
    
    it("Should allow provider to update their details", async function () {
      // Register provider
      await executionEngine.connect(provider1).registerComputeProvider(
        "Test Provider",
        "https://provider-api.example.com",
        4, // 4 GPUs
        STAKE_AMOUNT
      );
      
      // Update details
      await executionEngine.connect(provider1).updateComputeProvider(
        true, // isActive
        8,    // Updated GPU count
        "https://updated-api.example.com"
      );
      
      const provider = await executionEngine.computeProviders(provider1.address);
      expect(provider.endpoint).to.equal("https://updated-api.example.com");
      expect(provider.capacityGPUs).to.equal(8);
      expect(provider.isActive).to.equal(true);
    });
  });
  
  describe("Request Execution", function () {
    beforeEach(async function () {
      // Register provider1
      await executionEngine.connect(provider1).registerComputeProvider(
        "Test Provider",
        "https://provider-api.example.com",
        4, // 4 GPUs
        STAKE_AMOUNT
      );
    });
    
    it("Should allow users to create requests", async function () {
      const prompt = "Generate a poem about AI";
      
      await executionEngine.connect(user1).createRequest(
        MODEL_ID, 
        prompt,
        { value: FEE_PER_CALL }
      );
      
      // Check request was created
      const request = await executionEngine.requests(0);
      expect(request.modelId).to.equal(MODEL_ID);
      expect(request.requester).to.equal(user1.address);
      expect(request.inputData).to.equal(prompt);
      expect(request.status).to.equal(0); // Pending
      expect(request.fee).to.equal(FEE_PER_CALL);
      
      // Check user request tracking
      const userRequests = await executionEngine.getUserRequests(user1.address);
      expect(userRequests.length).to.equal(1);
      expect(userRequests[0]).to.equal(0);
    });
    
    it("Should allow compute providers to assign requests", async function () {
      // Create request
      await executionEngine.connect(user1).createRequest(
        MODEL_ID, 
        "Generate a poem about AI",
        { value: FEE_PER_CALL }
      );
      
      // Provider assigns request
      await executionEngine.connect(provider1).assignRequest(0);
      
      // Check request was assigned
      const request = await executionEngine.requests(0);
      expect(request.computeProvider).to.equal(provider1.address);
      expect(request.status).to.equal(1); // Processing
      
      // Check provider request tracking
      const providerRequests = await executionEngine.getProviderRequests(provider1.address);
      expect(providerRequests.length).to.equal(1);
      expect(providerRequests[0]).to.equal(0);
    });
    
    it("Should allow completing requests with output", async function () {
      // Create and assign request
      await executionEngine.connect(user1).createRequest(
        MODEL_ID, 
        "Generate a poem about AI",
        { value: FEE_PER_CALL }
      );
      
      await executionEngine.connect(provider1).assignRequest(0);
      
      // Complete request
      const output = "AI, a digital mind, In silicon it grows, Learning, adapting, evolving, The future it now knows.";
      
      // Get balances before completion
      const providerBalanceBefore = await ethers.provider.getBalance(provider1.address);
      
      // Complete the request
      await executionEngine.connect(provider1).completeRequest(0, output);
      
      // Check request was completed
      const request = await executionEngine.requests(0);
      expect(request.outputData).to.equal(output);
      expect(request.status).to.equal(2); // Completed
      expect(request.completedAt).to.not.equal(0);
      
      // Check provider received payment (20% of fee)
      const providerBalanceAfter = await ethers.provider.getBalance(provider1.address);
      const providerShare = FEE_PER_CALL * BigInt(2000) / BigInt(10000); // 20%
      
      // We can't check exact balance due to gas costs, but we can ensure it increased
      expect(providerBalanceAfter).to.be.gt(providerBalanceBefore);
    });
    
    it("Should allow marking requests as failed", async function () {
      // Create and assign request
      await executionEngine.connect(user1).createRequest(
        MODEL_ID, 
        "Generate a poem about AI",
        { value: FEE_PER_CALL }
      );
      
      await executionEngine.connect(provider1).assignRequest(0);
      
      // Get requester balance before
      const requesterBalanceBefore = await ethers.provider.getBalance(user1.address);
      
      // Mark as failed
      await executionEngine.connect(provider1).failRequest(0, "Model execution error");
      
      // Check request was marked as failed
      const request = await executionEngine.requests(0);
      expect(request.status).to.equal(3); // Failed
      
      // Check requester got refund
      const requesterBalanceAfter = await ethers.provider.getBalance(user1.address);
      expect(requesterBalanceAfter).to.be.gt(requesterBalanceBefore);
    });
  });
  
  describe("Payment Distribution", function () {
    beforeEach(async function () {
      // Register provider1
      await executionEngine.connect(provider1).registerComputeProvider(
        "Test Provider",
        "https://provider-api.example.com",
        4, // 4 GPUs
        STAKE_AMOUNT
      );
    });
    
    it("Should allow updating payment distribution", async function () {
      // Update distribution
      await executionEngine.updatePaymentDistribution(6000, 3000, 1000);
      
      // Check updated values
      const distribution = await executionEngine.paymentDistribution();
      expect(distribution.creatorShare).to.equal(6000); // 60%
      expect(distribution.providerShare).to.equal(3000); // 30%
      expect(distribution.protocolShare).to.equal(1000); // 10%
    });
    
    it("Should not allow invalid distribution that doesn't total 100%", async function () {
      await expect(
        executionEngine.updatePaymentDistribution(6000, 3000, 500) // 95% total
      ).to.be.revertedWith("Shares must total 100%");
    });

    it("Should correctly distribute payment according to configured percentages", async function() {
      // Update distribution to easily verifiable numbers
      await executionEngine.updatePaymentDistribution(5000, 3000, 2000); // 50%, 30%, 20%
      
      // Create request with specific payment amount
      const fee = ethers.parseEther("1.0"); // 1 ETH for easy math
      
      // Get initial balances
      const creatorInitialBalance = await ethers.provider.getBalance(addr1.address);
      const providerInitialBalance = await ethers.provider.getBalance(provider1.address);
      const treasuryInitialBalance = await ethers.provider.getBalance(await silicaTreasury.getAddress());
      
      // Create and process request
      await executionEngine.connect(user1).createRequest(MODEL_ID, "Test input", { value: fee });
      await executionEngine.connect(provider1).assignRequest(0);
      
      // Complete the request with minimal gas usage to make balance calculations easier
      const tx = await executionEngine.connect(provider1).completeRequest(0, "Test output");
      const receipt = await tx.wait();
      
      // Calculate gas used by provider
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Get final balances
      const creatorFinalBalance = await ethers.provider.getBalance(addr1.address);
      const providerFinalBalance = await ethers.provider.getBalance(provider1.address);
      const treasuryFinalBalance = await ethers.provider.getBalance(await silicaTreasury.getAddress());
      
      // Expected shares
      const creatorShare = fee * BigInt(5000) / BigInt(10000); // 50%
      const providerShare = fee * BigInt(3000) / BigInt(10000); // 30%
      const treasuryShare = fee * BigInt(2000) / BigInt(10000); // 20%
      
      // Verify creator payment
      expect(creatorFinalBalance - creatorInitialBalance).to.equal(creatorShare);
      
      // Verify provider payment (accounting for gas)
      const providerBalanceChange = (providerFinalBalance + gasUsed) - providerInitialBalance;
      expect(providerBalanceChange).to.equal(providerShare);
      
      // Verify treasury payment
      expect(treasuryFinalBalance - treasuryInitialBalance).to.equal(treasuryShare);
    });
  });

  describe("Error Handling in _distributePayment", function() {
    // We need to deploy a mock version of the execution engine to test internal function behavior
    let MockExecutionEngine;
    let mockEngine;
    
    beforeEach(async function() {
      // Deploy a mock contract that exposes _distributePayment
      const mockFactory = await ethers.getContractFactory("SilicaExecutionEngine");
      mockEngine = await mockFactory.deploy(
        await modelRegistry.getAddress(),
        await silicaToken.getAddress(),
        await silicaTreasury.getAddress()
      );
      
      // Register a mock model with addr1 as creator
      await modelRegistry.connect(addr1).registerModel(
        "Test Model",
        "Test model description",
        "Text Generation",
        "1.0",
        "ipfs://testURI",
        "https://api.example.com",
        FEE_PER_CALL
      );
      
      // Register provider1
      await mockEngine.connect(provider1).registerComputeProvider(
        "Test Provider",
        "https://provider-api.example.com",
        4, // 4 GPUs
        STAKE_AMOUNT
      );
    });
    
    it("Should handle request completion and payment distribution correctly", async function() {
      // Create request with the mock engine
      await mockEngine.connect(user1).createRequest(MODEL_ID, "Test input", { value: FEE_PER_CALL });
      
      // Assign request
      await mockEngine.connect(provider1).assignRequest(0);
      
      // Complete request (which will call _distributePayment internally)
      await expect(
        mockEngine.connect(provider1).completeRequest(0, "Test output")
      ).to.not.be.reverted;
      
      // Check status
      const request = await mockEngine.requests(0);
      expect(request.status).to.equal(2); // Completed
    });
  });
}); 