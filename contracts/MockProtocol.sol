// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockProtocol
 * @dev A simple mock protocol for testing investment functionality
 */
contract MockProtocol {
    using SafeERC20 for IERC20;
    
    IERC20 public inputToken;
    IERC20 public outputToken;
    
    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed sender, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _inputToken The input token address
     * @param _outputToken The output token address
     */
    constructor(address _inputToken, address _outputToken) {
        inputToken = IERC20(_inputToken);
        outputToken = IERC20(_outputToken);
    }
    
    /**
     * @dev Simulates a deposit (exchange inputToken for outputToken)
     * @param amount The amount to deposit
     * @return success True if successful
     */
    function deposit(uint256 amount) external returns (bool) {
        // Take input tokens from sender
        inputToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Send output tokens to sender (simple 1:1 conversion)
        outputToken.safeTransfer(msg.sender, amount);
        
        emit Deposit(msg.sender, amount);
        return true;
    }
    
    /**
     * @dev Simulates a withdrawal (exchange outputToken for inputToken)
     * @param amount The amount to withdraw
     * @return success True if successful
     */
    function withdraw(uint256 amount) external returns (bool) {
        // Take output tokens from sender
        outputToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Send input tokens to sender (simple 1:1 conversion)
        inputToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, amount);
        return true;
    }
    
    /**
     * @dev Fund the mock protocol with tokens for testing
     * @param token The token to fund with
     * @param amount The amount to fund
     */
    function fund(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Get balance of a token
     * @param token The token address
     * @return The balance
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
} 