@echo off
echo Checking for existing Next.js dev servers...

REM Find and kill any existing Node.js processes using ports 3000 and 3001
echo Killing processes using port 3000...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Found process %%P using port 3000, terminating...
  taskkill /PID %%P /F
)

echo Killing processes using port 3001...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') DO (
  echo Found process %%P using port 3001, terminating...
  taskkill /PID %%P /F
)

REM Sleep for 2 seconds to ensure processes are terminated
timeout /t 2 /nobreak > nul

REM Start the Next.js development server
echo Starting Next.js development server...
npm run dev 