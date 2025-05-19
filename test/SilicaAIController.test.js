const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SilicaAIController", function () {
  let silicaToken;
  let silicaTreasury;
  let silicaAIController;
  let mockDex;
  let mockToken;
  let owner;
  let aiOperator;
  let humanAdmin;
  let user;
  let users;

  // Constants
  const AI_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_OPERATOR_ROLE"));
  const HUMAN_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("HUMAN_ADMIN_ROLE"));
  const INITIAL_MINT = ethers.parseEther("1000000"); // 1 million tokens
  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    // Get signers
    [owner, aiOperator, humanAdmin, user, ...users] = await ethers.getSigners();

    // Deploy SilicaToken
    const SilicaToken = await ethers.getContractFactory("SilicaToken");
    silicaToken = await SilicaToken.deploy();
    await silicaToken.waitForDeployment();

    // Deploy SilicaTreasury
    const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
    silicaTreasury = await SilicaTreasury.deploy(owner.address);
    await silicaTreasury.waitForDeployment();

    // Deploy SilicaAIController
    const SilicaAIController = await ethers.getContractFactory("SilicaAIController");
    silicaAIController = await SilicaAIController.deploy(
      await silicaToken.getAddress(),
      await silicaTreasury.getAddress()
    );
    await silicaAIController.waitForDeployment();

    // Deploy a mock token for testing trades
    const MockToken = await ethers.getContractFactory("SilicaToken"); // Reusing SilicaToken as a mock
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy a mock DEX
    const MockDex = await ethers.getContractFactory("MockDex");
    mockDex = await MockDex.deploy();
    await mockDex.waitForDeployment();

    // Setup permissions
    await silicaToken.transferOwnership(await silicaAIController.getAddress());
    await silicaTreasury.grantRole(ethers.keccak256(ethers.toUtf8Bytes("GOVERNOR_ROLE")), await silicaAIController.getAddress());
    await silicaAIController.addAIOperator(aiOperator.address);
    await silicaAIController.grantRole(HUMAN_ADMIN_ROLE, humanAdmin.address);

    // Fund the treasury with some tokens for testing
    await silicaToken.mint(await silicaTreasury.getAddress(), INITIAL_MINT);
    await mockToken.mint(await silicaTreasury.getAddress(), INITIAL_MINT);
  });

  describe("Deployment", function () {
    it("Should set the correct token and treasury addresses", async function () {
      expect(await silicaAIController.silicaToken()).to.equal(await silicaToken.getAddress());
      expect(await silicaAIController.treasury()).to.equal(await silicaTreasury.getAddress());
    });

    it("Should set the correct roles", async function () {
      expect(await silicaAIController.hasRole(ethers.ZeroHash, owner.address)).to.equal(true);
      expect(await silicaAIController.hasRole(HUMAN_ADMIN_ROLE, owner.address)).to.equal(true);
      expect(await silicaAIController.hasRole(AI_OPERATOR_ROLE, owner.address)).to.equal(true);
      expect(await silicaAIController.hasRole(AI_OPERATOR_ROLE, aiOperator.address)).to.equal(true);
      expect(await silicaAIController.hasRole(HUMAN_ADMIN_ROLE, humanAdmin.address)).to.equal(true);
    });

    it("Should initialize state variables correctly", async function () {
      expect(await silicaAIController.lastDecisionTimestamp()).to.equal(0);
      expect(await silicaAIController.decisionCount()).to.equal(0);
      expect(await silicaAIController.buyThreshold()).to.equal(0);
      expect(await silicaAIController.sellThreshold()).to.equal(ethers.MaxUint256);
      expect(await silicaAIController.maxTradePercentage()).to.equal(10);
    });
  });

  describe("Role Management", function () {
    it("Should allow adding AI operators", async function () {
      const newOperator = users[0];
      await silicaAIController.connect(humanAdmin).addAIOperator(newOperator.address);
      expect(await silicaAIController.hasRole(AI_OPERATOR_ROLE, newOperator.address)).to.equal(true);
    });

    it("Should allow removing AI operators", async function () {
      await silicaAIController.connect(humanAdmin).removeAIOperator(aiOperator.address);
      expect(await silicaAIController.hasRole(AI_OPERATOR_ROLE, aiOperator.address)).to.equal(false);
    });

    it("Should prevent non-admins from adding operators", async function () {
      const newOperator = users[0];
      await expect(silicaAIController.connect(user).addAIOperator(newOperator.address))
        .to.be.revertedWithCustomError(silicaAIController, "AccessControlUnauthorizedAccount");
    });

    it("Should prevent non-admins from removing operators", async function () {
      await expect(silicaAIController.connect(user).removeAIOperator(aiOperator.address))
        .to.be.revertedWithCustomError(silicaAIController, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Token Minting", function () {
    it("Should allow AI operator to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const recipient = user.address;
      await silicaAIController.connect(aiOperator).mintTokens(recipient, mintAmount, "Strategic distribution");
      expect(await silicaToken.balanceOf(recipient)).to.equal(mintAmount);
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      const recipient = user.address;
      await expect(silicaAIController.connect(aiOperator).mintTokens(recipient, mintAmount, "Strategic distribution"))
        .to.emit(silicaAIController, "TokensMinted")
        .withArgs(recipient, mintAmount, "Strategic distribution");
    });

    it("Should prevent non-operator from minting tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const recipient = user.address;
      await expect(silicaAIController.connect(user).mintTokens(recipient, mintAmount, "Unauthorized minting"))
        .to.be.revertedWithCustomError(silicaAIController, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Token Burning", function () {
    it("Should allow AI operator to burn tokens from treasury", async function () {
      const burnAmount = ethers.parseEther("10000");
      const initialTreasuryBalance = await silicaToken.balanceOf(await silicaTreasury.getAddress());
      
      await silicaAIController.connect(aiOperator).burnTokensFromTreasury(burnAmount, "Reducing supply");
      
      const newTreasuryBalance = await silicaToken.balanceOf(await silicaTreasury.getAddress());
      expect(newTreasuryBalance).to.equal(initialTreasuryBalance - burnAmount);
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseEther("10000");
      
      await expect(silicaAIController.connect(aiOperator).burnTokensFromTreasury(burnAmount, "Reducing supply"))
        .to.emit(silicaAIController, "TokensBurned")
        .withArgs(await silicaAIController.getAddress(), burnAmount, "Reducing supply");
    });

    it("Should prevent non-operator from burning tokens", async function () {
      const burnAmount = ethers.parseEther("10000");
      
      await expect(silicaAIController.connect(user).burnTokensFromTreasury(burnAmount, "Unauthorized burning"))
        .to.be.revertedWithCustomError(silicaAIController, "AccessControlUnauthorizedAccount");
    });

    it("Should fail if treasury doesn't have enough tokens", async function () {
      const burnAmount = ethers.parseEther("2000000"); // More than the initial mint
      
      await expect(silicaAIController.connect(aiOperator).burnTokensFromTreasury(burnAmount, "Too much"))
        .to.be.reverted; // The exact error message depends on the SilicaTreasury implementation
    });
  });

  describe("Threshold Updates", function () {
    it("Should allow AI operator to update thresholds", async function () {
      await silicaAIController.connect(aiOperator).updateThresholds(
        ethers.parseEther("100"), // buyThreshold
        ethers.parseEther("150"), // sellThreshold
        20 // maxTradePercentage
      );
      
      expect(await silicaAIController.buyThreshold()).to.equal(ethers.parseEther("100"));
      expect(await silicaAIController.sellThreshold()).to.equal(ethers.parseEther("150"));
      expect(await silicaAIController.maxTradePercentage()).to.equal(20);
    });

    it("Should emit ThresholdsUpdated event", async function () {
      await expect(silicaAIController.connect(aiOperator).updateThresholds(
        ethers.parseEther("100"),
        ethers.parseEther("150"),
        20
      )).to.emit(silicaAIController, "ThresholdsUpdated")
        .withArgs(ethers.parseEther("100"), ethers.parseEther("150"), 20);
    });

    it("Should prevent setting maxTradePercentage > 100", async function () {
      await expect(silicaAIController.connect(aiOperator).updateThresholds(
        ethers.parseEther("100"),
        ethers.parseEther("150"),
        101
      )).to.be.revertedWith("Percentage must be <= 100");
    });

    it("Should prevent non-operator from updating thresholds", async function () {
      await expect(silicaAIController.connect(user).updateThresholds(
        ethers.parseEther("100"),
        ethers.parseEther("150"),
        20
      )).to.be.revertedWithCustomError(silicaAIController, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Decision Execution", function () {
    it("Should allow AI operator to execute a decision", async function () {
      const mintAmount = ethers.parseEther("1000");
      const recipient = user.address;
      
      // Create the execution data for minting tokens
      const mintFunction = silicaAIController.interface.encodeFunctionData("mintTokens", [
        recipient, mintAmount, "Test decision"
      ]);
      
      // Execute the decision
      await silicaAIController.connect(aiOperator).executeDecision(
        "MINT",
        "Strategic token distribution",
        mintFunction
      );
      
      // Verify the mint occurred
      expect(await silicaToken.balanceOf(recipient)).to.equal(mintAmount);
      
      // Verify decision was recorded
      expect(await silicaAIController.decisionCount()).to.equal(1);
      
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(await silicaAIController.lastDecisionTimestamp()).to.be.closeTo(
        latestBlock.timestamp, 
        5 // Allow a small margin for execution time
      );
      
      // Check the recorded decision
      const [timestamp, decisionType, rationale] = await silicaAIController.decisions(0);
      expect(timestamp).to.be.closeTo(latestBlock.timestamp, 5);
      expect(decisionType).to.equal("MINT");
      expect(rationale).to.equal("Strategic token distribution");
    });

    it("Should emit DecisionExecuted event", async function () {
      const mintFunction = silicaAIController.interface.encodeFunctionData("mintTokens", [
        user.address, ethers.parseEther("1000"), "Test event"
      ]);
      
      await expect(silicaAIController.connect(aiOperator).executeDecision(
        "MINT",
        "Testing events",
        mintFunction
      )).to.emit(silicaAIController, "DecisionExecuted")
        .withArgs(0, "MINT", "Testing events");
    });

    it("Should prevent non-operator from executing decisions", async function () {
      const mintFunction = silicaAIController.interface.encodeFunctionData("mintTokens", [
        user.address, ethers.parseEther("1000"), "Unauthorized"
      ]);
      
      await expect(silicaAIController.connect(user).executeDecision(
        "MINT",
        "Unauthorized attempt",
        mintFunction
      )).to.be.revertedWithCustomError(silicaAIController, "AccessControlUnauthorizedAccount");
    });

    it("Should revert if execution fails", async function () {
      // Create execution data that will fail (burning more tokens than available)
      const burnFunction = silicaAIController.interface.encodeFunctionData("burnTokensFromTreasury", [
        ethers.parseEther("2000000"), // More than the initial mint
        "Will fail"
      ]);
      
      await expect(silicaAIController.connect(aiOperator).executeDecision(
        "BURN",
        "This should fail",
        burnFunction
      )).to.be.revertedWith("Decision execution failed");
    });
  });

  describe("Decision Retrieval", function () {
    beforeEach(async function () {
      // Create several decisions for testing retrieval
      for (let i = 0; i < 5; i++) {
        const mintFunction = silicaAIController.interface.encodeFunctionData("mintTokens", [
          user.address, ethers.parseEther("100"), `Decision ${i}`
        ]);
        
        await silicaAIController.connect(aiOperator).executeDecision(
          `MINT_${i}`,
          `Rationale ${i}`,
          mintFunction
        );
      }
    });

    it("Should allow retrieving decisions within a valid range", async function () {
      const decisions = await silicaAIController.getDecisions(1, 4);
      expect(decisions.length).to.equal(3); // end is exclusive
      
      expect(decisions[0].decisionType).to.equal("MINT_1");
      expect(decisions[1].decisionType).to.equal("MINT_2");
      expect(decisions[2].decisionType).to.equal("MINT_3");
      
      expect(decisions[0].rationale).to.equal("Rationale 1");
      expect(decisions[1].rationale).to.equal("Rationale 2");
      expect(decisions[2].rationale).to.equal("Rationale 3");
    });

    it("Should revert when retrieving with invalid range", async function () {
      await expect(silicaAIController.getDecisions(3, 6))
        .to.be.revertedWith("Invalid range");
      
      await expect(silicaAIController.getDecisions(4, 2))
        .to.be.revertedWith("Invalid range");
    });
  });

  // Helper contract for testing trade execution
  after(async function() {
    const MockDexFactory = await ethers.getContractFactory("MockDex");
    const code = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.28;
      
      import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
      import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
      
      contract MockDex {
          using SafeERC20 for IERC20;
          
          function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external payable returns (uint256) {
              // Simple swap implementation for testing
              uint256 amountOut = amountIn * 2; // Simple 2x return rate
              
              if (tokenIn != address(0)) {
                  // Transfer tokenIn from msg.sender to this contract
                  IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
              } else {
                  // Ensure enough ETH was sent
                  require(msg.value >= amountIn, "Insufficient ETH sent");
              }
              
              if (tokenOut != address(0)) {
                  // Transfer tokenOut to msg.sender
                  IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
              } else {
                  // Send ETH to msg.sender
                  payable(msg.sender).transfer(amountOut);
              }
              
              return amountOut;
          }
          
          // To receive ETH
          receive() external payable {}
      }
    `;
    
    // This will properly create the helper contract
    await MockDexFactory.deploy();
  });
}); 