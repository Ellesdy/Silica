// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title SilicaTimelock
 * @dev Timelock controller for delayed governance execution
 */
contract SilicaTimelock is TimelockController {
    /**
     * @dev Constructor for SilicaTimelock
     * @param minDelay The minimum delay for operations
     * @param proposers The addresses that can propose
     * @param executors The addresses that can execute
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) TimelockController(minDelay, proposers, executors, address(0)) {}
} 