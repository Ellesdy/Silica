// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SilicaModelRegistry
 * @dev Registry for AI models in the Silica ecosystem
 */
contract SilicaModelRegistry is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant MODEL_CREATOR_ROLE = keccak256("MODEL_CREATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Structs
    struct ModelMetadata {
        uint256 id;
        address creator;
        string name;
        string description;
        string modelType; // e.g., "text-generation", "image-generation", "classification"
        string version;
        string storageURI; // URI pointing to model weights (IPFS, Arweave, etc.)
        string apiEndpoint; // Optional API endpoint for hosted models
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 usageCount;
        uint256 feePerCall; // Fee in wei per API call
    }
    
    struct ModelUsageStats {
        uint256 totalCalls;
        uint256 totalRevenue;
        uint256 lastUsedTimestamp;
    }
    
    // State variables
    uint256 private _modelIdCounter;
    mapping(uint256 => ModelMetadata) public models;
    mapping(uint256 => ModelUsageStats) public modelStats;
    mapping(address => uint256[]) public creatorModels;
    mapping(string => bool) public modelNameExists;
    
    // Events
    event ModelRegistered(uint256 indexed modelId, address indexed creator, string name, string modelType);
    event ModelUpdated(uint256 indexed modelId, string version, string storageURI);
    event ModelStatusChanged(uint256 indexed modelId, bool isActive);
    event ModelUsed(uint256 indexed modelId, address indexed user, uint256 fee);
    event FeeUpdated(uint256 indexed modelId, uint256 newFee);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MODEL_CREATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new AI model
     * @param name Model name (must be unique)
     * @param description Brief description of the model
     * @param modelType Type of AI model
     * @param version Initial version of the model
     * @param storageURI URI where model weights are stored
     * @param apiEndpoint Optional API endpoint for the model
     * @param feePerCall Fee to charge per model call (in wei)
     * @return The ID of the newly registered model
     */
    function registerModel(
        string calldata name,
        string calldata description,
        string calldata modelType,
        string calldata version,
        string calldata storageURI,
        string calldata apiEndpoint,
        uint256 feePerCall
    ) external onlyRole(MODEL_CREATOR_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Model name cannot be empty");
        require(bytes(storageURI).length > 0, "Storage URI cannot be empty");
        require(!modelNameExists[name], "Model name already exists");
        
        uint256 modelId = _modelIdCounter++;
        
        models[modelId] = ModelMetadata({
            id: modelId,
            creator: msg.sender,
            name: name,
            description: description,
            modelType: modelType,
            version: version,
            storageURI: storageURI,
            apiEndpoint: apiEndpoint,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            usageCount: 0,
            feePerCall: feePerCall
        });
        
        modelStats[modelId] = ModelUsageStats({
            totalCalls: 0,
            totalRevenue: 0,
            lastUsedTimestamp: 0
        });
        
        creatorModels[msg.sender].push(modelId);
        modelNameExists[name] = true;
        
        emit ModelRegistered(modelId, msg.sender, name, modelType);
        
        return modelId;
    }
    
    /**
     * @dev Update an existing model
     * @param modelId ID of the model to update
     * @param version New version of the model
     * @param storageURI New URI where model weights are stored
     * @param apiEndpoint New API endpoint for the model
     */
    function updateModel(
        uint256 modelId,
        string calldata version,
        string calldata storageURI,
        string calldata apiEndpoint
    ) external {
        ModelMetadata storage model = models[modelId];
        require(model.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(model.id == modelId, "Model does not exist");
        
        model.version = version;
        model.storageURI = storageURI;
        model.apiEndpoint = apiEndpoint;
        model.updatedAt = block.timestamp;
        
        emit ModelUpdated(modelId, version, storageURI);
    }
    
    /**
     * @dev Toggle the active status of a model
     * @param modelId ID of the model
     * @param isActive New active status
     */
    function setModelStatus(uint256 modelId, bool isActive) external {
        ModelMetadata storage model = models[modelId];
        require(model.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(model.id == modelId, "Model does not exist");
        
        model.isActive = isActive;
        
        emit ModelStatusChanged(modelId, isActive);
    }
    
    /**
     * @dev Update the fee for using a model
     * @param modelId ID of the model
     * @param newFee New fee amount in wei
     */
    function updateModelFee(uint256 modelId, uint256 newFee) external {
        ModelMetadata storage model = models[modelId];
        require(model.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(model.id == modelId, "Model does not exist");
        
        model.feePerCall = newFee;
        
        emit FeeUpdated(modelId, newFee);
    }
    
    /**
     * @dev Record usage of a model and collect fee
     * @param modelId ID of the model being used
     * @param user Address of the user using the model
     * @param _paymentToken Address of token used for payment (can be zero address for ETH)
     */
    function recordModelUsage(uint256 modelId, address user, address _paymentToken) external nonReentrant {
        ModelMetadata storage model = models[modelId];
        require(model.id == modelId, "Model does not exist");
        require(model.isActive, "Model is not active");
        
        // Update usage statistics
        model.usageCount++;
        
        ModelUsageStats storage stats = modelStats[modelId];
        stats.totalCalls++;
        stats.totalRevenue += model.feePerCall;
        stats.lastUsedTimestamp = block.timestamp;
        
        emit ModelUsed(modelId, user, model.feePerCall);
    }
    
    /**
     * @dev Get a model's metadata
     * @param modelId ID of the model
     * @return The model metadata
     */
    function getModel(uint256 modelId) external view returns (ModelMetadata memory) {
        require(models[modelId].id == modelId, "Model does not exist");
        return models[modelId];
    }
    
    /**
     * @dev Get models created by a specific address
     * @param creator Address of the creator
     * @return Array of model IDs created by the address
     */
    function getModelsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorModels[creator];
    }
    
    /**
     * @dev Get total models count
     * @return The total number of models registered
     */
    function getModelCount() external view returns (uint256) {
        return _modelIdCounter;
    }
    
    /**
     * @dev Grant MODEL_CREATOR_ROLE to an address
     * @param account Address to grant the role to
     */
    function addModelCreator(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(MODEL_CREATOR_ROLE, account);
    }
    
    /**
     * @dev Revoke MODEL_CREATOR_ROLE from an address
     * @param account Address to revoke the role from
     */
    function removeModelCreator(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(MODEL_CREATOR_ROLE, account);
    }
} 