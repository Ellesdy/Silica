// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SilicaTreasury
 * @dev Treasury contract for the Silica DAO that manages funds
 */
contract SilicaTreasury is AccessControl {
    using SafeERC20 for IERC20;
    
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant AI_CONTROLLER_ROLE = keccak256("AI_CONTROLLER_ROLE");
    
    event FundsDeposited(address indexed token, address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);
    event AssetAdded(address indexed token, string name, string assetType);
    event InvestmentExecuted(address indexed targetProtocol, address indexed token, uint256 amount, bytes data);
    
    // Asset tracking
    struct Asset {
        string name;
        string assetType; // "stablecoin", "governance", "yield", etc.
        bool isActive;
    }
    
    mapping(address => Asset) public assets;
    address[] public assetList;
    
    constructor(address governor) {
        _grantRole(DEFAULT_ADMIN_ROLE, governor);
        _grantRole(GOVERNOR_ROLE, governor);
        
        // Also grant the role to the deployer for testing purposes
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Deposits tokens into the treasury
     * @param token The ERC20 token to deposit
     * @param amount The amount to deposit
     */
    function depositFunds(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit FundsDeposited(token, msg.sender, amount);
    }
    
    /**
     * @dev Withdraws tokens from the treasury
     * @param token The ERC20 token to withdraw
     * @param to The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawFunds(address token, address to, uint256 amount) external onlyRole(GOVERNOR_ROLE) {
        IERC20(token).safeTransfer(to, amount);
        emit FundsWithdrawn(token, to, amount);
    }
    
    /**
     * @dev Register a new asset for tracking
     * @param token The token address
     * @param name The name of the asset
     * @param assetType The type of asset
     */
    function addAsset(address token, string calldata name, string calldata assetType) 
        external
        onlyRole(GOVERNOR_ROLE)
    {
        require(!assets[token].isActive, "Asset already exists");
        
        assets[token] = Asset({
            name: name,
            assetType: assetType,
            isActive: true
        });
        
        assetList.push(token);
        emit AssetAdded(token, name, assetType);
    }
    
    /**
     * @dev Grant AI controller role to an address
     * @param controller The AI controller address
     */
    function setAIController(address controller) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(AI_CONTROLLER_ROLE, controller);
        _grantRole(GOVERNOR_ROLE, controller);
    }
    
    /**
     * @dev Execute an investment strategy through an external protocol
     * @param targetProtocol Protocol to interact with (e.g., lending platform)
     * @param token Token to invest
     * @param amount Amount to invest
     * @param data Encoded function call data
     */
    function executeInvestment(
        address targetProtocol,
        address token,
        uint256 amount,
        bytes calldata data
    ) 
        external
        onlyRole(AI_CONTROLLER_ROLE)
        returns (bool success)
    {
        // Approve token usage
        IERC20(token).approve(targetProtocol, amount);
        
        // Execute the investment transaction
        (success, ) = targetProtocol.call(data);
        require(success, "Investment execution failed");
        
        // Reset approval
        IERC20(token).approve(targetProtocol, 0);
        
        emit InvestmentExecuted(targetProtocol, token, amount, data);
        return success;
    }
    
    /**
     * @dev Get token balance of the treasury
     * @param token The ERC20 token address
     * @return The balance of tokens held by the treasury
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Get list of all registered assets
     * @return Array of asset addresses
     */
    function getAllAssets() external view returns (address[] memory) {
        return assetList;
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {
        emit FundsDeposited(address(0), msg.sender, msg.value);
    }
} 