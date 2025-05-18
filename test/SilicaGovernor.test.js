const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SilicaGovernor", function () {
  // Contract instances
  let silicaToken;
  let silicaTimelock;
  let silicaGovernor;
  
  // Test signers
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let voter3;
  let executor;
  let recipient;
  let users;
  
  // Governance parameters
  const VOTING_DELAY = 1; // 1 block
  const VOTING_PERIOD = 50; // 50 blocks ~= 10 minutes @ 12 sec per block
  const QUORUM_PERCENTAGE = 4; // 4% of total supply
  const MIN_TIMELOCK_DELAY = 3600; // 1 hour in seconds
  
  // Test proposal
  let proposalId;
  const PROPOSAL_DESCRIPTION = "Test Proposal: Send 100 tokens to recipient";
  const TRANSFER_AMOUNT = ethers.parseEther("100");
  
  // Setup before each test
  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter1, voter2, voter3, executor, recipient, ...users] = await ethers.getSigners();
    
    // Deploy token with governance capabilities
    const SilicaToken = await ethers.getContractFactory("SilicaToken");
    silicaToken = await SilicaToken.deploy();
    await silicaToken.waitForDeployment();
    
    // Distribute tokens to voters
    await silicaToken.mint(owner.address, ethers.parseEther("1000000")); // 1M tokens
    await silicaToken.transfer(voter1.address, ethers.parseEther("100000")); // 100k tokens (10%)
    await silicaToken.transfer(voter2.address, ethers.parseEther("200000")); // 200k tokens (20%)
    await silicaToken.transfer(voter3.address, ethers.parseEther("50000")); // 50k tokens (5%)
    
    // Delegate voting power
    await silicaToken.connect(owner).delegate(owner.address);
    await silicaToken.connect(voter1).delegate(voter1.address);
    await silicaToken.connect(voter2).delegate(voter2.address);
    await silicaToken.connect(voter3).delegate(voter3.address);
    
    // Deploy timelock
    const SilicaTimelock = await ethers.getContractFactory("SilicaTimelock");
    silicaTimelock = await SilicaTimelock.deploy(
      MIN_TIMELOCK_DELAY,
      [], // No proposers yet (governor will be added later)
      [] // No executors yet (will add executor role later)
    );
    await silicaTimelock.waitForDeployment();
    
    // Deploy governance contract
    const SilicaGovernor = await ethers.getContractFactory("SilicaGovernor");
    silicaGovernor = await SilicaGovernor.deploy(
      await silicaToken.getAddress(),
      await silicaTimelock.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      QUORUM_PERCENTAGE
    );
    await silicaGovernor.waitForDeployment();
    
    // Setup timelock roles
    const PROPOSER_ROLE = await silicaTimelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await silicaTimelock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await silicaTimelock.CANCELLER_ROLE();
    const TIMELOCK_ADMIN_ROLE = await silicaTimelock.TIMELOCK_ADMIN_ROLE();
    
    await silicaTimelock.grantRole(PROPOSER_ROLE, await silicaGovernor.getAddress());
    await silicaTimelock.grantRole(CANCELLER_ROLE, await silicaGovernor.getAddress());
    await silicaTimelock.grantRole(EXECUTOR_ROLE, executor.address);
    
    // Revoke admin role from deployer to ensure decentralized governance
    await silicaTimelock.revokeRole(TIMELOCK_ADMIN_ROLE, owner.address);
    
    // Transfer token ownership to timelock
    await silicaToken.transferOwnership(await silicaTimelock.getAddress());
  });

  describe("Initial Setup", function () {
    it("Should have correct governance configuration", async function () {
      expect(await silicaGovernor.votingDelay()).to.equal(VOTING_DELAY);
      expect(await silicaGovernor.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await silicaGovernor.name()).to.equal("SilicaGovernor");
      
      // Check token
      expect(await silicaGovernor.token()).to.equal(await silicaToken.getAddress());
      
      // Check timelock
      expect(await silicaGovernor.timelock()).to.equal(await silicaTimelock.getAddress());
      
      // Check quorum
      const blockNumber = await ethers.provider.getBlockNumber();
      const expectedQuorum = ethers.parseEther("1000000").mul(QUORUM_PERCENTAGE).div(100);
      expect(await silicaGovernor.quorum(blockNumber - 1)).to.equal(expectedQuorum);
    });
    
    it("Should verify roles in timelock", async function () {
      const PROPOSER_ROLE = await silicaTimelock.PROPOSER_ROLE();
      const EXECUTOR_ROLE = await silicaTimelock.EXECUTOR_ROLE();
      const TIMELOCK_ADMIN_ROLE = await silicaTimelock.TIMELOCK_ADMIN_ROLE();
      
      expect(await silicaTimelock.hasRole(PROPOSER_ROLE, await silicaGovernor.getAddress())).to.be.true;
      expect(await silicaTimelock.hasRole(EXECUTOR_ROLE, executor.address)).to.be.true;
      expect(await silicaTimelock.hasRole(TIMELOCK_ADMIN_ROLE, owner.address)).to.be.false;
    });
    
    it("Should confirm token ownership transfer to timelock", async function () {
      expect(await silicaToken.owner()).to.equal(await silicaTimelock.getAddress());
    });
  });

  describe("Proposal Lifecycle", function () {
    beforeEach(async function () {
      // Create a proposal to transfer tokens to recipient
      const transferCalldata = silicaToken.interface.encodeFunctionData(
        "mint", [recipient.address, TRANSFER_AMOUNT]
      );
      
      const proposeTx = await silicaGovernor.connect(proposer).propose(
        [await silicaToken.getAddress()],
        [0], // No ETH being sent
        [transferCalldata],
        PROPOSAL_DESCRIPTION
      );
      
      const proposalReceipt = await proposeTx.wait();
      const event = proposalReceipt.logs.find(
        (x) => x.fragment && x.fragment.name === "ProposalCreated"
      );
      proposalId = event.args.proposalId;
      
      // Advance past voting delay
      await mine(VOTING_DELAY + 1);
    });
    
    it("Should create a proposal with correct parameters", async function () {
      const proposal = await silicaGovernor.proposalSnapshot(proposalId);
      const deadline = await silicaGovernor.proposalDeadline(proposalId);
      const state = await silicaGovernor.state(proposalId);
      
      expect(proposal).to.be.gt(0); // Snapshot block number
      expect(deadline).to.be.gt(proposal); // Deadline block number
      expect(deadline - proposal).to.equal(VOTING_PERIOD);
      expect(state).to.equal(1); // Active
    });
    
    it("Should allow voting on proposal", async function () {
      // Cast votes
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // For
      await silicaGovernor.connect(voter2).castVote(proposalId, 0); // Against
      await silicaGovernor.connect(voter3).castVote(proposalId, 1); // For
      
      const proposalVotes = await silicaGovernor.proposalVotes(proposalId);
      expect(proposalVotes.againstVotes).to.equal(ethers.parseEther("200000")); // 200k tokens
      expect(proposalVotes.forVotes).to.equal(ethers.parseEther("150000")); // 150k tokens (100k + 50k)
      expect(proposalVotes.abstainVotes).to.equal(0);
    });
    
    it("Should not allow double voting", async function () {
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // For
      await expect(
        silicaGovernor.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWith("GovernorVotingSimple: vote already cast");
    });
    
    it("Should not allow voting after deadline", async function () {
      // Skip to end of voting period
      await mine(VOTING_PERIOD + 1);
      
      await expect(
        silicaGovernor.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWith("Governor: vote not currently active");
    });
    
    it("Should transition through correct states in governance lifecycle", async function () {
      // Initial state should be Active
      expect(await silicaGovernor.state(proposalId)).to.equal(1); // Active
      
      // Cast enough votes to pass
      await silicaGovernor.connect(owner).castVote(proposalId, 1); // 650k for
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // 100k for
      
      // Skip to end of voting period
      await mine(VOTING_PERIOD + 1);
      
      // State should be Succeeded
      expect(await silicaGovernor.state(proposalId)).to.equal(4); // Succeeded
      
      // Queue the proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await silicaGovernor.queue(
        [await silicaToken.getAddress()],
        [0],
        [silicaToken.interface.encodeFunctionData("mint", [recipient.address, TRANSFER_AMOUNT])],
        descriptionHash
      );
      
      // State should be Queued
      expect(await silicaGovernor.state(proposalId)).to.equal(5); // Queued
      
      // Fast-forward past timelock
      await time.increase(MIN_TIMELOCK_DELAY + 1);
      
      // Execute the proposal
      await silicaGovernor.execute(
        [await silicaToken.getAddress()],
        [0],
        [silicaToken.interface.encodeFunctionData("mint", [recipient.address, TRANSFER_AMOUNT])],
        descriptionHash
      );
      
      // State should be Executed
      expect(await silicaGovernor.state(proposalId)).to.equal(7); // Executed
      
      // Verify the action occurred
      expect(await silicaToken.balanceOf(recipient.address)).to.equal(TRANSFER_AMOUNT);
    });
    
    it("Should allow cancelling proposal by proposer", async function () {
      // Check initial state
      expect(await silicaGovernor.state(proposalId)).to.equal(1); // Active
      
      // Cancel proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await silicaGovernor.connect(proposer).cancel(
        [await silicaToken.getAddress()],
        [0],
        [silicaToken.interface.encodeFunctionData("mint", [recipient.address, TRANSFER_AMOUNT])],
        descriptionHash
      );
      
      // State should be Canceled
      expect(await silicaGovernor.state(proposalId)).to.equal(2); // Canceled
    });
    
    it("Should fail when quorum not reached", async function () {
      // Cast not enough votes (only 5% when quorum is 4% but needs majority of votes cast)
      await silicaGovernor.connect(voter3).castVote(proposalId, 1); // 50k tokens (5%)
      
      // Cast against votes
      await silicaGovernor.connect(voter2).castVote(proposalId, 0); // 200k tokens (20%)
      
      // Skip to end of voting period
      await mine(VOTING_PERIOD + 1);
      
      // State should be Defeated
      expect(await silicaGovernor.state(proposalId)).to.equal(3); // Defeated
      
      // Attempt to queue should fail
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await expect(
        silicaGovernor.queue(
          [await silicaToken.getAddress()],
          [0],
          [silicaToken.interface.encodeFunctionData("mint", [recipient.address, TRANSFER_AMOUNT])],
          descriptionHash
        )
      ).to.be.revertedWith("Governor: proposal not successful");
    });
  });
  
  describe("Governance Security Features", function () {
    it("Should not allow execution before timelock delay", async function () {
      // Create and pass a proposal
      const transferCalldata = silicaToken.interface.encodeFunctionData(
        "mint", [recipient.address, TRANSFER_AMOUNT]
      );
      
      const proposeTx = await silicaGovernor.connect(proposer).propose(
        [await silicaToken.getAddress()],
        [0],
        [transferCalldata],
        PROPOSAL_DESCRIPTION
      );
      
      const proposalReceipt = await proposeTx.wait();
      const event = proposalReceipt.logs.find(
        (x) => x.fragment && x.fragment.name === "ProposalCreated"
      );
      const newProposalId = event.args.proposalId;
      
      // Advance past voting delay
      await mine(VOTING_DELAY + 1);
      
      // Vote and pass
      await silicaGovernor.connect(owner).castVote(newProposalId, 1);
      
      // Skip to end of voting period
      await mine(VOTING_PERIOD + 1);
      
      // Queue the proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await silicaGovernor.queue(
        [await silicaToken.getAddress()],
        [0],
        [transferCalldata],
        descriptionHash
      );
      
      // Attempt to execute before timelock delay
      await expect(
        silicaGovernor.execute(
          [await silicaToken.getAddress()],
          [0],
          [transferCalldata],
          descriptionHash
        )
      ).to.be.revertedWith("TimelockController: operation is not ready");
    });
    
    it("Should not allow direct calls to timelock-controlled functions", async function () {
      // Attempt to directly mint tokens via token contract (should fail)
      await expect(
        silicaToken.mint(recipient.address, TRANSFER_AMOUNT)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      // Verify only timelock can call
      expect(await silicaToken.owner()).to.equal(await silicaTimelock.getAddress());
    });
  });
}); 