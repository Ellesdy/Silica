// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockDex
 * @dev A simple mock DEX contract for testing token swaps
 */
contract MockDex {
    using SafeERC20 for IERC20;
    
    // Events
    event Swap(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    
    /**
     * @dev Simple swap function that returns 2x the input amount
     * @param tokenIn Address of input token (address(0) for ETH)
     * @param tokenOut Address of output token (address(0) for ETH)
     * @param amountIn Amount of input tokens to swap
     * @param minAmountOut Minimum amount of output tokens expected
     * @return amountOut The amount of output tokens
     */
    function swap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 minAmountOut
    ) external payable returns (uint256 amountOut) {
        // Simple swap implementation for testing
        amountOut = amountIn * 2; // Simple 2x return rate
        
        require(amountOut >= minAmountOut, "Slippage too high");
        
        // Handle input token
        if (tokenIn != address(0)) {
            // Transfer tokenIn from msg.sender to this contract
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        } else {
            // Ensure enough ETH was sent
            require(msg.value >= amountIn, "Insufficient ETH sent");
        }
        
        // Handle output token
        if (tokenOut != address(0)) {
            // Make sure we have enough output tokens
            require(
                IERC20(tokenOut).balanceOf(address(this)) >= amountOut,
                "Insufficient output token balance"
            );
            
            // Transfer tokenOut to msg.sender
            IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        } else {
            // Make sure we have enough ETH
            require(
                address(this).balance >= amountOut,
                "Insufficient ETH balance"
            );
            
            // Send ETH to msg.sender
            (bool success, ) = payable(msg.sender).call{value: amountOut}("");
            require(success, "ETH transfer failed");
        }
        
        emit Swap(tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }
    
    /**
     * @dev Fund the mock DEX with tokens for testing
     * @param token The token to fund with
     * @param amount The amount to fund
     */
    function fund(address token, uint256 amount) external payable {
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            require(msg.value >= amount, "Insufficient ETH sent");
        }
    }
    
    /**
     * @dev Withdraw tokens/ETH from the mock DEX (for testing cleanup)
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     * @param recipient The recipient address
     */
    function withdraw(address token, uint256 amount, address recipient) external {
        if (token != address(0)) {
            IERC20(token).safeTransfer(recipient, amount);
        } else {
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        }
    }
    
    // To receive ETH
    receive() external payable {}
} 