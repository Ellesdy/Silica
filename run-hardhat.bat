@echo off
echo Starting Hardhat node...

REM Kill any existing processes on port 8545 (Hardhat's default port)
echo Checking for existing Hardhat node...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8545 ^| findstr LISTENING') DO (
  echo Found process %%P using port 8545, terminating...
  taskkill /PID %%P /F
)

REM Wait for processes to terminate
timeout /t 2 /nobreak > nul

REM Start Hardhat node
echo Starting Hardhat node...
npx hardhat node 