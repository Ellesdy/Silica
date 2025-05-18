// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SilicaModelRegistry.sol";
import "./SilicaToken.sol";
import "./SilicaTreasury.sol";

/**
 * @title SilicaExecutionEngine
 * @dev Handles AI model execution requests and payment distribution
 */
contract SilicaExecutionEngine is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant COMPUTE_PROVIDER_ROLE = keccak256("COMPUTE_PROVIDER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // State variables
    SilicaModelRegistry public modelRegistry;
    SilicaToken public silicaToken;
    SilicaTreasury public treasury;
    
    // Request status
    enum RequestStatus { Pending, Processing, Completed, Failed, Disputed }
    
    // Inference request
    struct InferenceRequest {
        uint256 id;
        uint256 modelId;
        address requester;
        address computeProvider;
        string inputData;
        string outputData;
        uint256 fee;
        uint256 createdAt;
        uint256 completedAt;
        RequestStatus status;
    }
    
    // Payment distribution
    struct PaymentDistribution {
        uint256 creatorShare; // Percentage for model creator (in basis points, e.g. 7000 = 70%)
        uint256 providerShare; // Percentage for compute provider (in basis points, e.g. 2000 = 20%)
        uint256 protocolShare; // Percentage for protocol treasury (in basis points, e.g. 1000 = 10%)
    }
    
    // Compute provider profile
    struct ComputeProvider {
        address providerAddress;
        string name;
        string endpoint;
        bool isActive;
        uint256 capacityGPUs;
        uint256 totalRequests;
        uint256 successfulRequests;
        uint256 failedRequests;
        uint256 stakedAmount;
    }
    
    // State variables
    uint256 private _requestIdCounter;
    mapping(uint256 => InferenceRequest) public requests;
    mapping(address => uint256[]) public userRequests;
    mapping(address => ComputeProvider) public computeProviders;
    mapping(address => uint256[]) public providerRequests;
    
    PaymentDistribution public paymentDistribution;
    
    // Minimum stake required to become a compute provider (in SIL tokens)
    uint256 public minimumStake;
    
    // Events
    event RequestCreated(uint256 indexed requestId, uint256 indexed modelId, address indexed requester);
    event RequestAssigned(uint256 indexed requestId, address indexed computeProvider);
    event RequestCompleted(uint256 indexed requestId, string outputDataHash);
    event RequestFailed(uint256 indexed requestId, string reason);
    event RequestDisputed(uint256 indexed requestId, string reason);
    event ComputeProviderRegistered(address indexed provider, string name, string endpoint);
    event ComputeProviderUpdated(address indexed provider, bool isActive, uint256 capacityGPUs);
    event ComputeProviderStaked(address indexed provider, uint256 amount);
    event ComputeProviderUnstaked(address indexed provider, uint256 amount);
    event PaymentDistributionUpdated(uint256 creatorShare, uint256 providerShare, uint256 protocolShare);
    
    constructor(
        address _modelRegistry,
        address _silicaToken,
        address payable _treasury
    ) {
        modelRegistry = SilicaModelRegistry(_modelRegistry);
        silicaToken = SilicaToken(_silicaToken);
        treasury = SilicaTreasury(payable(_treasury));
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Default payment distribution: 70% to creator, 20% to provider, 10% to protocol
        paymentDistribution = PaymentDistribution({
            creatorShare: 7000,
            providerShare: 2000,
            protocolShare: 1000
        });
        
        // Default minimum stake: 1000 SIL tokens
        minimumStake = 1000 * 10**18;
    }
    
    /**
     * @dev Create a new inference request
     * @param modelId ID of the model to use
     * @param inputData Input data for the model (or hash/URI pointing to data)
     * @return The ID of the new request
     */
    function createRequest(uint256 modelId, string calldata inputData) external payable nonReentrant returns (uint256) {
        // Get model details
        SilicaModelRegistry.ModelMetadata memory model = modelRegistry.getModel(modelId);
        require(model.isActive, "Model is not active");
        
        // Check payment
        uint256 fee = model.feePerCall;
        require(msg.value >= fee, "Insufficient payment");
        
        // Create request
        uint256 requestId = _requestIdCounter++;
        
        requests[requestId] = InferenceRequest({
            id: requestId,
            modelId: modelId,
            requester: msg.sender,
            computeProvider: address(0),
            inputData: inputData,
            outputData: "",
            fee: fee,
            createdAt: block.timestamp,
            completedAt: 0,
            status: RequestStatus.Pending
        });
        
        userRequests[msg.sender].push(requestId);
        
        // Record model usage
        modelRegistry.recordModelUsage(modelId, msg.sender, address(0));
        
        emit RequestCreated(requestId, modelId, msg.sender);
        
        // Refund excess payment
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
        
        return requestId;
    }
    
    /**
     * @dev Assign a request to a compute provider
     * @param requestId ID of the request
     */
    function assignRequest(uint256 requestId) external onlyRole(COMPUTE_PROVIDER_ROLE) {
        InferenceRequest storage request = requests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request not pending");
        
        ComputeProvider storage provider = computeProviders[msg.sender];
        require(provider.isActive, "Provider not active");
        
        // Assign request to provider
        request.computeProvider = msg.sender;
        request.status = RequestStatus.Processing;
        
        providerRequests[msg.sender].push(requestId);
        provider.totalRequests++;
        
        emit RequestAssigned(requestId, msg.sender);
    }
    
    /**
     * @dev Complete a request with result
     * @param requestId ID of the request
     * @param outputData Result data from model execution
     */
    function completeRequest(uint256 requestId, string calldata outputData) external nonReentrant {
        InferenceRequest storage request = requests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(request.status == RequestStatus.Processing, "Request not processing");
        require(request.computeProvider == msg.sender, "Not assigned to you");
        
        // Update request
        request.outputData = outputData;
        request.completedAt = block.timestamp;
        request.status = RequestStatus.Completed;
        
        // Update provider stats
        ComputeProvider storage provider = computeProviders[msg.sender];
        provider.successfulRequests++;
        
        // Distribute payment
        _distributePayment(requestId);
        
        emit RequestCompleted(requestId, outputData);
    }
    
    /**
     * @dev Mark a request as failed
     * @param requestId ID of the request
     * @param reason Reason for failure
     */
    function failRequest(uint256 requestId, string calldata reason) external {
        InferenceRequest storage request = requests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(request.status == RequestStatus.Processing, "Request not processing");
        require(request.computeProvider == msg.sender, "Not assigned to you");
        
        // Update request
        request.status = RequestStatus.Failed;
        
        // Update provider stats
        ComputeProvider storage provider = computeProviders[msg.sender];
        provider.failedRequests++;
        
        // Refund payment to requester
        payable(request.requester).transfer(request.fee);
        
        emit RequestFailed(requestId, reason);
    }
    
    /**
     * @dev Dispute a completed request
     * @param requestId ID of the request
     * @param reason Reason for dispute
     */
    function disputeRequest(uint256 requestId, string calldata reason) external {
        InferenceRequest storage request = requests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(request.status == RequestStatus.Completed, "Request not completed");
        require(request.requester == msg.sender, "Not your request");
        
        // Mark as disputed
        request.status = RequestStatus.Disputed;
        
        emit RequestDisputed(requestId, reason);
        
        // Note: Dispute resolution would be handled off-chain or via a separate contract
    }
    
    /**
     * @dev Register as a compute provider
     * @param name Provider name
     * @param endpoint Provider API endpoint
     * @param capacityGPUs Number of GPUs available
     * @param stakeAmount Amount of SIL tokens to stake
     */
    function registerComputeProvider(
        string calldata name,
        string calldata endpoint,
        uint256 capacityGPUs,
        uint256 stakeAmount
    ) external nonReentrant {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(endpoint).length > 0, "Endpoint cannot be empty");
        require(stakeAmount >= minimumStake, "Insufficient stake");
        
        // Transfer tokens from provider to this contract
        silicaToken.transferFrom(msg.sender, address(this), stakeAmount);
        
        // Register provider
        computeProviders[msg.sender] = ComputeProvider({
            providerAddress: msg.sender,
            name: name,
            endpoint: endpoint,
            isActive: true,
            capacityGPUs: capacityGPUs,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            stakedAmount: stakeAmount
        });
        
        // Grant provider role
        _grantRole(COMPUTE_PROVIDER_ROLE, msg.sender);
        
        emit ComputeProviderRegistered(msg.sender, name, endpoint);
    }
    
    /**
     * @dev Update compute provider details
     * @param isActive Active status
     * @param capacityGPUs Updated GPU capacity
     * @param endpoint Updated API endpoint
     */
    function updateComputeProvider(
        bool isActive,
        uint256 capacityGPUs,
        string calldata endpoint
    ) external {
        ComputeProvider storage provider = computeProviders[msg.sender];
        require(provider.providerAddress == msg.sender, "Not registered");
        
        provider.isActive = isActive;
        provider.capacityGPUs = capacityGPUs;
        provider.endpoint = endpoint;
        
        emit ComputeProviderUpdated(msg.sender, isActive, capacityGPUs);
    }
    
    /**
     * @dev Add stake for a compute provider
     * @param amount Amount to add to stake
     */
    function addStake(uint256 amount) external nonReentrant {
        ComputeProvider storage provider = computeProviders[msg.sender];
        require(provider.providerAddress == msg.sender, "Not registered");
        
        // Transfer tokens from provider to this contract
        silicaToken.transferFrom(msg.sender, address(this), amount);
        
        // Update stake
        provider.stakedAmount += amount;
        
        emit ComputeProviderStaked(msg.sender, amount);
    }
    
    /**
     * @dev Remove stake (only if provider is inactive)
     * @param amount Amount to withdraw
     */
    function removeStake(uint256 amount) external nonReentrant {
        ComputeProvider storage provider = computeProviders[msg.sender];
        require(provider.providerAddress == msg.sender, "Not registered");
        require(!provider.isActive, "Provider must be inactive");
        require(amount <= provider.stakedAmount, "Insufficient stake");
        
        // Update stake
        provider.stakedAmount -= amount;
        
        // Transfer tokens back to provider
        silicaToken.transfer(msg.sender, amount);
        
        emit ComputeProviderUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Get requests for a user
     * @param user Address of the user
     * @return Array of request IDs
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }
    
    /**
     * @dev Get requests assigned to a provider
     * @param provider Address of the provider
     * @return Array of request IDs
     */
    function getProviderRequests(address provider) external view returns (uint256[] memory) {
        return providerRequests[provider];
    }
    
    /**
     * @dev Update payment distribution percentages
     * @param _creatorShare Percentage for creator (in basis points)
     * @param _providerShare Percentage for compute provider (in basis points)
     * @param _protocolShare Percentage for protocol (in basis points)
     */
    function updatePaymentDistribution(
        uint256 _creatorShare,
        uint256 _providerShare,
        uint256 _protocolShare
    ) external onlyRole(ADMIN_ROLE) {
        require(_creatorShare + _providerShare + _protocolShare == 10000, "Shares must total 100%");
        
        paymentDistribution.creatorShare = _creatorShare;
        paymentDistribution.providerShare = _providerShare;
        paymentDistribution.protocolShare = _protocolShare;
        
        emit PaymentDistributionUpdated(_creatorShare, _providerShare, _protocolShare);
    }
    
    /**
     * @dev Update minimum stake requirement
     * @param _minimumStake New minimum stake amount
     */
    function updateMinimumStake(uint256 _minimumStake) external onlyRole(ADMIN_ROLE) {
        minimumStake = _minimumStake;
    }
    
    /**
     * @dev Internal function to distribute payment after request completion
     * @param requestId ID of the completed request
     */
    function _distributePayment(uint256 requestId) internal {
        InferenceRequest storage request = requests[requestId];
        SilicaModelRegistry.ModelMetadata memory model = modelRegistry.getModel(request.modelId);
        
        uint256 fee = request.fee;
        
        // Calculate shares
        uint256 creatorAmount = (fee * paymentDistribution.creatorShare) / 10000;
        uint256 providerAmount = (fee * paymentDistribution.providerShare) / 10000;
        uint256 protocolAmount = (fee * paymentDistribution.protocolShare) / 10000;
        
        // Distribute payments
        payable(model.creator).transfer(creatorAmount);
        payable(request.computeProvider).transfer(providerAmount);
        payable(address(treasury)).transfer(protocolAmount);
    }
} 