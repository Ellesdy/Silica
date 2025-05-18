# Silica Project

## ⚠️ Important: Deploying with Infura

The project is now configured to use Infura for RPC endpoints:

1. **Infura API Key**:
   - We're using Infura with the API key: `a6be77449547434288decfd6d97d5caf`
   - This key is already configured in all environment files

2. **Environment Files**:
   - `.env`: Main environment file with Infura settings
   - `.env.sepolia`: Sepolia-specific environment
   - `frontend/.env.local`: Frontend configuration using Infura

3. **Deploy to Sepolia**:
   ```
   deploy-to-sepolia.bat
   ```

4. **Start the frontend**:
   ```
   cd frontend && npm run dev
   ```

---

## Environment Variables (Infura)

### Backend/Contracts (.env or .env.sepolia)
```
PRIVATE_KEY=your_private_key
INFURA_API_KEY=a6be77449547434288decfd6d97d5caf
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/a6be77449547434288decfd6d97d5caf
MAINNET_RPC_URL=https://mainnet.infura.io/v3/a6be77449547434288decfd6d97d5caf
# Optional for scripts/AI Oracle
AI_API_KEY=your_ai_api_key
ALPHAVANTAGE_API_KEY=your_alphavantage_api_key
ORACLE_ADDRESS=your_oracle_contract_address
RPC_URL=https://sepolia.infura.io/v3/a6be77449547434288decfd6d97d5caf
CURRENT_NETWORK=sepolia
```

### Frontend (frontend/.env.local)
```
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_INFURA_API_KEY=a6be77449547434288decfd6d97d5caf
```

---

# Silica

Silica is an AI tools development platform built on Ethereum that enables users to create, share, and monetize AI models. The platform handles computation, payments, and governance in a decentralized manner.

## Core Value Proposition

- **Create and monetize AI tools** - Deploy AI models on-chain and earn fees when others use them
- **Use AI tools with simple interactions** - Access powerful AI capabilities through a user-friendly interface
- **Decentralized computation network** - A network of compute providers to run the models
- **Fair economics** - Transparent fee structure and revenue sharing
- **Governed by the community** - Token-based governance for protocol decisions

## Key Advantages Over VaderAI

1. **Modular Architecture** - Highly customizable platform for different AI use cases
2. **Developer-friendly SDK** - Easier onboarding for AI developers
3. **Optimized Execution** - Lower latency inference through compute optimization
4. **Fair Economics** - Transparent fee structure and revenue sharing
5. **Enhanced Security** - Multi-layer security for models and data
6. **Cross-chain Compatibility** - Support for multiple blockchain ecosystems

## Project Structure

- `contracts/`: Smart contracts for the Silica ecosystem
  - `SilicaToken.sol`: ERC20 token with governance capabilities
  - `SilicaGovernor.sol`: Governance contract for the DAO
  - `SilicaTimelock.sol`: Timelock controller for governance actions
  - `SilicaTreasury.sol`: Treasury management for the DAO
  - `SilicaAIController.sol`: AI decision-making controller
  - `SilicaAIOracle.sol`: Oracle for AI-generated market insights
  - `SilicaModelRegistry.sol`: Registry for AI models in the ecosystem
  - `SilicaExecutionEngine.sol`: Handles model execution requests and payments
  
- `scripts/`: Deployment and utility scripts
- `test/`: Smart contract tests
- `frontend/`: User interface with dashboard and AI marketplace

## Key Features

- **AI Tools Marketplace**: Discover, create, and use AI tools
- **On-Chain AI Registry**: Store model metadata and track usage on-chain
- **Decentralized Computation Network**: Stake tokens to become a compute provider
- **Fair Revenue Sharing**: Transparent distribution of fees between creators, compute providers, and protocol
- **DAO Governance**: Community control over protocol parameters and treasury

## Getting Started

### Prerequisites

- Node.js and npm
- An Ethereum wallet with testnet ETH
- MetaMask or other web3 wallet

### Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env` file with the following:
   ```
   PRIVATE_KEY=your_private_key
   ETHEREUM_API_KEY=your_infura_or_alchemy_api_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Development Environment

#### Starting the Complete Development Environment (Recommended)
```
start-dev-environment.bat
```
This will:
1. Shut down any existing processes using the required ports
2. Start a Hardhat node in a separate window
3. Start the Next.js frontend development server

#### Starting Individual Components
To start only the Hardhat node:
```
run-hardhat.bat
```

To start only the frontend:
```
cd frontend
run-dev.bat
```

#### Troubleshooting Port Issues
If you encounter port-in-use errors, you can manually terminate processes:
```
# For port 3000 (Next.js)
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# For port 8545 (Hardhat)
netstat -ano | findstr :8545
taskkill /PID [PID] /F
```

### Compilation

```
npx hardhat compile
```

### Testing

```
npx hardhat test
```

### Deployment

#### Local Development

```
npx hardhat node
npx hardhat run scripts/deploy-hardhat.ts --network hardhat
```

#### Testnet Deployment

Deploying to Sepolia testnet:

1. Make sure your `.env` file has the required keys
2. Deploy the contracts:
   ```
   npx hardhat run scripts/deploy-sepolia.ts --network sepolia
   ```