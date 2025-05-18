@echo off
echo Starting Silica development environment...

REM Kill any existing processes on relevant ports
echo Checking for existing processes...

REM Check for Hardhat node (port 8545)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8545 ^| findstr LISTENING') DO (
  echo Found process %%P using port 8545, terminating...
  taskkill /PID %%P /F
)

REM Check for Next.js server (ports 3000 and 3001)
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Found process %%P using port 3000, terminating...
  taskkill /PID %%P /F
)

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') DO (
  echo Found process %%P using port 3001, terminating...
  taskkill /PID %%P /F
)

REM Wait for processes to terminate
timeout /t 2 /nobreak > nul

REM Start Hardhat node in a new window
echo Starting Hardhat node in a new window...
start "Hardhat Node" cmd /k "npx hardhat node"

REM Wait for Hardhat to initialize before starting frontend
echo Waiting for Hardhat to initialize...
timeout /t 5 /nobreak > nul

REM Start Next.js development server
echo Starting Next.js development server...
cd frontend && npm run dev

echo Development environment is now running! 