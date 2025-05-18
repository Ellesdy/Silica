@echo off
echo Switching to Sepolia testnet...

REM Update .env.local
echo # Network selection (hardhat, sepolia, mainnet)> frontend\.env.local
echo NEXT_PUBLIC_NETWORK=sepolia>> frontend\.env.local

echo Environment configured for Sepolia testnet

REM Kill processes if any
echo Stopping any running processes...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Killing process %%P using port 3000
  taskkill /PID %%P /F
)

REM Wait for processes to terminate
timeout /t 2 /nobreak > nul

REM Check if deployment exists
if not exist deployments\sepolia-latest.json (
  echo No Sepolia deployment found.
  echo You may need to deploy your contracts first:
  echo npx hardhat run scripts/deploy-sepolia.ts --network sepolia
  echo.
  echo Press any key to continue anyway...
  pause > nul
)

REM Start the frontend
echo Starting frontend...
cd frontend && npm run dev 