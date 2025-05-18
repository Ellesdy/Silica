// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SilicaAIOracle
 * @dev Oracle contract that brings AI-generated insights on-chain
 */
contract SilicaAIOracle is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_PROVIDER_ROLE = keccak256("ORACLE_PROVIDER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Market data
    struct MarketData {
        uint256 timestamp;
        string symbol;
        uint256 price;  // Price in USD with 8 decimals
        int256 sentiment; // -100 to 100 (very negative to very positive)
        uint256 volatility; // 0-100 scale
        string predictiveTrend; // "bullish", "bearish", "neutral", etc.
    }
    
    // AI insights
    struct AIInsight {
        uint256 timestamp;
        string insightType; // "market_prediction", "treasury_management", "tokenomics", etc.
        string summary;
        string data; // JSON or other structured data
        uint256 confidence; // 0-100 scale
    }
    
    // Economic indicators
    struct EconomicIndicator {
        uint256 timestamp;
        string name; // "inflation", "interest_rate", "unemployment", etc.
        int256 value; // Value with appropriate decimal precision
        int256 previousValue;
        int256 change; // Change percentage or absolute
    }
    
    // Storage
    mapping(string => MarketData) public latestMarketData;
    mapping(string => AIInsight[]) public insightsByType;
    mapping(string => EconomicIndicator) public latestEconomicData;
    
    string[] public trackingSymbols;
    string[] public insightTypes;
    string[] public economicIndicators;
    
    // Events
    event MarketDataUpdated(string symbol, uint256 price, int256 sentiment, uint256 volatility);
    event AIInsightAdded(string insightType, string summary, uint256 confidence);
    event EconomicDataUpdated(string name, int256 value, int256 change);
    event SymbolAdded(string symbol);
    event InsightTypeAdded(string insightType);
    event EconomicIndicatorAdded(string name);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_PROVIDER_ROLE, msg.sender); // Initially granted to deployer
    }
    
    /**
     * @dev Add a new market symbol to track
     * @param symbol The market symbol (e.g., "ETH/USD")
     */
    function addSymbol(string calldata symbol) external onlyRole(ADMIN_ROLE) {
        bool exists = false;
        for (uint i = 0; i < trackingSymbols.length; i++) {
            if (keccak256(bytes(trackingSymbols[i])) == keccak256(bytes(symbol))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            trackingSymbols.push(symbol);
            emit SymbolAdded(symbol);
        }
    }
    
    /**
     * @dev Add a new insight type to track
     * @param insightType The insight type
     */
    function addInsightType(string calldata insightType) external onlyRole(ADMIN_ROLE) {
        bool exists = false;
        for (uint i = 0; i < insightTypes.length; i++) {
            if (keccak256(bytes(insightTypes[i])) == keccak256(bytes(insightType))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            insightTypes.push(insightType);
            emit InsightTypeAdded(insightType);
        }
    }
    
    /**
     * @dev Add a new economic indicator to track
     * @param name The indicator name
     */
    function addEconomicIndicator(string calldata name) external onlyRole(ADMIN_ROLE) {
        bool exists = false;
        for (uint i = 0; i < economicIndicators.length; i++) {
            if (keccak256(bytes(economicIndicators[i])) == keccak256(bytes(name))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            economicIndicators.push(name);
            emit EconomicIndicatorAdded(name);
        }
    }
    
    /**
     * @dev Update market data for a symbol
     * @param symbol The market symbol
     * @param price The current price (8 decimals)
     * @param sentiment The market sentiment (-100 to 100)
     * @param volatility The volatility (0-100)
     * @param predictiveTrend The predicted trend
     */
    function updateMarketData(
        string calldata symbol,
        uint256 price,
        int256 sentiment,
        uint256 volatility,
        string calldata predictiveTrend
    ) external onlyRole(ORACLE_PROVIDER_ROLE) {
        require(sentiment >= -100 && sentiment <= 100, "Sentiment out of range");
        require(volatility <= 100, "Volatility out of range");
        
        latestMarketData[symbol] = MarketData({
            timestamp: block.timestamp,
            symbol: symbol,
            price: price,
            sentiment: sentiment,
            volatility: volatility,
            predictiveTrend: predictiveTrend
        });
        
        emit MarketDataUpdated(symbol, price, sentiment, volatility);
    }
    
    /**
     * @dev Add an AI insight
     * @param insightType The type of insight
     * @param summary A human-readable summary
     * @param data Structured data in JSON or other format
     * @param confidence The confidence level (0-100)
     */
    function addAIInsight(
        string calldata insightType,
        string calldata summary,
        string calldata data,
        uint256 confidence
    ) external onlyRole(ORACLE_PROVIDER_ROLE) {
        require(confidence <= 100, "Confidence out of range");
        
        AIInsight memory insight = AIInsight({
            timestamp: block.timestamp,
            insightType: insightType,
            summary: summary,
            data: data,
            confidence: confidence
        });
        
        insightsByType[insightType].push(insight);
        
        emit AIInsightAdded(insightType, summary, confidence);
    }
    
    /**
     * @dev Update economic indicator data
     * @param name The indicator name
     * @param value The current value
     * @param previousValue The previous value
     */
    function updateEconomicData(
        string calldata name,
        int256 value,
        int256 previousValue
    ) external onlyRole(ORACLE_PROVIDER_ROLE) {
        int256 change;
        if (previousValue != 0) {
            // Calculate percentage change
            change = ((value - previousValue) * 10000) / previousValue; // Basis points (1/100 of a percent)
        } else {
            change = 0;
        }
        
        latestEconomicData[name] = EconomicIndicator({
            timestamp: block.timestamp,
            name: name,
            value: value,
            previousValue: previousValue,
            change: change
        });
        
        emit EconomicDataUpdated(name, value, change);
    }
    
    /**
     * @dev Get the latest market data for a symbol
     * @param symbol The market symbol
     * @return The MarketData struct
     */
    function getMarketData(string calldata symbol) external view returns (MarketData memory) {
        return latestMarketData[symbol];
    }
    
    /**
     * @dev Get AI insights by type (with pagination)
     * @param insightType The insight type
     * @param start The starting index
     * @param count The number of items to return
     * @return Array of AIInsight structs
     */
    function getInsightsByType(
        string calldata insightType, 
        uint256 start, 
        uint256 count
    ) external view returns (AIInsight[] memory) {
        AIInsight[] storage insights = insightsByType[insightType];
        require(start < insights.length, "Start index out of range");
        
        uint256 end = start + count;
        if (end > insights.length) {
            end = insights.length;
        }
        
        AIInsight[] memory result = new AIInsight[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = insights[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get the latest economic data for an indicator
     * @param name The indicator name
     * @return The EconomicIndicator struct
     */
    function getEconomicData(string calldata name) external view returns (EconomicIndicator memory) {
        return latestEconomicData[name];
    }
    
    /**
     * @dev Get all tracking symbols
     * @return Array of symbol strings
     */
    function getAllSymbols() external view returns (string[] memory) {
        return trackingSymbols;
    }
    
    /**
     * @dev Get all insight types
     * @return Array of insight type strings
     */
    function getAllInsightTypes() external view returns (string[] memory) {
        return insightTypes;
    }
    
    /**
     * @dev Get all economic indicators
     * @return Array of indicator name strings
     */
    function getAllEconomicIndicators() external view returns (string[] memory) {
        return economicIndicators;
    }
    
    /**
     * @dev Add an oracle provider
     * @param provider The provider address
     */
    function addOracleProvider(address provider) external onlyRole(ADMIN_ROLE) {
        _grantRole(ORACLE_PROVIDER_ROLE, provider);
    }
    
    /**
     * @dev Remove an oracle provider
     * @param provider The provider address
     */
    function removeOracleProvider(address provider) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ORACLE_PROVIDER_ROLE, provider);
    }
} 