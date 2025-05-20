const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SilicaTreasury", function () {
  let silicaTreasury;
  let mockToken;
  let mockProtocol;
  let owner;
  let governor;
  let aiController;
  let user;
  let users;

  // Constants
  const GOVERNOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNOR_ROLE"));
  const AI_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_CONTROLLER_ROLE"));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000");
  const DEFAULT_WITHDRAWAL_LIMIT = ethers.parseEther("1000");

  beforeEach(async function () {
    // Get signers
    [owner, governor, aiController, user, ...users] = await ethers.getSigners();

    // Deploy mock token for testing funds
    const SilicaToken = await ethers.getContractFactory("SilicaToken");
    mockToken = await SilicaToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy mock protocol for testing investments
    const MockProtocol = await ethers.getContractFactory("MockProtocol");
    mockProtocol = await MockProtocol.deploy();
    await mockProtocol.waitForDeployment();

    // Deploy SilicaTreasury
    const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
    silicaTreasury = await SilicaTreasury.deploy(governor.address);
    await silicaTreasury.waitForDeployment();

    // Setup roles
    await silicaTreasury.connect(governor).setAIController(aiController.address);

    // Mint some tokens to user for deposits
    await mockToken.mint(user.address, INITIAL_TOKEN_SUPPLY);
    await mockToken.connect(user).approve(await silicaTreasury.getAddress(), INITIAL_TOKEN_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the correct governor", async function () {
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, governor.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(DEFAULT_ADMIN_ROLE, governor.address)).to.equal(true);
    });

    it("Should set initial daily withdrawal limit", async function () {
      expect(await silicaTreasury.dailyWithdrawalLimit()).to.equal(DEFAULT_WITHDRAWAL_LIMIT);
    });

    it("Should properly grant roles to the deployer", async function () {
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, owner.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should reject deployment with zero address governor", async function () {
      const SilicaTreasury = await ethers.getContractFactory("SilicaTreasury");
      await expect(SilicaTreasury.deploy(ethers.ZeroAddress)).to.be.revertedWith("Governor cannot be zero address");
    });
  });

  describe("Role Management", function () {
    it("Should allow setting AI controller", async function () {
      const newController = users[0];
      await silicaTreasury.connect(governor).setAIController(newController.address);
      
      expect(await silicaTreasury.hasRole(AI_CONTROLLER_ROLE, newController.address)).to.equal(true);
      expect(await silicaTreasury.hasRole(GOVERNOR_ROLE, newController.address)).to.equal(true);
    });

    it("Should not allow setting zero address as AI controller", async function () {
      await expect(
        silicaTreasury.connect(governor).setAIController(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid controller address");
    });

    it("Should not allow non-admins to set AI controller", async function () {
      await expect(
        silicaTreasury.connect(user).setAIController(users[0].address)
      ).to.be.revertedWith(/AccessControl/);
    });
  });

  describe("Deposit Functionality", function () {
    it("Should allow users to deposit tokens", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      await silicaTreasury.connect(user).depositFunds(await mockToken.getAddress(), depositAmount);
      
      expect(await mockToken.balanceOf(await silicaTreasury.getAddress())).to.equal(depositAmount);
    });

    it("Should emit FundsDeposited event", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      await expect(silicaTreasury.connect(user).depositFunds(await mockToken.getAddress(), depositAmount))
        .to.emit(silicaTreasury, "FundsDeposited")
        .withArgs(await mockToken.getAddress(), user.address, depositAmount);
    });

    it("Should reject deposits with zero address token", async function () {
      await expect(
        silicaTreasury.connect(user).depositFunds(ethers.ZeroAddress, ethers.parseEther("1000"))
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should reject deposits with zero amount", async function () {
      await expect(
        silicaTreasury.connect(user).depositFunds(await mockToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Withdrawal Functionality", function () {
    beforeEach(async function () {
      // Deposit tokens to the treasury
      await silicaTreasury.connect(user).depositFunds(
        await mockToken.getAddress(), 
        ethers.parseEther("10000")
      );
    });

    it("Should allow governor to withdraw tokens", async function () {
      const withdrawAmount = ethers.parseEther("1000");
      const initialBalance = await mockToken.balanceOf(user.address);
      
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount
      );
      
      const newBalance = await mockToken.balanceOf(user.address);
      expect(newBalance).to.equal(initialBalance + withdrawAmount);
    });

    it("Should emit FundsWithdrawn event", async function () {
      const withdrawAmount = ethers.parseEther("1000");
      
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount
      ))
        .to.emit(silicaTreasury, "FundsWithdrawn")
        .withArgs(await mockToken.getAddress(), user.address, withdrawAmount);
    });

    it("Should enforce daily withdrawal limit", async function () {
      const limitExceedingAmount = ethers.parseEther("1001");
      
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        limitExceedingAmount
      )).to.be.revertedWith("Daily withdrawal limit exceeded");
    });

    it("Should allow multiple withdrawals up to the daily limit", async function () {
      const withdrawAmount1 = ethers.parseEther("500");
      const withdrawAmount2 = ethers.parseEther("499.5");
      const tooMuchAmount = ethers.parseEther("1");
      
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount1
      );
      
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount2
      );
      
      // This should fail as it would exceed the daily limit
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        tooMuchAmount
      )).to.be.revertedWith("Daily withdrawal limit exceeded");
      
      // Check the daily withdrawal tracking
      expect(await silicaTreasury.getTodayWithdrawals()).to.equal(withdrawAmount1 + withdrawAmount2);
    });

    it("Should reset daily withdrawal limits after a day passes", async function () {
      const withdrawAmount = ethers.parseEther("800");
      
      // First day withdrawals
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount
      );
      
      // Advance time by 1 day
      await time.increase(86400); // 24 hours
      
      // Second day should allow new withdrawals
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount
      );
      
      // Check today's withdrawal amount
      expect(await silicaTreasury.getTodayWithdrawals()).to.equal(withdrawAmount);
    });

    it("Should not allow non-governors to withdraw tokens", async function () {
      await expect(silicaTreasury.connect(user).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        ethers.parseEther("100")
      )).to.be.revertedWith(/AccessControl/);
    });

    it("Should reject withdrawals with zero address token or recipient", async function () {
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        ethers.ZeroAddress,
        user.address,
        ethers.parseEther("100")
      )).to.be.revertedWith("Invalid token address");
      
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        ethers.ZeroAddress,
        ethers.parseEther("100")
      )).to.be.revertedWith("Invalid recipient address");
    });

    it("Should reject withdrawals with zero amount", async function () {
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        0
      )).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject withdrawals exceeding the balance", async function () {
      const excessiveAmount = ethers.parseEther("20000");
      
      await expect(silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        excessiveAmount
      )).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Asset Management", function () {
    it("Should allow governors to add new assets", async function () {
      await silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "Mock Token",
        "Test"
      );
      
      const asset = await silicaTreasury.assets(await mockToken.getAddress());
      expect(asset.name).to.equal("Mock Token");
      expect(asset.assetType).to.equal("Test");
      expect(asset.isActive).to.equal(true);
      
      const assetList = await silicaTreasury.getAllAssets();
      expect(assetList.length).to.equal(1);
      expect(assetList[0]).to.equal(await mockToken.getAddress());
    });

    it("Should emit AssetAdded event", async function () {
      await expect(silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "Mock Token",
        "Test"
      ))
        .to.emit(silicaTreasury, "AssetAdded")
        .withArgs(await mockToken.getAddress(), "Mock Token", "Test");
    });

    it("Should not allow adding duplicate assets", async function () {
      await silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "Mock Token",
        "Test"
      );
      
      await expect(silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "Different Name",
        "Different Type"
      )).to.be.revertedWith("Asset already exists");
    });

    it("Should not allow non-governors to add assets", async function () {
      await expect(silicaTreasury.connect(user).addAsset(
        await mockToken.getAddress(),
        "Mock Token",
        "Test"
      )).to.be.revertedWith(/AccessControl/);
    });

    it("Should validate asset input parameters", async function () {
      await expect(silicaTreasury.connect(governor).addAsset(
        ethers.ZeroAddress,
        "Mock Token",
        "Test"
      )).to.be.revertedWith("Invalid token address");
      
      await expect(silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "",
        "Test"
      )).to.be.revertedWith("Name cannot be empty");
      
      await expect(silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "Mock Token",
        ""
      )).to.be.revertedWith("Asset type cannot be empty");
    });
  });

  describe("Investment Functionality", function () {
    beforeEach(async function () {
      // Deposit tokens to the treasury
      await silicaTreasury.connect(user).depositFunds(
        await mockToken.getAddress(), 
        ethers.parseEther("10000")
      );
    });

    it("Should allow AI controller to execute investments", async function () {
      const investAmount = ethers.parseEther("1000");
      
      // Create calldata for the mock protocol
      const calldata = mockProtocol.interface.encodeFunctionData("deposit", [
        await mockToken.getAddress(),
        investAmount
      ]);
      
      await silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken.getAddress(),
        investAmount,
        calldata
      );
      
      // Verify tokens were transferred to the protocol
      expect(await mockToken.balanceOf(await mockProtocol.getAddress())).to.equal(investAmount);
    });

    it("Should emit InvestmentExecuted event", async function () {
      const investAmount = ethers.parseEther("1000");
      const calldata = mockProtocol.interface.encodeFunctionData("deposit", [
        await mockToken.getAddress(),
        investAmount
      ]);
      
      await expect(silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken.getAddress(),
        investAmount,
        calldata
      ))
        .to.emit(silicaTreasury, "InvestmentExecuted")
        .withArgs(
          await mockProtocol.getAddress(), 
          await mockToken.getAddress(), 
          investAmount, 
          calldata
        );
    });

    it("Should reset token approval after investment", async function () {
      const investAmount = ethers.parseEther("1000");
      const calldata = mockProtocol.interface.encodeFunctionData("deposit", [
        await mockToken.getAddress(),
        investAmount
      ]);
      
      await silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken.getAddress(),
        investAmount,
        calldata
      );
      
      // Check approval was reset
      expect(await mockToken.allowance(
        await silicaTreasury.getAddress(),
        await mockProtocol.getAddress()
      )).to.equal(0);
    });

    it("Should not allow non-AI controllers to execute investments", async function () {
      const investAmount = ethers.parseEther("1000");
      const calldata = mockProtocol.interface.encodeFunctionData("deposit", [
        await mockToken.getAddress(),
        investAmount
      ]);
      
      await expect(silicaTreasury.connect(user).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken.getAddress(),
        investAmount,
        calldata
      )).to.be.revertedWith(/AccessControl/);
    });

    it("Should validate investment parameters", async function () {
      const investAmount = ethers.parseEther("1000");
      const calldata = mockProtocol.interface.encodeFunctionData("deposit", [
        await mockToken.getAddress(),
        investAmount
      ]);
      
      await expect(silicaTreasury.connect(aiController).executeInvestment(
        ethers.ZeroAddress,
        await mockToken.getAddress(),
        investAmount,
        calldata
      )).to.be.revertedWith("Invalid protocol address");
      
      await expect(silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        ethers.ZeroAddress,
        investAmount,
        calldata
      )).to.be.revertedWith("Invalid token address");
      
      await expect(silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken.getAddress(),
        0,
        calldata
      )).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should validate sufficient balance for investment", async function () {
      const excessiveAmount = ethers.parseEther("20000");
      const calldata = mockProtocol.interface.encodeFunctionData("deposit", [
        await mockToken.getAddress(),
        excessiveAmount
      ]);
      
      await expect(silicaTreasury.connect(aiController).executeInvestment(
        await mockProtocol.getAddress(),
        await mockToken.getAddress(),
        excessiveAmount,
        calldata
      )).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("ETH Handling", function () {
    beforeEach(async function () {
      // Send ETH to the treasury
      await owner.sendTransaction({
        to: await silicaTreasury.getAddress(),
        value: ethers.parseEther("10")
      });
    });

    it("Should receive ETH and emit events", async function () {
      const amount = ethers.parseEther("1");
      
      await expect(user.sendTransaction({
        to: await silicaTreasury.getAddress(),
        value: amount
      }))
        .to.emit(silicaTreasury, "FundsDeposited")
        .withArgs(ethers.ZeroAddress, user.address, amount)
        .and.to.emit(silicaTreasury, "ETHReceived")
        .withArgs(user.address, amount);
    });

    it("Should allow governor to withdraw ETH", async function () {
      const withdrawAmount = ethers.parseEther("1");
      const initialBalance = await ethers.provider.getBalance(user.address);
      
      await silicaTreasury.connect(governor).withdrawETH(
        user.address,
        withdrawAmount
      );
      
      const newBalance = await ethers.provider.getBalance(user.address);
      expect(newBalance).to.be.gt(initialBalance); // Greater than because we don't know the exact gas costs
    });

    it("Should emit FundsWithdrawn event for ETH withdrawals", async function () {
      const withdrawAmount = ethers.parseEther("1");
      
      await expect(silicaTreasury.connect(governor).withdrawETH(
        user.address,
        withdrawAmount
      ))
        .to.emit(silicaTreasury, "FundsWithdrawn")
        .withArgs(ethers.ZeroAddress, user.address, withdrawAmount);
    });

    it("Should enforce daily withdrawal limit for ETH", async function () {
      const limitExceedingAmount = ethers.parseEther("1001");
      
      await expect(silicaTreasury.connect(governor).withdrawETH(
        user.address,
        limitExceedingAmount
      )).to.be.revertedWith("Daily withdrawal limit exceeded");
    });

    it("Should track ETH and token withdrawals within same daily limit", async function () {
      // First withdraw some tokens
      await silicaTreasury.connect(user).depositFunds(
        await mockToken.getAddress(), 
        ethers.parseEther("1000")
      );
      
      const tokenWithdrawAmount = ethers.parseEther("600");
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        tokenWithdrawAmount
      );
      
      // Then try to withdraw ETH exceeding the remaining daily limit
      const ethWithdrawAmount = ethers.parseEther("600");
      await expect(silicaTreasury.connect(governor).withdrawETH(
        user.address,
        ethWithdrawAmount
      )).to.be.revertedWith("Daily withdrawal limit exceeded");
      
      // But a smaller amount should work
      const smallerEthAmount = ethers.parseEther("399");
      await silicaTreasury.connect(governor).withdrawETH(
        user.address,
        smallerEthAmount
      );
      
      // Verify total withdrawals
      expect(await silicaTreasury.getTodayWithdrawals()).to.equal(tokenWithdrawAmount + smallerEthAmount);
    });
  });

  describe("Withdrawal Limit Management", function () {
    it("Should allow admin to update daily withdrawal limit", async function () {
      const newLimit = ethers.parseEther("2000");
      
      await silicaTreasury.connect(governor).setDailyWithdrawalLimit(newLimit);
      
      expect(await silicaTreasury.dailyWithdrawalLimit()).to.equal(newLimit);
    });

    it("Should not allow setting zero withdrawal limit", async function () {
      await expect(silicaTreasury.connect(governor).setDailyWithdrawalLimit(0))
        .to.be.revertedWith("Limit must be greater than 0");
    });

    it("Should not allow non-admins to update withdrawal limit", async function () {
      await expect(silicaTreasury.connect(user).setDailyWithdrawalLimit(ethers.parseEther("2000")))
        .to.be.revertedWith(/AccessControl/);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Add some assets
      await silicaTreasury.connect(governor).addAsset(
        await mockToken.getAddress(),
        "Mock Token",
        "Test"
      );
      
      // Deposit some tokens
      await silicaTreasury.connect(user).depositFunds(
        await mockToken.getAddress(), 
        ethers.parseEther("1000")
      );
    });

    it("Should return correct token balance", async function () {
      const balance = await silicaTreasury.getTokenBalance(await mockToken.getAddress());
      expect(balance).to.equal(ethers.parseEther("1000"));
    });

    it("Should return correct asset list", async function () {
      const assets = await silicaTreasury.getAllAssets();
      expect(assets.length).to.equal(1);
      expect(assets[0]).to.equal(await mockToken.getAddress());
    });

    it("Should return correct daily withdrawals", async function () {
      const withdrawAmount = ethers.parseEther("500");
      
      await silicaTreasury.connect(governor).withdrawFunds(
        await mockToken.getAddress(),
        user.address,
        withdrawAmount
      );
      
      expect(await silicaTreasury.getTodayWithdrawals()).to.equal(withdrawAmount);
    });

    it("Should reject invalid address parameters in view functions", async function () {
      await expect(silicaTreasury.getTokenBalance(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid token address");
    });
  });
}); 