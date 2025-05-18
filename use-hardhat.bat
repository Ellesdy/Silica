@echo off
echo Switching to Hardhat local development network...

REM Update .env.local
echo # Network selection (hardhat, sepolia, mainnet)> frontend\.env.local
echo NEXT_PUBLIC_NETWORK=hardhat>> frontend\.env.local

echo Environment configured for Hardhat network

REM Kill processes if any
echo Stopping any running processes...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Killing process %%P using port 3000
  taskkill /PID %%P /F
)

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8545 ^| findstr LISTENING') DO (
  echo Killing process %%P using port 8545
  taskkill /PID %%P /F
)

REM Wait for processes to terminate
timeout /t 2 /nobreak > nul

REM Start Hardhat node in a new window
echo Starting Hardhat node...
start "Hardhat Node" cmd /k "npx hardhat node"

REM Wait for hardhat to initialize
echo Waiting for Hardhat to initialize...
timeout /t 5 /nobreak > nul

REM Deploy contracts if needed
echo Deploying contracts to Hardhat...
npx hardhat run scripts/deploy-hardhat.ts --network hardhat

REM Start the frontend
echo Starting frontend...
cd frontend && npm run dev 