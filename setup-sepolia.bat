@echo off
echo Setting up Silica for Sepolia testnet...

REM Create .env.local for frontend
echo Creating frontend/.env.local file...
(
echo # Network selection
echo NEXT_PUBLIC_NETWORK=sepolia
echo.
echo # Alchemy API key - Replace with your own key
echo NEXT_PUBLIC_ALCHEMY_API_KEY=
) > frontend\.env.local

echo Frontend configured for Sepolia.
echo.
echo IMPORTANT NEXT STEPS:
echo 1. Sign up for a free Alchemy account at https://www.alchemy.com
echo 2. Create a new app on Ethereum Sepolia network
echo 3. Copy your API key to frontend/.env.local
echo 4. Run "cd frontend && run-dev.bat" to start the frontend
echo.
echo For deployment to Sepolia:
echo 1. Create .env in the project root with your wallet private key
echo 2. Run "npx hardhat run scripts/deploy-sepolia.ts --network sepolia"
echo. 