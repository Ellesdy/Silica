# Silica Deployment Guide

This guide provides detailed instructions for deploying the Silica platform to testnets and mainnet.

## Prerequisites

1. **Environment Setup**
   - Node.js (v16+) and npm installed
   - Git repository cloned
   - Dependencies installed (`npm install` in root and frontend directories)

2. **API Keys**
   - Infura or Alchemy API key
   - Etherscan API key for contract verification

3. **Wallet**
   - Ethereum wallet with private key
   - Sufficient ETH for deployment (~0.5 ETH recommended)

## Environment Configuration

1. Create a `.env` file in the project root with:
   ```
   PRIVATE_KEY=your_wallet_private_key
   ETHEREUM_API_KEY=your_infura_or_alchemy_api_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

2. Create a `.env.local` file in the frontend directory with:
   ```
   # Network selection (hardhat, sepolia, mainnet)
   NEXT_PUBLIC_NETWORK=sepolia
   NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
   ```

## Testnet Deployment (Sepolia)

### 1. Deploy Smart Contracts

```bash
# From project root
npx hardhat compile
HARDHAT_NETWORK=sepolia npx hardhat run scripts/deploy-sepolia.ts
```

This script will:
- Deploy all contracts (Token, Timelock, Treasury, Oracle, Controller, ModelRegistry, ExecutionEngine)
- Configure their relationships
- Save deployment addresses to `deployments/sepolia-latest.json`

### 2. Verify Contracts on Etherscan

```bash
HARDHAT_NETWORK=sepolia npx hardhat run scripts/verify-contracts.ts
```

This verifies all contracts on Etherscan for transparency and ease of interaction.

### 3. Configure Frontend for Testnet

Ensure the frontend `.env.local` file has:
```
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
```

### 4. Test the Deployment

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Connect MetaMask to Sepolia network
3. Import the Silica token to MetaMask (using token address from deployment)
4. Test all functionality:
   - Register an AI model
   - Execute an inference request
   - Register as a compute provider
   - Complete a request

## Mainnet Deployment

### 1. Audit Preparation

Before deploying to mainnet:
- Complete all testnet testing
- Address any bugs or issues found
- Have contracts professionally audited
- Prepare token economics and distribution plans

### 2. Deploy Smart Contracts

```bash
# From project root
HARDHAT_NETWORK=mainnet npx hardhat run scripts/deploy-sepolia.ts
```

### 3. Verify Contracts on Etherscan

```bash
HARDHAT_NETWORK=mainnet npx hardhat run scripts/verify-contracts.ts
```

### 4. Configure Frontend for Mainnet

Update the frontend `.env.local` file to use mainnet:
```
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
```

### 5. Production Frontend Deployment

For production, deploy the frontend to a reliable hosting service:

```bash
cd frontend
npm run build
```

Deploy the built output to your hosting service (Vercel, AWS, etc.)

## Post-Deployment Steps

1. **Contract Ownership**
   - Transfer ownership to a secure multisig wallet
   - Implement governance mechanisms

2. **Token Distribution**
   - Execute token distribution plan
   - Add liquidity to exchanges if needed

3. **Documentation & Support**
   - Publish comprehensive user docs
   - Set up support channels

4. **Marketing & Community**
   - Announce the launch
   - Engage with the community

## Troubleshooting

### Common Issues

1. **Failed Transactions**
   - Check gas price and limit
   - Ensure sufficient ETH balance

2. **Contract Verification Failures**
   - Ensure constructor arguments match exactly
   - Verify compiler version and settings

3. **Frontend Connection Issues**
   - Confirm API keys are valid
   - Check network configuration in `.env.local`
   - Ensure `.env.local` changes are reflected (restart dev server)

### Support Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com)
- [Wagmi Documentation](https://wagmi.sh/) 