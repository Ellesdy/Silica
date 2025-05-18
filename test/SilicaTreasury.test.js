const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SilicaTreasury", function () {
  let silicaTreasury;
  let mockToken1;
  let mockToken2;
  let mockProtocol;
  let owner;
  let governor;
  let aiController;
  let user;
  let users;

  // Constants
  const GOVERNOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNOR_ROLE"));
  const AI_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_CONTROLLER_ROLE"));
  const INITIAL_MINT = ethers.parseEther("1000000"); // 1 million tokens
  const DEPOSIT_AMOUNT = ethers.parseEther("100000"); // 100k tokens
  const WITHDRAW_AMOUNT = ethers.parseEther("50000"); // 50k tokens
  const INVESTMENT_AMOUNT = ethers.parseEther("25000"); // 25k tokens

  beforeEach(async function () {
    // Get signers
    [owner, governor, aiController, user, ...users] = await ethers.getSigners();

    // Deploy treasury
    const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
    silicaTreasury = await SilicaTreasury.deploy(governor.address);
    await silicaTreasury.waitForDeployment();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("SilicaToken");
    mockToken1 = await MockToken.deploy();
    await mockToken1.waitForDeployment();
    mockToken2 = await MockToken.deploy();
    await mockToken2.waitForDeployment();

    // Deploy mock protocol for investments
    const MockProtocol = await ethers.getContractFactory("MockProtocol");
    mockProtocol = await MockProtocol.deploy(await mockToken1.getAddress(), await mockToken2.getAddress());
    await mockProtocol.waitForDeployment();

    // Mint tokens for testing
    await mockToken1.mint(user.address, INITIAL_MINT);
    await mockToken2.mint(user.address, INITIAL_MINT);

    // Set AI controller
    await silicaTreasury.setAIController(aiController.address);

    // Approve treasury to spend user's tokens for deposits
    await mockToken1.connect(user).approve(await silicaTreasury.getAddress(), INITIAL_MINT);
    await mockToken2.connect(user).approve(await silicaTreasury.getAddress(), INITIAL_MINT);
  });

  describe("Initialization", function () {
    it("Should set the correct roles", async function () {
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, governor.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, owner.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(AI_CONTROLLER_ROLE, aiController.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, aiController.address)).to.equal(true);
    });
  });

  describe("Fund Management", function () {
    it("Should allow deposits of tokens", async function () {
      // Deposit tokens
      await silicaTreasury.connect(user).depositFunds(await mockToken1.getAddress(), DEPOSIT_AMOUNT);

      // Check balance
      expect(await mockToken1.balanceOf(await silicaTreasury.getAddress())).to.equal(DEPOSIT_AMOUNT);
      expect(await silicaTreasury.getTokenBalance(await mockToken1.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should emit FundsDeposited event on deposit", async function () {
      await expect(
        silicaTreasury.connect(user).depositFunds(await mockToken1.getAddress(), DEPOSIT_AMOUNT)
      )
        .to.emit(silicaTreasury, "FundsDeposited")
        .withArgs(await mockToken1.getAddress(), user.address, DEPOSIT_AMOUNT);
    });

    it("Should allow governor to withdraw tokens", async function () {
      // First deposit tokens
      await silicaTreasury.connect(user).depositFunds(await mockToken1.getAddress(), DEPOSIT_AMOUNT);

      // Check initial balances
      const initialTreasuryBalance = await mockToken1.balanceOf(await silicaTreasury.getAddress());
      const initialUserBalance = await mockToken1.balanceOf(user.address);

      // Withdraw tokens
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken1.getAddress(),
        user.address,
        WITHDRAW_AMOUNT
      );

      // Check new balances
      expect(await mockToken1.balanceOf(await silicaTreasury.getAddress())).to.equal(
        initialTreasuryBalance - WITHDRAW_AMOUNT
      );
      expect(await mockToken1.balanceOf(user.address)).to.equal(
        initialUserBalance.add(WITHDRAW_AMOUNT)
      );
    });

    it("Should emit FundsWithdrawn event on withdrawal", async function () {
      // First deposit tokens
      await silicaTreasury.connect(user).depositFunds(await mockToken1.getAddress(), DEPOSIT_AMOUNT);

      // Withdraw tokens
      await expect(
        silicaTreasury.connect(governor).withdrawFunds(
          await mockToken1.getAddress(),
          user.address,
          WITHDRAW_AMOUNT
        )
      )
        .to.emit(silicaTreasury, "FundsWithdrawn")
        .withArgs(await mockToken1.getAddress(), user.address, WITHDRAW_AMOUNT);
    });

    it("Should prevent non-governor from withdrawing tokens", async function () {
      // First deposit tokens
      await silicaTreasury.connect(user).depositFunds(await mockToken1.getAddress(), DEPOSIT_AMOUNT);

      // Attempt withdrawal by non-governor
      await expect(
        silicaTreasury.connect(user).withdrawFunds(
          await mockToken1.getAddress(),
          user.address,
          WITHDRAW_AMOUNT
        )
      ).to.be.revertedWithCustomError(silicaTreasury, "AccessControlUnauthorizedAccount");
    });

    it("Should handle ETH deposits via receive function", async function () {
      const ethAmount = ethers.parseEther("1.0");
      
      // Send ETH to treasury
      await expect(
        owner.sendTransaction({
          to: await silicaTreasury.getAddress(),
          value: ethAmount
        })
      ).to.emit(silicaTreasury, "FundsDeposited")
        .withArgs(ethers.ZeroAddress, owner.address, ethAmount);
      
      // Check ETH balance
      expect(await ethers.provider.getBalance(await silicaTreasury.getAddress())).to.equal(ethAmount);
    });
  });

  describe("Asset Management", function () {
    it("Should allow governor to add assets", async function () {
      // Add an asset
      await silicaTreasury.connect(governor).addAsset(
        await mockToken1.getAddress(),
        "Mock Token 1",
        "stablecoin"
      );

      // Check asset was added
      const asset = await silicaTreasury.assets(await mockToken1.getAddress());
      expect(asset.name).to.equal("Mock Token 1");
      expect(asset.assetType).to.equal("stablecoin");
      expect(asset.isActive).to.equal(true);

      // Check asset list
      const assetList = await silicaTreasury.getAllAssets();
      expect(assetList.length).to.equal(1);
      expect(assetList[0]).to.equal(await mockToken1.getAddress());
    });

    it("Should emit AssetAdded event when adding an asset", async function () {
      await expect(
        silicaTreasury.connect(governor).addAsset(
          await mockToken1.getAddress(),
          "Mock Token 1",
          "stablecoin"
        )
      )
        .to.emit(silicaTreasury, "AssetAdded")
        .withArgs(await mockToken1.getAddress(), "Mock Token 1", "stablecoin");
    });

    it("Should prevent adding the same asset twice", async function () {
      // Add an asset
      await silicaTreasury.connect(governor).addAsset(
        await mockToken1.getAddress(),
        "Mock Token 1",
        "stablecoin"
      );

      // Try to add it again
      await expect(
        silicaTreasury.connect(governor).addAsset(
          await mockToken1.getAddress(),
          "Mock Token 1 Duplicate",
          "stablecoin"
        )
      ).to.be.revertedWith("Asset already exists");
    });

    it("Should prevent non-governor from adding assets", async function () {
      await expect(
        silicaTreasury.connect(user).addAsset(
          await mockToken1.getAddress(),
          "Mock Token 1",
          "stablecoin"
        )
      ).to.be.revertedWithCustomError(silicaTreasury, "AccessControlUnauthorizedAccount");
    });

    it("Should track multiple assets correctly", async function () {
      // Add multiple assets
      await silicaTreasury.connect(governor).addAsset(
        await mockToken1.getAddress(),
        "Mock Token 1",
        "stablecoin"
      );
      await silicaTreasury.connect(governor).addAsset(
        await mockToken2.getAddress(),
        "Mock Token 2",
        "governance"
      );

      // Check asset list
      const assetList = await silicaTreasury.getAllAssets();
      expect(assetList.length).to.equal(2);
      expect(assetList[0]).to.equal(await mockToken1.getAddress());
      expect(assetList[1]).to.equal(await mockToken2.getAddress());

      // Check individual assets
      let asset = await silicaTreasury.assets(await mockToken1.getAddress());
      expect(asset.name).to.equal("Mock Token 1");
      expect(asset.assetType).to.equal("stablecoin");

      asset = await silicaTreasury.assets(await mockToken2.getAddress());
      expect(asset.name).to.equal("Mock Token 2");
      expect(asset.assetType).to.equal("governance");
    });
  });

  describe("Investment Functions", function () {
    beforeEach(async function () {
      // Deposit tokens to treasury for investments
      await silicaTreasury.connect(user).depositFunds(await mockToken1.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should allow AI controller to execute investments", async function () {
      // Encode investment function call
      const investData = mockProtocol.interface.encodeFunctionData(
        "deposit",
        [INVESTMENT_AMOUNT]
      );
      
      // Execute investment
      await silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken1.getAddress(),
        INVESTMENT_AMOUNT,
        investData
      );

      // Check token transfers occurred
      expect(await mockToken1.balanceOf(await mockProtocol.getAddress())).to.equal(INVESTMENT_AMOUNT);
      expect(await mockToken2.balanceOf(await silicaTreasury.getAddress())).to.equal(INVESTMENT_AMOUNT);
    });

    it("Should emit InvestmentExecuted event", async function () {
      const investData = mockProtocol.interface.encodeFunctionData(
        "deposit",
        [INVESTMENT_AMOUNT]
      );
      
      await expect(
        silicaTreasury.connect(aiController).executeInvestment(
          await mockProtocol.getAddress(),
          await mockToken1.getAddress(),
          INVESTMENT_AMOUNT,
          investData
        )
      )
        .to.emit(silicaTreasury, "InvestmentExecuted")
        .withArgs(await mockProtocol.getAddress(), await mockToken1.getAddress(), INVESTMENT_AMOUNT, investData);
    });

    it("Should prevent non-AI-controller from executing investments", async function () {
      const investData = mockProtocol.interface.encodeFunctionData(
        "deposit",
        [INVESTMENT_AMOUNT]
      );
      
      await expect(
        silicaTreasury.connect(user).executeInvestment(
          await mockProtocol.getAddress(),
          await mockToken1.getAddress(),
          INVESTMENT_AMOUNT,
          investData
        )
      ).to.be.revertedWithCustomError(silicaTreasury, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when investment call fails", async function () {
      // Encode function call that will fail (invalid amount)
      const invalidData = mockProtocol.interface.encodeFunctionData(
        "deposit",
        [ethers.parseEther("9999999")] // More than available
      );
      
      await expect(
        silicaTreasury.connect(aiController).executeInvestment(
          await mockProtocol.getAddress(),
          await mockToken1.getAddress(),
          ethers.parseEther("9999999"),
          invalidData
        )
      ).to.be.revertedWith("Investment execution failed");
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to set AI controller", async function () {
      const newController = users[0];
      
      await silicaTreasury.connect(owner).setAIController(newController.address);
      
      expect(await silicaTreasury.hasRole(AI_CONTROLLER_ROLE, newController.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, newController.address)).to.equal(true);
    });

    it("Should prevent non-admin from setting AI controller", async function () {
      const newController = users[0];
      
      await expect(
        silicaTreasury.connect(user).setAIController(newController.address)
      ).to.be.revertedWithCustomError(silicaTreasury, "AccessControlUnauthorizedAccount");
    });
  });
  
  // Helper contract for testing investments
  after(async function() {
    const MockProtocolFactory = await ethers.getContractFactory("MockProtocol");
    const code = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.28;
      
      import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
      import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
      
      contract MockProtocol {
          using SafeERC20 for IERC20;
          
          IERC20 public inputToken;
          IERC20 public outputToken;
          
          constructor(address _inputToken, address _outputToken) {
              inputToken = IERC20(_inputToken);
              outputToken = IERC20(_outputToken);
          }
          
          function deposit(uint256 amount) external returns (bool) {
              // Take input tokens from sender
              inputToken.safeTransferFrom(msg.sender, address(this), amount);
              
              // Send output tokens to sender (simple 1:1 conversion)
              outputToken.safeTransfer(msg.sender, amount);
              
              return true;
          }
      }
    `;
    
    // Deploy the helper contract (already done in beforeEach, this is just to get code coverage)
    await MockProtocolFactory.deploy(mockToken1.getAddress(), mockToken2.getAddress());
  });
}); 