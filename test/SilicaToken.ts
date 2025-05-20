import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SilicaToken", function () {
  let silicaToken: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let aiController: SignerWithAddress;
  let user: SignerWithAddress;
  let addrs: SignerWithAddress[];

  // Constants
  const INITIAL_SUPPLY = ethers.parseEther("100000000"); // 100 million
  const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 billion
  const AI_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_CONTROLLER_ROLE"));

  beforeEach(async function () {
    // Get the signers
    [owner, addr1, addr2, aiController, user, ...addrs] = await ethers.getSigners();

    // Deploy the token
    const SilicaToken = await ethers.getContractFactory("SilicaToken");
    silicaToken = await SilicaToken.deploy();
    // Wait for deployment to be mined
    await silicaToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await silicaToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await silicaToken.balanceOf(owner.address);
      expect(await silicaToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await silicaToken.name()).to.equal("Silica");
      expect(await silicaToken.symbol()).to.equal("SIL");
    });

    it("Should have 18 decimals", async function () {
      expect(await silicaToken.decimals()).to.equal(18);
    });

    it("Should set the initial supply correctly", async function () {
      expect(await silicaToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the maximum supply correctly", async function () {
      expect(await silicaToken.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should set the owner as the default AI controller", async function () {
      expect(await silicaToken.hasRole(AI_CONTROLLER_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await silicaToken.transfer(addr1.address, 50);
      const addr1Balance = await silicaToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      await silicaToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await silicaToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await silicaToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner
      await expect(
        silicaToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed
      expect(await silicaToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Governance features", function () {
    it("Should allow delegation of voting power", async function () {
      // Initially no delegation
      expect(await silicaToken.delegates(owner.address)).to.equal(ethers.ZeroAddress);
      
      // Delegate voting power to self
      await silicaToken.delegate(owner.address);
      
      // Check delegation worked
      expect(await silicaToken.delegates(owner.address)).to.equal(owner.address);
      
      // Check voting power equals token balance
      const ownerBalance = await silicaToken.balanceOf(owner.address);
      const votingPower = await silicaToken.getVotes(owner.address);
      expect(votingPower).to.equal(ownerBalance);
    });

    it("Should transfer voting power when tokens are transferred after delegation", async function () {
      // Owner delegates to self
      await silicaToken.delegate(owner.address);
      
      // Check initial voting power
      const initialVotingPower = await silicaToken.getVotes(owner.address);
      
      // Transfer tokens to addr1
      const transferAmount = ethers.parseEther("1000");
      await silicaToken.transfer(addr1.address, transferAmount);
      
      // Check owner's voting power decreased
      const newVotingPower = await silicaToken.getVotes(owner.address);
      expect(newVotingPower).to.equal(initialVotingPower - transferAmount);
      
      // Addr1 delegates to self
      await silicaToken.connect(addr1).delegate(addr1.address);
      
      // Check addr1 got voting power
      expect(await silicaToken.getVotes(addr1.address)).to.equal(transferAmount);
    });
  });

  describe("AI Controller Role", function () {
    beforeEach(async function () {
      // Add aiController as an AI controller
      await silicaToken.addAIController(aiController.address);
    });
    
    it("Should allow owner to add an AI controller", async function () {
      expect(await silicaToken.hasRole(AI_CONTROLLER_ROLE, aiController.address)).to.equal(true);
    });
    
    it("Should allow owner to remove an AI controller", async function () {
      await silicaToken.removeAIController(aiController.address);
      expect(await silicaToken.hasRole(AI_CONTROLLER_ROLE, aiController.address)).to.equal(false);
    });
    
    it("Should not allow non-owners to add AI controllers", async function () {
      await expect(
        silicaToken.connect(addr1).addAIController(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should not allow non-owners to remove AI controllers", async function () {
      await expect(
        silicaToken.connect(addr1).removeAIController(aiController.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await silicaToken.totalSupply();
      const initialBalance = await silicaToken.balanceOf(addr1.address);
      
      await silicaToken.mint(addr1.address, mintAmount);
      
      expect(await silicaToken.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await silicaToken.balanceOf(addr1.address)).to.equal(initialBalance + mintAmount);
    });
    
    it("Should allow AI controller to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await silicaToken.totalSupply();
      const initialBalance = await silicaToken.balanceOf(addr1.address);
      
      await silicaToken.connect(aiController).aiMint(addr1.address, mintAmount);
      
      expect(await silicaToken.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await silicaToken.balanceOf(addr1.address)).to.equal(initialBalance + mintAmount);
    });
    
    it("Should not allow exceeding max supply when minting", async function () {
      const nearMaxAmount = MAX_SUPPLY - INITIAL_SUPPLY; // Calculate remaining available supply
      const exceedAmount = nearMaxAmount + ethers.parseEther("1"); // Slightly more than available
      
      // This should work
      await silicaToken.mint(addr1.address, nearMaxAmount);
      
      // This should fail
      await expect(
        silicaToken.mint(addr1.address, ethers.parseEther("1"))
      ).to.be.revertedWith("Exceeds max supply");
    });
    
    it("Should not allow non-owners to mint tokens", async function () {
      await expect(
        silicaToken.connect(addr1).mint(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should not allow non-AI controllers to use aiMint", async function () {
      await expect(
        silicaToken.connect(addr1).aiMint(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Give some tokens to addr1
      await silicaToken.transfer(addr1.address, ethers.parseEther("10000"));
    });
    
    it("Should allow AI controller to burn tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await silicaToken.totalSupply();
      const initialBalance = await silicaToken.balanceOf(addr1.address);
      
      // Approve tokens for burning
      await silicaToken.connect(addr1).approve(silicaToken.getAddress(), burnAmount);
      
      // Burn tokens
      await silicaToken.connect(aiController).aiBurn(addr1.address, burnAmount);
      
      expect(await silicaToken.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await silicaToken.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
    });
    
    it("Should not allow non-AI controllers to burn tokens", async function () {
      // Approve tokens for burning
      await silicaToken.connect(addr1).approve(silicaToken.getAddress(), ethers.parseEther("1000"));
      
      // Try to burn tokens
      await expect(
        silicaToken.connect(addr2).aiBurn(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Max Supply", function () {
    it("Should allow AI controller to change max supply", async function () {
      const newMaxSupply = ethers.parseEther("2000000000"); // 2 billion
      
      await silicaToken.connect(aiController).setMaxSupply(newMaxSupply);
      
      expect(await silicaToken.maxSupply()).to.equal(newMaxSupply);
    });
    
    it("Should not allow setting max supply below current total", async function () {
      const belowCurrentSupply = ethers.parseEther("50000000"); // 50 million
      
      await expect(
        silicaToken.connect(aiController).setMaxSupply(belowCurrentSupply)
      ).to.be.revertedWith("New max supply below current total");
    });
    
    it("Should not allow non-AI controllers to change max supply", async function () {
      await expect(
        silicaToken.connect(addr1).setMaxSupply(ethers.parseEther("2000000000"))
      ).to.be.revertedWith("AccessControl: account");
    });
  });
}); 