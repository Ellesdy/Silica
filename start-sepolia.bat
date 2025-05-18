@echo off
echo Setting up Silica for Sepolia testnet...

REM Create .env.local for frontend
echo Creating frontend/.env.local file...
(
echo # Network selection
echo NEXT_PUBLIC_NETWORK=sepolia
) > frontend\.env.local

echo.
echo Frontend configured for Sepolia using the public RPC endpoint.
echo.
echo Starting the frontend...
echo.

REM Kill existing processes on ports 3000 and 3001
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Killing process %%P using port 3000
  taskkill /PID %%P /F
)

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') DO (
  echo Killing process %%P using port 3001
  taskkill /PID %%P /F
)

REM Wait for processes to terminate
timeout /t 2 /nobreak > nul

REM Start the frontend
cd frontend && npm run dev 