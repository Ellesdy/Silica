@echo off
REM Check if a network parameter was provided
if "%~1"=="" (
  echo Please specify a network: hardhat, sepolia, or mainnet
  exit /b 1
)

REM Validate the network parameter
if not "%~1"=="hardhat" if not "%~1"=="sepolia" if not "%~1"=="mainnet" (
  echo Invalid network. Please use: hardhat, sepolia, or mainnet
  exit /b 1
)

REM Set the network in the frontend .env.local file
echo Switching to %~1 network...
echo # Network selection (hardhat, sepolia, mainnet)> frontend\.env.local
echo NEXT_PUBLIC_NETWORK=%~1>> frontend\.env.local
echo.>> frontend\.env.local
echo # API Keys>> frontend\.env.local
echo NEXT_PUBLIC_INFURA_API_KEY=0cc3bf12616446349bad4a9f1333c261>> frontend\.env.local

echo Network switched to %~1

REM Restart the frontend if requested
if "%~2"=="--restart" (
  echo Restarting frontend...
  
  REM Kill any frontend processes
  FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
    echo Killing process %%P using port 3000
    taskkill /PID %%P /F
  )
  
  REM Wait for process to terminate
  timeout /t 2 /nobreak > nul
  
  REM Start the frontend
  cd frontend && npm run dev
) else (
  echo To apply changes, restart the frontend with:
  echo cd frontend ^&^& npm run dev
)

exit /b 0 