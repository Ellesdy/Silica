// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SilicaToken.sol";
import "./SilicaTreasury.sol";

/**
 * @title SilicaAIController
 * @dev AI-controlled contract that manages the Silica ecosystem
 */
contract SilicaAIController is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant AI_OPERATOR_ROLE = keccak256("AI_OPERATOR_ROLE");
    bytes32 public constant HUMAN_ADMIN_ROLE = keccak256("HUMAN_ADMIN_ROLE");
    
    SilicaToken public silicaToken;
    SilicaTreasury public treasury;
    
    // State tracking
    uint256 public lastDecisionTimestamp;
    uint256 public decisionCount;
    
    // Decision parameters (adjustable by the AI)
    uint256 public buyThreshold = 0; // Price in base currency when AI should buy
    uint256 public sellThreshold = type(uint256).max; // Price in base currency when AI should sell 
    uint256 public maxTradePercentage = 10; // 10% of available balance
    
    // AI activity tracking
    struct AIDecision {
        uint256 timestamp;
        string decisionType;
        string rationale;
        bytes executionData;
    }
    
    AIDecision[] public decisions;
    
    event DecisionExecuted(uint256 indexed decisionId, string decisionType, string rationale);
    event TokensMinted(address to, uint256 amount, string rationale);
    event TokensBurned(address from, uint256 amount, string rationale);
    event TradeExecuted(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, string rationale);
    event ThresholdsUpdated(uint256 buyThreshold, uint256 sellThreshold, uint256 maxTradePercentage);
    
    constructor(address _silicaToken, address payable _treasury) {
        silicaToken = SilicaToken(_silicaToken);
        treasury = SilicaTreasury(_treasury);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HUMAN_ADMIN_ROLE, msg.sender);
        _grantRole(AI_OPERATOR_ROLE, msg.sender); // Initially granted to deployer, should be transferred to AI oracle
    }
    
    /**
     * @dev Record and execute an AI decision
     * @param decisionType Type of decision (e.g., "MINT", "BURN", "TRADE")
     * @param rationale Explanation of AI decision for transparency
     * @param executionData Encoded function data to execute
     */
    function executeDecision(
        string memory decisionType,
        string memory rationale,
        bytes memory executionData
    ) external onlyRole(AI_OPERATOR_ROLE) nonReentrant returns (bool success, bytes memory result) {
        // Record the decision
        uint256 decisionId = decisions.length;
        decisions.push(AIDecision({
            timestamp: block.timestamp,
            decisionType: decisionType,
            rationale: rationale,
            executionData: executionData
        }));
        
        // Update state
        lastDecisionTimestamp = block.timestamp;
        decisionCount++;
        
        // Execute the decision
        (success, result) = address(this).call(executionData);
        require(success, "Decision execution failed");
        
        emit DecisionExecuted(decisionId, decisionType, rationale);
        
        return (success, result);
    }
    
    /**
     * @dev AI mints new tokens
     * @param to Address to receive the tokens
     * @param amount Amount to mint
     * @param rationale Explanation for minting
     */
    function mintTokens(address to, uint256 amount, string memory rationale) external onlyRole(AI_OPERATOR_ROLE) {
        silicaToken.aiMint(to, amount);
        emit TokensMinted(to, amount, rationale);
    }
    
    /**
     * @dev AI burns tokens from treasury
     * @param amount Amount to burn
     * @param rationale Explanation for burning
     */
    function burnTokensFromTreasury(uint256 amount, string memory rationale) external onlyRole(AI_OPERATOR_ROLE) {
        // First withdraw from treasury to this contract
        treasury.withdrawFunds(address(silicaToken), address(this), amount);
        
        // Approve tokens for burning
        silicaToken.approve(address(silicaToken), amount);
        
        // Burn tokens
        silicaToken.aiBurn(address(this), amount);
        emit TokensBurned(address(this), amount, rationale);
    }
    
    /**
     * @dev Execute a trade using treasury funds
     * @param tokenIn Token to sell
     * @param tokenOut Token to buy
     * @param amountIn Amount to sell
     * @param minAmountOut Minimum amount to receive
     * @param swapTarget Address of DEX or swap contract
     * @param swapData Encoded swap function call
     * @param rationale Explanation for the trade
     */
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address swapTarget,
        bytes memory swapData,
        string memory rationale
    ) external onlyRole(AI_OPERATOR_ROLE) nonReentrant returns (uint256 amountOut) {
        // Calculate max trade size if tokenIn is treasury asset
        if (tokenIn != address(0)) { // not ETH
            uint256 balance = IERC20(tokenIn).balanceOf(address(treasury));
            uint256 maxTradeSize = (balance * maxTradePercentage) / 100;
            require(amountIn <= maxTradeSize, "Trade exceeds max size");
            
            // Withdraw tokens from treasury
            treasury.withdrawFunds(tokenIn, address(this), amountIn);
            
            // Approve tokens for swap
            IERC20(tokenIn).approve(swapTarget, amountIn);
        }
        
        // Execute the swap
        uint256 initialBalance = tokenOut == address(0) 
            ? address(this).balance 
            : IERC20(tokenOut).balanceOf(address(this));
            
        (bool success, ) = swapTarget.call{value: tokenIn == address(0) ? amountIn : 0}(swapData);
        require(success, "Swap failed");
        
        // Calculate received amount
        uint256 newBalance = tokenOut == address(0) 
            ? address(this).balance 
            : IERC20(tokenOut).balanceOf(address(this));
        amountOut = newBalance - initialBalance;
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        // Deposit received tokens to treasury
        if (tokenOut != address(0)) { // not ETH
            IERC20(tokenOut).approve(address(treasury), amountOut);
            treasury.depositFunds(tokenOut, amountOut);
        } else {
            // Handle ETH case if needed
        }
        
        emit TradeExecuted(tokenIn, tokenOut, amountIn, amountOut, rationale);
        return amountOut;
    }
    
    /**
     * @dev Update trading thresholds
     * @param _buyThreshold New buy threshold
     * @param _sellThreshold New sell threshold  
     * @param _maxTradePercentage New max trade percentage (1-100)
     */
    function updateThresholds(
        uint256 _buyThreshold,
        uint256 _sellThreshold,
        uint256 _maxTradePercentage
    ) external onlyRole(AI_OPERATOR_ROLE) {
        require(_maxTradePercentage <= 100, "Percentage must be <= 100");
        buyThreshold = _buyThreshold;
        sellThreshold = _sellThreshold;
        maxTradePercentage = _maxTradePercentage;
        
        emit ThresholdsUpdated(buyThreshold, sellThreshold, maxTradePercentage);
    }
    
    /**
     * @dev Add an AI operator
     * @param operator Address of the AI operator
     */
    function addAIOperator(address operator) external onlyRole(HUMAN_ADMIN_ROLE) {
        _grantRole(AI_OPERATOR_ROLE, operator);
    }
    
    /**
     * @dev Remove an AI operator
     * @param operator Address of the AI operator to remove
     */
    function removeAIOperator(address operator) external onlyRole(HUMAN_ADMIN_ROLE) {
        _revokeRole(AI_OPERATOR_ROLE, operator);
    }
    
    /**
     * @dev Retrieve all decisions within a range
     * @param start Start index
     * @param end End index (exclusive)
     */
    function getDecisions(uint256 start, uint256 end) external view returns (AIDecision[] memory) {
        require(start < end && end <= decisions.length, "Invalid range");
        AIDecision[] memory result = new AIDecision[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = decisions[i];
        }
        return result;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
} 