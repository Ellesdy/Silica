@echo off
echo Deploying contracts to Sepolia...

echo.
echo IMPORTANT: Make sure your .env file has the following set:
echo - PRIVATE_KEY: Your wallet private key
echo - INFURA_API_KEY: Your Infura API key (already set)
echo - ETHERSCAN_API_KEY: Your Etherscan API key (for verification)
echo.

REM Check if private key is set
findstr /C:"PRIVATE_KEY=" .env > nul
if %errorlevel% neq 0 (
  echo ERROR: PRIVATE_KEY not found in .env file
  echo Please add your private key to the .env file
  exit /b 1
)

REM Check if Infura API key is set
findstr /C:"INFURA_API_KEY=" .env > nul
if %errorlevel% neq 0 (
  echo ERROR: INFURA_API_KEY not found in .env file
  echo Please add your Infura API key to the .env file
  exit /b 1
)

REM Deploy the contracts
echo.
echo Starting deployment...
npx hardhat run scripts/deploy-sepolia.ts --network sepolia

REM Verify the contracts if ETHERSCAN_API_KEY is set
findstr /C:"ETHERSCAN_API_KEY=" .env > nul
if %errorlevel% neq 0 (
  echo.
  echo WARNING: ETHERSCAN_API_KEY not found in .env file
  echo Skipping contract verification
) else (
  echo.
  echo Verifying contracts on Etherscan...
  npx hardhat run scripts/verify-contracts.ts --network sepolia
)

REM Switch the frontend to Sepolia
echo.
echo Switching frontend to Sepolia network...
call switch-network.bat sepolia

echo.
echo Deployment completed!
echo To start the frontend with Sepolia connection:
echo cd frontend ^&^& npm run dev

exit /b 0 