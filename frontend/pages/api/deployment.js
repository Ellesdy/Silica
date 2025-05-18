import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const env = process.env.NEXT_PUBLIC_NETWORK || 'hardhat';
    let deploymentFile;
    
    if (env === 'sepolia') {
      // Use Sepolia testnet deployment
      deploymentFile = path.join(process.cwd(), '..', 'deployments', 'sepolia-latest.json');
    } else if (env === 'mainnet') {
      // Use Ethereum mainnet deployment
      deploymentFile = path.join(process.cwd(), '..', 'deployments', 'mainnet-latest.json');
    } else {
      // Default to local hardhat deployment
      deploymentFile = path.join(process.cwd(), '..', 'deployments', 'hardhat-latest.json');
    }
    
    // Check if deployment file exists
    if (fs.existsSync(deploymentFile)) {
      // Read and parse the deployment file
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      res.status(200).json(deploymentData);
    } else {
      // If deployment file doesn't exist, return mock addresses
      // This is primarily for development purposes
      res.status(200).json({
        network: env,
        timestamp: new Date().toISOString(),
        deployer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Hardhat default account
        contracts: {
          SilicaToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          SilicaTimelock: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
          SilicaTreasury: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
          SilicaAIOracle: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
          SilicaAIController: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
          SilicaModelRegistry: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
          SilicaExecutionEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'
        }
      });
    }
  } catch (error) {
    console.error('Error serving deployment addresses:', error);
    res.status(500).json({ error: 'Failed to load deployment addresses' });
  }
} 