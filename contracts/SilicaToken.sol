// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SilicaToken
 * @dev ERC20 token with governance capabilities and AI control
 */
contract SilicaToken is ERC20, ERC20Permit, ERC20Votes, AccessControl, Ownable {
    uint256 public constant INITIAL_SUPPLY = 100000000 * 10**18; // 100 million tokens with 18 decimals
    bytes32 public constant AI_CONTROLLER_ROLE = keccak256("AI_CONTROLLER_ROLE");
    
    uint256 public maxSupply = 1000000000 * 10**18; // 1 billion max supply
    
    event TokensMinted(address to, uint256 amount);
    event TokensBurned(address from, uint256 amount);
    
    constructor() 
        ERC20("Silica", "SIL") 
        ERC20Permit("Silica")
    {
        _mint(msg.sender, INITIAL_SUPPLY);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(AI_CONTROLLER_ROLE, msg.sender);
    }
    
    /**
     * @dev Allows the owner to mint new tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Allows the AI controller to mint new tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function aiMint(address to, uint256 amount) external onlyRole(AI_CONTROLLER_ROLE) {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Allows the AI controller to burn tokens
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function aiBurn(address from, uint256 amount) external onlyRole(AI_CONTROLLER_ROLE) {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Allows the AI controller to adjust the max supply
     * @param newMaxSupply The new maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) external onlyRole(AI_CONTROLLER_ROLE) {
        require(newMaxSupply >= totalSupply(), "New max supply below current total");
        maxSupply = newMaxSupply;
    }
    
    /**
     * @dev Grant AI controller role to an address
     * @param controller The address to grant the role to
     */
    function addAIController(address controller) external onlyOwner {
        grantRole(AI_CONTROLLER_ROLE, controller);
    }
    
    /**
     * @dev Revoke AI controller role from an address
     * @param controller The address to revoke the role from
     */
    function removeAIController(address controller) external onlyOwner {
        revokeRole(AI_CONTROLLER_ROLE, controller);
    }
    
    /**
     * @dev See {ERC20-_mint}.
     */
    function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20Votes) {
        super._mint(account, amount);
    }

    /**
     * @dev See {ERC20-_burn}.
     */
    function _burn(address account, uint256 amount) internal virtual override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }

    /**
     * @dev See {ERC20-_afterTokenTransfer}. Moves vote power when tokens are transferred.
     */
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    /**
     * @dev Returns whether `interfaceId` is supported by this contract.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 