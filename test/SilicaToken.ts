import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SilicaToken", function () {
  let silicaToken: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    // Get the signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

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
  });
}); 