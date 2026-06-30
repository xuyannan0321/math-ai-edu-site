@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Math Website Dev Launcher
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found in PATH.
  echo Please install Node.js or fix PATH first.
  pause
  exit /b 1
)

if not exist "%~dp0tools\static-server.js" (
  echo ERROR: tools\static-server.js was not found.
  pause
  exit /b 1
)

echo Starting frontend on http://127.0.0.1:8000/ ...
start "Math Website Frontend" /D "%~dp0" cmd /k "node tools\static-server.js"

echo Waiting for frontend server...

set FRONTEND_OK=0
for /L %%i in (1,1,20) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 (
    set FRONTEND_OK=1
    goto frontend_ready
  )
  timeout /t 1 /nobreak >nul
)

:frontend_ready
if "%FRONTEND_OK%"=="0" (
  echo.
  echo ERROR: Frontend did not become ready at http://127.0.0.1:8000/
  echo Please check the separate window named:
  echo Math Website Frontend
  echo.
  pause
  exit /b 1
)

echo Frontend is ready.
echo Opening browser...
explorer.exe "http://127.0.0.1:8000/"

echo.
echo Starting backend on http://127.0.0.1:3001 ...

if exist "%~dp0server\package.json" (
  start "Math Website Backend" /D "%~dp0server" cmd /k "npm.cmd start"
) else (
  echo WARNING: server\package.json not found. Backend was not started.
)

echo Waiting for backend health check...

set BACKEND_OK=0
for /L %%i in (1,1,45) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 (
    set BACKEND_OK=1
    goto backend_ready
  )
  timeout /t 1 /nobreak >nul
)

:backend_ready
echo.
echo ========================================
echo Dev server status
echo ========================================
echo Frontend: READY  http://127.0.0.1:8000/

if "%BACKEND_OK%"=="1" (
  echo Backend:  READY  http://127.0.0.1:3001
) else (
  echo Backend:  FAILED http://127.0.0.1:3001
  echo.
  echo The page is open, but AI solving may not work.
  echo Please check the separate window named:
  echo Math Website Backend
)

echo.
echo Keep Backend and Frontend windows open.
echo If the page is blank, refresh the browser.
echo If AI solving fails, check the Backend window.
echo.
pause

endlocal
