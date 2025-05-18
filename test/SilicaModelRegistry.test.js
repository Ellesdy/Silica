const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SilicaModelRegistry", function () {
  let SilicaModelRegistry;
  let modelRegistry;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy SilicaModelRegistry
    SilicaModelRegistry = await ethers.getContractFactory("SilicaModelRegistry");
    modelRegistry = await SilicaModelRegistry.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await modelRegistry.hasRole(await modelRegistry.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should set the deployer as MODEL_CREATOR_ROLE", async function () {
      expect(await modelRegistry.hasRole(await modelRegistry.MODEL_CREATOR_ROLE(), owner.address)).to.equal(true);
    });
  });

  describe("Permissions", function () {
    it("Should allow adding a model creator", async function () {
      await modelRegistry.addModelCreator(addr1.address);
      expect(await modelRegistry.hasRole(await modelRegistry.MODEL_CREATOR_ROLE(), addr1.address)).to.equal(true);
    });

    it("Should allow removing a model creator", async function () {
      await modelRegistry.addModelCreator(addr1.address);
      await modelRegistry.removeModelCreator(addr1.address);
      expect(await modelRegistry.hasRole(await modelRegistry.MODEL_CREATOR_ROLE(), addr1.address)).to.equal(false);
    });

    it("Should not allow non-admins to add or remove creators", async function () {
      await expect(
        modelRegistry.connect(addr1).addModelCreator(addr2.address)
      ).to.be.reverted;

      await expect(
        modelRegistry.connect(addr1).removeModelCreator(owner.address)
      ).to.be.reverted;
    });
  });

  describe("Model Registration", function () {
    beforeEach(async function () {
      await modelRegistry.addModelCreator(addr1.address);
    });

    it("Should allow a model creator to register a model", async function () {
      await modelRegistry.connect(addr1).registerModel(
        "Test Model",
        "Test model description",
        "Text Generation",
        "1.0",
        "ipfs://testURI",
        "https://api.example.com",
        ethers.parseEther("0.01")
      );

      const modelCount = await modelRegistry.getModelCount();
      expect(modelCount).to.equal(1);

      const model = await modelRegistry.getModel(0);
      expect(model.name).to.equal("Test Model");
      expect(model.creator).to.equal(addr1.address);
      expect(model.modelType).to.equal("Text Generation");
      expect(model.isActive).to.equal(true);
    });

    it("Should not allow duplicate model names", async function () {
      await modelRegistry.registerModel(
        "Unique Model",
        "Description",
        "Text Generation",
        "1.0",
        "ipfs://testURI",
        "https://api.example.com",
        ethers.parseEther("0.01")
      );

      await expect(
        modelRegistry.registerModel(
          "Unique Model",
          "Different description",
          "Image Generation",
          "1.0",
          "ipfs://differentURI",
          "https://different-api.com",
          ethers.parseEther("0.02")
        )
      ).to.be.revertedWith("Model name already exists");
    });

    it("Should track models by creator", async function () {
      // Register two models from addr1
      await modelRegistry.connect(addr1).registerModel(
        "Model 1",
        "Description 1",
        "Text Generation",
        "1.0",
        "ipfs://testURI1",
        "https://api1.example.com",
        ethers.parseEther("0.01")
      );
      
      await modelRegistry.connect(addr1).registerModel(
        "Model 2",
        "Description 2",
        "Image Generation",
        "1.0",
        "ipfs://testURI2",
        "https://api2.example.com",
        ethers.parseEther("0.02")
      );
      
      // Register one model from owner
      await modelRegistry.registerModel(
        "Model 3",
        "Description 3",
        "Text Classification",
        "1.0",
        "ipfs://testURI3",
        "https://api3.example.com",
        ethers.parseEther("0.005")
      );
      
      // Check models by addr1
      const addr1Models = await modelRegistry.getModelsByCreator(addr1.address);
      expect(addr1Models.length).to.equal(2);
      expect(addr1Models[0]).to.equal(0);
      expect(addr1Models[1]).to.equal(1);
      
      // Check models by owner
      const ownerModels = await modelRegistry.getModelsByCreator(owner.address);
      expect(ownerModels.length).to.equal(1);
      expect(ownerModels[0]).to.equal(2);
    });
  });

  describe("Model Updates", function () {
    beforeEach(async function () {
      // Register a model
      await modelRegistry.registerModel(
        "Original Model",
        "Original description",
        "Text Generation",
        "1.0",
        "ipfs://originalURI",
        "https://original-api.com",
        ethers.parseEther("0.01")
      );
    });

    it("Should allow model creator to update model details", async function () {
      await modelRegistry.updateModel(
        0,
        "2.0",
        "ipfs://updatedURI",
        "https://updated-api.com"
      );
      
      const model = await modelRegistry.getModel(0);
      expect(model.version).to.equal("2.0");
      expect(model.storageURI).to.equal("ipfs://updatedURI");
      expect(model.apiEndpoint).to.equal("https://updated-api.com");
    });

    it("Should not allow non-creator to update model", async function () {
      await expect(
        modelRegistry.connect(addr1).updateModel(
          0,
          "2.0",
          "ipfs://hackedURI",
          "https://hacked-api.com"
        )
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow updating model fee", async function () {
      const newFee = ethers.parseEther("0.05");
      await modelRegistry.updateModelFee(0, newFee);
      
      const model = await modelRegistry.getModel(0);
      expect(model.feePerCall).to.equal(newFee);
    });

    it("Should allow toggling model active status", async function () {
      // Initially active
      let model = await modelRegistry.getModel(0);
      expect(model.isActive).to.equal(true);
      
      // Deactivate
      await modelRegistry.setModelStatus(0, false);
      model = await modelRegistry.getModel(0);
      expect(model.isActive).to.equal(false);
      
      // Reactivate
      await modelRegistry.setModelStatus(0, true);
      model = await modelRegistry.getModel(0);
      expect(model.isActive).to.equal(true);
    });
  });

  describe("Usage Tracking", function () {
    beforeEach(async function () {
      // Register a model
      await modelRegistry.registerModel(
        "Usage Model",
        "Model for usage tracking",
        "Text Generation",
        "1.0",
        "ipfs://usageURI",
        "https://usage-api.com",
        ethers.parseEther("0.01")
      );
    });

    it("Should track model usage", async function () {
      // Record usage
      await modelRegistry.recordModelUsage(0, addr1.address, ethers.ZeroAddress);
      await modelRegistry.recordModelUsage(0, addr2.address, ethers.ZeroAddress);
      
      // Check model usage count
      const model = await modelRegistry.getModel(0);
      expect(model.usageCount).to.equal(2);
    });

    it("Should not allow recording usage for non-existent models", async function () {
      await expect(
        modelRegistry.recordModelUsage(999, addr1.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Model does not exist");
    });

    it("Should not allow recording usage for inactive models", async function () {
      // Deactivate model
      await modelRegistry.setModelStatus(0, false);
      
      // Try to record usage
      await expect(
        modelRegistry.recordModelUsage(0, addr1.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Model is not active");
    });
  });
}); 