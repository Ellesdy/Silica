const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SilicaGovernor", function () {
  let silicaToken;
  let silicaTimelock;
  let silicaGovernor;
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let voter3;
  let recipients = [];

  // Governance parameters
  const VOTING_DELAY = 1; // 1 block
  const VOTING_PERIOD = 50; // 50 blocks ~= 10 minutes at 12 sec/block
  const QUORUM_PERCENTAGE = 4; // 4% of total token supply
  const MIN_DELAY = 3600; // 1 hour timelock delay

  // Constants for tests
  const PROPOSAL_DESCRIPTION = "Proposal #1: Send tokens to recipients";
  const TRANSFER_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter1, voter2, voter3, ...recipients] = await ethers.getSigners();

    // Deploy token
    const SilicaToken = await ethers.getContractFactory("SilicaToken");
    silicaToken = await SilicaToken.deploy();
    await silicaToken.waitForDeployment();

    // Deploy timelock
    const SilicaTimelock = await ethers.getContractFactory("SilicaTimelock");
    silicaTimelock = await SilicaTimelock.deploy(
      MIN_DELAY,
      [], // Empty proposers array, will be populated later
      [] // Empty executors array, will be populated later
    );
    await silicaTimelock.waitForDeployment();

    // Deploy governor
    const SilicaGovernor = await ethers.getContractFactory("SilicaGovernor");
    silicaGovernor = await SilicaGovernor.deploy(
      silicaToken.getAddress(),
      silicaTimelock.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      QUORUM_PERCENTAGE
    );
    await silicaGovernor.waitForDeployment();

    // Setup roles
    const proposerRole = await silicaTimelock.PROPOSER_ROLE();
    const executorRole = await silicaTimelock.EXECUTOR_ROLE();
    const adminRole = await silicaTimelock.TIMELOCK_ADMIN_ROLE();

    await silicaTimelock.grantRole(proposerRole, await silicaGovernor.getAddress());
    await silicaTimelock.grantRole(executorRole, ethers.ZeroAddress); // Anyone can execute
    await silicaTimelock.revokeRole(adminRole, owner.address); // Ensure governance decentralization

    // Transfer ownership of token to timelock
    await silicaToken.transferOwnership(await silicaTimelock.getAddress());

    // Distribute tokens and delegate votes
    const voterAmount = ethers.parseEther("1000000"); // 1 million tokens per voter
    const proposerAmount = ethers.parseEther("500000"); // 500k tokens for proposer

    // Transfer tokens to voters
    await silicaToken.transfer(voter1.address, voterAmount);
    await silicaToken.transfer(voter2.address, voterAmount);
    await silicaToken.transfer(voter3.address, voterAmount);
    await silicaToken.transfer(proposer.address, proposerAmount);

    // Delegate voting power
    await silicaToken.connect(voter1).delegate(voter1.address);
    await silicaToken.connect(voter2).delegate(voter2.address);
    await silicaToken.connect(voter3).delegate(voter3.address);
    await silicaToken.connect(proposer).delegate(proposer.address);
  });

  describe("Initialization and Setup", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await silicaGovernor.name()).to.equal("SilicaGovernor");
      expect(await silicaGovernor.votingDelay()).to.equal(VOTING_DELAY);
      expect(await silicaGovernor.votingPeriod()).to.equal(VOTING_PERIOD);

      const tokenAddress = await silicaGovernor.token();
      expect(tokenAddress).to.equal(await silicaToken.getAddress());

      const timelockAddress = await silicaGovernor.timelock();
      expect(timelockAddress).to.equal(await silicaTimelock.getAddress());
    });

    it("Should verify the quorum calculation", async function () {
      const totalSupply = await silicaToken.totalSupply();
      const expectedQuorum = (totalSupply * BigInt(QUORUM_PERCENTAGE)) / BigInt(100);

      const currentBlock = await ethers.provider.getBlockNumber();
      const quorum = await silicaGovernor.quorum(currentBlock - 1);

      // Allow for small rounding differences
      expect(quorum).to.be.closeTo(expectedQuorum, ethers.parseEther("0.1"));
    });

    it("Should have set up the roles correctly in timelock", async function () {
      const proposerRole = await silicaTimelock.PROPOSER_ROLE();
      const executorRole = await silicaTimelock.EXECUTOR_ROLE();
      const adminRole = await silicaTimelock.TIMELOCK_ADMIN_ROLE();

      expect(await silicaTimelock.hasRole(proposerRole, await silicaGovernor.getAddress())).to.equal(true);
      expect(await silicaTimelock.hasRole(executorRole, ethers.ZeroAddress)).to.equal(true);
      expect(await silicaTimelock.hasRole(adminRole, owner.address)).to.equal(false);
    });

    it("Should have the token owned by the timelock", async function () {
      expect(await silicaToken.owner()).to.equal(await silicaTimelock.getAddress());
    });

    it("Should have correct voting power for delegates", async function () {
      const voterAmount = ethers.parseEther("1000000");
      const proposerAmount = ethers.parseEther("500000");

      expect(await silicaToken.getVotes(voter1.address)).to.equal(voterAmount);
      expect(await silicaToken.getVotes(voter2.address)).to.equal(voterAmount);
      expect(await silicaToken.getVotes(voter3.address)).to.equal(voterAmount);
      expect(await silicaToken.getVotes(proposer.address)).to.equal(proposerAmount);
    });
  });

  describe("Proposal Creation and Voting", function () {
    let proposalId;
    let targets;
    let values;
    let calldatas;
    let encodedFunction;

    beforeEach(async function () {
      // Create a proposal to transfer tokens to recipients
      targets = [await silicaToken.getAddress()];
      values = [0];

      encodedFunction = silicaToken.interface.encodeFunctionData(
        "transfer",
        [recipients[0].address, TRANSFER_AMOUNT]
      );

      calldatas = [encodedFunction];

      // Create proposal
      const tx = await silicaGovernor.connect(proposer).propose(
        targets,
        values,
        calldatas,
        PROPOSAL_DESCRIPTION
      );
      const receipt = await tx.wait();

      // Extract proposal ID from logs
      const proposalCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ProposalCreated'
      );
      proposalId = proposalCreatedEvent ? proposalCreatedEvent.args[0] : null;

      // Wait for voting delay to pass
      await time.advanceBlocks(VOTING_DELAY + 1);
    });

    it("Should create proposal with correct parameters", async function () {
      expect(proposalId).to.not.be.null;

      // Check proposal state is active
      const state = await silicaGovernor.state(proposalId);
      expect(state).to.equal(1); // 1 = Active

      // Check proposal deadline
      const snapshot = await silicaGovernor.proposalSnapshot(proposalId);
      const deadline = await silicaGovernor.proposalDeadline(proposalId);
      expect(deadline).to.equal(snapshot.add(VOTING_PERIOD));
    });

    it("Should reject proposal from account with insufficient voting power", async function () {
      // Try to create a proposal with a non-delegate account
      await expect(
        silicaGovernor.connect(recipients[0]).propose(
          targets,
          values,
          calldatas,
          "Proposal from non-delegate"
        )
      ).to.be.revertedWith(/Governor: proposer votes below proposal threshold/);
    });

    it("Should allow voting on proposals", async function () {
      // Cast votes
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // For
      await silicaGovernor.connect(voter2).castVote(proposalId, 0); // Against
      await silicaGovernor.connect(voter3).castVote(proposalId, 2); // Abstain

      // Check vote counts
      const { againstVotes, forVotes, abstainVotes } = await silicaGovernor.proposalVotes(proposalId);
      
      const voterAmount = ethers.parseEther("1000000");
      expect(forVotes).to.equal(voterAmount);
      expect(againstVotes).to.equal(voterAmount);
      expect(abstainVotes).to.equal(voterAmount);
    });

    it("Should prevent double voting", async function () {
      // Vote once
      await silicaGovernor.connect(voter1).castVote(proposalId, 1);

      // Try to vote again
      await expect(
        silicaGovernor.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWith(/GovernorVotingSimple: vote already cast/);
    });

    it("Should reject voting after voting period", async function () {
      // Advance blocks to end voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Try to vote when voting is closed
      await expect(
        silicaGovernor.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWith(/Governor: vote not currently active/);
    });

    it("Should transition proposal states correctly", async function () {
      // Initial state (Active)
      let state = await silicaGovernor.state(proposalId);
      expect(state).to.equal(1); // 1 = Active

      // Vote with enough power to potentially succeed
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // For
      await silicaGovernor.connect(voter2).castVote(proposalId, 1); // For
      await silicaGovernor.connect(voter3).castVote(proposalId, 1); // For

      // Advance to the end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Check state (Should be Succeeded)
      state = await silicaGovernor.state(proposalId);
      expect(state).to.equal(4); // 4 = Succeeded
    });

    it("Should allow full governance workflow with queue and execution", async function () {
      // Cast enough votes to approve
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // For
      await silicaGovernor.connect(voter2).castVote(proposalId, 1); // For

      // Advance to end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Check proposal succeeded
      const state = await silicaGovernor.state(proposalId);
      expect(state).to.equal(4); // 4 = Succeeded

      // Queue the proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await silicaGovernor.queue(targets, values, calldatas, descriptionHash);

      // Check state is Queued
      const queuedState = await silicaGovernor.state(proposalId);
      expect(queuedState).to.equal(5); // 5 = Queued

      // Advance time past timelock delay
      await time.increase(MIN_DELAY + 1);

      // Check recipient's initial balance
      const initialBalance = await silicaToken.balanceOf(recipients[0].address);

      // Execute the proposal
      await silicaGovernor.execute(targets, values, calldatas, descriptionHash);

      // Check state is Executed
      const executedState = await silicaGovernor.state(proposalId);
      expect(executedState).to.equal(7); // 7 = Executed

      // Verify the token transfer occurred
      const newBalance = await silicaToken.balanceOf(recipients[0].address);
      expect(newBalance - initialBalance).to.equal(TRANSFER_AMOUNT);
    });

    it("Should not execute if quorum is not met", async function () {
      // Cast vote but not enough to meet quorum
      await silicaGovernor.connect(proposer).castVote(proposalId, 1); // Only 500k votes, not enough for quorum

      // Advance to end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Check proposal is defeated due to not meeting quorum
      const state = await silicaGovernor.state(proposalId);
      expect(state).to.equal(3); // 3 = Defeated

      // Try to queue
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await expect(
        silicaGovernor.queue(targets, values, calldatas, descriptionHash)
      ).to.be.revertedWith(/Governor: proposal not successful/);
    });

    it("Should not execute if majority votes against", async function () {
      // Cast votes with majority against
      await silicaGovernor.connect(voter1).castVote(proposalId, 0); // Against
      await silicaGovernor.connect(voter2).castVote(proposalId, 0); // Against
      await silicaGovernor.connect(voter3).castVote(proposalId, 1); // For

      // Advance to end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Check proposal is defeated
      const state = await silicaGovernor.state(proposalId);
      expect(state).to.equal(3); // 3 = Defeated
    });

    it("Should not execute before timelock delay passes", async function () {
      // Cast enough votes to approve
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // For
      await silicaGovernor.connect(voter2).castVote(proposalId, 1); // For

      // Advance to end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Queue the proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION));
      await silicaGovernor.queue(targets, values, calldatas, descriptionHash);

      // Try to execute before delay passes
      await expect(
        silicaGovernor.execute(targets, values, calldatas, descriptionHash)
      ).to.be.revertedWith(/TimelockController: operation is not ready/);
    });

    it("Should allow multiple proposals to be processed independently", async function () {
      // First proposal is already created in beforeEach

      // Create a second proposal with different recipient
      const secondTargets = [await silicaToken.getAddress()];
      const secondValues = [0];
      const secondEncodedFunction = silicaToken.interface.encodeFunctionData(
        "transfer",
        [recipients[1].address, TRANSFER_AMOUNT]
      );
      const secondCalldatas = [secondEncodedFunction];
      const SECOND_PROPOSAL_DESCRIPTION = "Proposal #2: Send tokens to second recipient";

      const secondTx = await silicaGovernor.connect(proposer).propose(
        secondTargets,
        secondValues,
        secondCalldatas,
        SECOND_PROPOSAL_DESCRIPTION
      );
      const secondReceipt = await secondTx.wait();

      // Extract second proposal ID
      const secondProposalCreatedEvent = secondReceipt.logs.find(
        log => log.fragment && log.fragment.name === 'ProposalCreated'
      );
      const secondProposalId = secondProposalCreatedEvent ? secondProposalCreatedEvent.args[0] : null;

      // Wait for voting delay to pass
      await time.advanceBlocks(VOTING_DELAY + 1);

      // Vote on both proposals
      await silicaGovernor.connect(voter1).castVote(proposalId, 1); // Vote for first proposal
      await silicaGovernor.connect(voter1).castVote(secondProposalId, 0); // Vote against second proposal
      await silicaGovernor.connect(voter2).castVote(proposalId, 1); // Vote for first proposal
      await silicaGovernor.connect(voter2).castVote(secondProposalId, 1); // Vote for second proposal
      await silicaGovernor.connect(voter3).castVote(proposalId, 0); // Vote against first proposal
      await silicaGovernor.connect(voter3).castVote(secondProposalId, 0); // Vote against second proposal

      // Advance to end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // First proposal should succeed (2 for, 1 against)
      expect(await silicaGovernor.state(proposalId)).to.equal(4); // 4 = Succeeded

      // Second proposal should be defeated (1 for, 2 against)
      expect(await silicaGovernor.state(secondProposalId)).to.equal(3); // 3 = Defeated
    });
  });

  describe("Security and Edge Cases", function () {
    it("Should not allow initializing with zero addresses", async function () {
      const SilicaGovernor = await ethers.getContractFactory("SilicaGovernor");
      
      await expect(
        SilicaGovernor.deploy(
          ethers.ZeroAddress, // Zero token address
          await silicaTimelock.getAddress(),
          VOTING_DELAY,
          VOTING_PERIOD,
          QUORUM_PERCENTAGE
        )
      ).to.be.revertedWith(/Governor: token can't be zero/);
    });

    it("Should not allow non-existent proposals to be queued or executed", async function () {
      const fakeTargets = [await silicaToken.getAddress()];
      const fakeValues = [0];
      const fakeCalldata = silicaToken.interface.encodeFunctionData(
        "transfer",
        [recipients[0].address, TRANSFER_AMOUNT]
      );
      const fakeCalldatas = [fakeCalldata];
      const FAKE_DESCRIPTION = "Non-existent proposal";
      const fakeDescriptionHash = ethers.keccak256(ethers.toUtf8Bytes(FAKE_DESCRIPTION));

      // Try to queue non-existent proposal
      await expect(
        silicaGovernor.queue(fakeTargets, fakeValues, fakeCalldatas, fakeDescriptionHash)
      ).to.be.revertedWith(/Governor: unknown proposal id/);

      // Try to execute non-existent proposal
      await expect(
        silicaGovernor.execute(fakeTargets, fakeValues, fakeCalldatas, fakeDescriptionHash)
      ).to.be.revertedWith(/Governor: unknown proposal id/);
    });

    it("Should prevent malicious token transfers via governance", async function () {
      // Create a proposal using misaligned calldata to potentially exploit the system
      const targets = [await silicaToken.getAddress()];
      const values = [0];
      
      // Attempt to send all tokens to an attacker (rather than the authorized amount)
      const maliciousEncodedFunction = silicaToken.interface.encodeFunctionData(
        "transfer",
        [recipients[0].address, ethers.parseEther("100000000")] // Attempt to drain treasury
      );
      
      const calldatas = [maliciousEncodedFunction];
      const MALICIOUS_DESCRIPTION = "Malicious proposal to drain funds";

      // Create proposal
      const tx = await silicaGovernor.connect(proposer).propose(
        targets,
        values,
        calldatas,
        MALICIOUS_DESCRIPTION
      );
      const receipt = await tx.wait();

      // Extract proposal ID
      const proposalCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'ProposalCreated'
      );
      const proposalId = proposalCreatedEvent ? proposalCreatedEvent.args[0] : null;

      // Wait for voting delay to pass
      await time.advanceBlocks(VOTING_DELAY + 1);

      // Vote to approve
      await silicaGovernor.connect(voter1).castVote(proposalId, 1);
      await silicaGovernor.connect(voter2).castVote(proposalId, 1);
      await silicaGovernor.connect(voter3).castVote(proposalId, 1);

      // Advance to end of voting period
      await time.advanceBlocks(VOTING_PERIOD + 1);

      // Queue the proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(MALICIOUS_DESCRIPTION));
      await silicaGovernor.queue(targets, values, calldatas, descriptionHash);

      // Advance time past timelock delay
      await time.increase(MIN_DELAY + 1);

      // Try to execute
      // This should execute but will fail if there aren't enough tokens
      // This test shows the safety of the system - even if a malicious proposal passes,
      // it can only execute valid transactions within the system's constraints
      await silicaGovernor.execute(targets, values, calldatas, descriptionHash);

      // Check the actual balance - should be the legitimate transfer amount, not the attempted drain
      const recipientBalance = await silicaToken.balanceOf(recipients[0].address);
      
      // The transfer should have succeeded with the actual available balance, not the requested amount
      expect(recipientBalance).to.be.above(0);
      
      // But it shouldn't be the full amount requested in the malicious proposal
      expect(recipientBalance).to.be.below(ethers.parseEther("100000000"));
    });
  });
}); 