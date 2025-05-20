const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SilicaAIOracle", function () {
  let silicaAIOracle;
  let owner, provider1, provider2, user;

  beforeEach(async function () {
    [owner, provider1, provider2, user] = await ethers.getSigners();
    
    // Deploy the SilicaAIOracle contract
    const SilicaAIOracle = await ethers.getContractFactory("SilicaAIOracle");
    silicaAIOracle = await SilicaAIOracle.deploy();
    await silicaAIOracle.deployed();
  });

  describe("Roles and Permissions", function () {
    it("should grant default admin role to deployer", async function () {
      const adminRole = await silicaAIOracle.DEFAULT_ADMIN_ROLE();
      expect(await silicaAIOracle.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("should grant oracle provider role to deployer", async function () {
      const providerRole = await silicaAIOracle.ORACLE_PROVIDER_ROLE();
      expect(await silicaAIOracle.hasRole(providerRole, owner.address)).to.be.true;
    });

    it("should be able to add a new oracle provider", async function () {
      const providerRole = await silicaAIOracle.ORACLE_PROVIDER_ROLE();
      await silicaAIOracle.addOracleProvider(provider1.address);
      expect(await silicaAIOracle.hasRole(providerRole, provider1.address)).to.be.true;
    });

    it("should be able to remove an oracle provider", async function () {
      const providerRole = await silicaAIOracle.ORACLE_PROVIDER_ROLE();
      await silicaAIOracle.addOracleProvider(provider1.address);
      await silicaAIOracle.removeOracleProvider(provider1.address);
      expect(await silicaAIOracle.hasRole(providerRole, provider1.address)).to.be.false;
    });

    it("should revert when non-admin tries to add a provider", async function () {
      await expect(
        silicaAIOracle.connect(user).addOracleProvider(provider1.address)
      ).to.be.revertedWith(/AccessControl/);
    });
  });

  describe("Market Data Operations", function () {
    beforeEach(async function () {
      await silicaAIOracle.addSymbol("ETH/USD");
    });

    it("should add a new market symbol", async function () {
      await silicaAIOracle.addSymbol("BTC/USD");
      const symbols = await silicaAIOracle.getAllSymbols();
      expect(symbols).to.include("ETH/USD");
      expect(symbols).to.include("BTC/USD");
    });

    it("should not add a duplicate symbol", async function () {
      await silicaAIOracle.addSymbol("ETH/USD");
      const symbols = await silicaAIOracle.getAllSymbols();
      expect(symbols.length).to.equal(1);
      expect(symbols[0]).to.equal("ETH/USD");
    });

    it("should update market data correctly", async function () {
      const symbol = "ETH/USD";
      const price = ethers.utils.parseUnits("2000", 8); // 8 decimal places
      const sentiment = 75;
      const volatility = 30;
      const predictiveTrend = "bullish";

      await silicaAIOracle.updateMarketData(
        symbol,
        price,
        sentiment,
        volatility,
        predictiveTrend
      );

      const marketData = await silicaAIOracle.getMarketData(symbol);
      
      expect(marketData.symbol).to.equal(symbol);
      expect(marketData.price).to.equal(price);
      expect(marketData.sentiment).to.equal(sentiment);
      expect(marketData.volatility).to.equal(volatility);
      expect(marketData.predictiveTrend).to.equal(predictiveTrend);
    });

    it("should emit an event when market data is updated", async function () {
      const symbol = "ETH/USD";
      const price = ethers.utils.parseUnits("2000", 8);
      const sentiment = 75;
      const volatility = 30;
      const predictiveTrend = "bullish";

      await expect(
        silicaAIOracle.updateMarketData(
          symbol,
          price,
          sentiment,
          volatility,
          predictiveTrend
        )
      )
        .to.emit(silicaAIOracle, "MarketDataUpdated")
        .withArgs(symbol, price, sentiment, volatility);
    });

    it("should revert when sentiment is out of range", async function () {
      const symbol = "ETH/USD";
      const price = ethers.utils.parseUnits("2000", 8);
      const invalidSentiment = 101; // Outside valid range
      const volatility = 30;
      const predictiveTrend = "bullish";

      await expect(
        silicaAIOracle.updateMarketData(
          symbol,
          price,
          invalidSentiment,
          volatility,
          predictiveTrend
        )
      ).to.be.revertedWith("Sentiment out of range");
    });

    it("should revert when volatility is out of range", async function () {
      const symbol = "ETH/USD";
      const price = ethers.utils.parseUnits("2000", 8);
      const sentiment = 75;
      const invalidVolatility = 101; // Outside valid range
      const predictiveTrend = "bullish";

      await expect(
        silicaAIOracle.updateMarketData(
          symbol,
          price,
          sentiment,
          invalidVolatility,
          predictiveTrend
        )
      ).to.be.revertedWith("Volatility out of range");
    });
  });

  describe("AI Insights Operations", function () {
    beforeEach(async function () {
      await silicaAIOracle.addInsightType("market_prediction");
    });

    it("should add a new insight type", async function () {
      await silicaAIOracle.addInsightType("treasury_management");
      const insightTypes = await silicaAIOracle.getAllInsightTypes();
      expect(insightTypes).to.include("market_prediction");
      expect(insightTypes).to.include("treasury_management");
    });

    it("should not add a duplicate insight type", async function () {
      await silicaAIOracle.addInsightType("market_prediction");
      const insightTypes = await silicaAIOracle.getAllInsightTypes();
      expect(insightTypes.length).to.equal(1);
      expect(insightTypes[0]).to.equal("market_prediction");
    });

    it("should add an AI insight correctly", async function () {
      const insightType = "market_prediction";
      const summary = "ETH likely to rise in the next 24 hours";
      const data = '{"probability": 0.75, "timeframe": "24h"}';
      const confidence = 80;

      await silicaAIOracle.addAIInsight(
        insightType,
        summary,
        data,
        confidence
      );

      const insights = await silicaAIOracle.getInsightsByType(insightType, 0, 1);
      
      expect(insights.length).to.equal(1);
      expect(insights[0].insightType).to.equal(insightType);
      expect(insights[0].summary).to.equal(summary);
      expect(insights[0].data).to.equal(data);
      expect(insights[0].confidence).to.equal(confidence);
    });

    it("should emit an event when an AI insight is added", async function () {
      const insightType = "market_prediction";
      const summary = "ETH likely to rise in the next 24 hours";
      const data = '{"probability": 0.75, "timeframe": "24h"}';
      const confidence = 80;

      await expect(
        silicaAIOracle.addAIInsight(
          insightType,
          summary,
          data,
          confidence
        )
      )
        .to.emit(silicaAIOracle, "AIInsightAdded")
        .withArgs(insightType, summary, confidence);
    });

    it("should retrieve multiple insights with pagination", async function () {
      const insightType = "market_prediction";
      
      // Add 5 insights
      for (let i = 0; i < 5; i++) {
        await silicaAIOracle.addAIInsight(
          insightType,
          `Summary ${i}`,
          `Data ${i}`,
          80
        );
      }
      
      // Get insights from index 1 to 3
      const insights = await silicaAIOracle.getInsightsByType(insightType, 1, 3);
      
      expect(insights.length).to.equal(3);
      expect(insights[0].summary).to.equal("Summary 1");
      expect(insights[1].summary).to.equal("Summary 2");
      expect(insights[2].summary).to.equal("Summary 3");
    });

    it("should revert when confidence is out of range", async function () {
      const insightType = "market_prediction";
      const summary = "ETH likely to rise in the next 24 hours";
      const data = '{"probability": 0.75, "timeframe": "24h"}';
      const invalidConfidence = 101; // Outside valid range

      await expect(
        silicaAIOracle.addAIInsight(
          insightType,
          summary,
          data,
          invalidConfidence
        )
      ).to.be.revertedWith("Confidence out of range");
    });
  });

  describe("Economic Indicators Operations", function () {
    beforeEach(async function () {
      await silicaAIOracle.addEconomicIndicator("inflation");
    });

    it("should add a new economic indicator", async function () {
      await silicaAIOracle.addEconomicIndicator("interest_rate");
      const indicators = await silicaAIOracle.getAllEconomicIndicators();
      expect(indicators).to.include("inflation");
      expect(indicators).to.include("interest_rate");
    });

    it("should not add a duplicate economic indicator", async function () {
      await silicaAIOracle.addEconomicIndicator("inflation");
      const indicators = await silicaAIOracle.getAllEconomicIndicators();
      expect(indicators.length).to.equal(1);
      expect(indicators[0]).to.equal("inflation");
    });

    it("should update economic data correctly", async function () {
      const name = "inflation";
      const value = 350; // 3.5%
      const previousValue = 325; // 3.25%

      await silicaAIOracle.updateEconomicData(
        name,
        value,
        previousValue
      );

      const economicData = await silicaAIOracle.getEconomicData(name);
      
      expect(economicData.name).to.equal(name);
      expect(economicData.value).to.equal(value);
      expect(economicData.previousValue).to.equal(previousValue);
      // Change should be ((350 - 325) * 10000) / 325 = 769.23... (rounded to integer)
      expect(economicData.change).to.equal(769);
    });

    it("should handle zero previous value correctly", async function () {
      const name = "new_indicator";
      const value = 100;
      const previousValue = 0;

      await silicaAIOracle.addEconomicIndicator(name);
      await silicaAIOracle.updateEconomicData(
        name,
        value,
        previousValue
      );

      const economicData = await silicaAIOracle.getEconomicData(name);
      
      expect(economicData.change).to.equal(0);
    });

    it("should emit an event when economic data is updated", async function () {
      const name = "inflation";
      const value = 350;
      const previousValue = 325;

      await expect(
        silicaAIOracle.updateEconomicData(
          name,
          value,
          previousValue
        )
      )
        .to.emit(silicaAIOracle, "EconomicDataUpdated")
        .withArgs(name, value, 769); // Change calculated as before
    });
  });
});