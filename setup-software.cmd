@echo off
setlocal

echo [1/3] Installing backend dependencies...
cd /d "%~dp0backend"
call npm.cmd install
if errorlevel 1 goto :fail

echo [2/3] Installing web-admin dependencies...
cd /d "%~dp0web-admin"
call npm.cmd install
if errorlevel 1 goto :fail

echo [3/3] Installing mobile-employee dependencies...
cd /d "%~dp0mobile-employee"
call npm.cmd install
if errorlevel 1 goto :fail

echo.
echo Setup complete.
echo Next step: run "run-software.cmd"
exit /b 0

:fail
echo.
echo Setup failed. Check the error above.
exit /b 1
