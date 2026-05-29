@echo off
setlocal

echo Starting backend and web-admin...

start "attendance-backend" cmd /k "cd /d %~dp0backend && npm.cmd run dev"
start "attendance-web-admin" cmd /k "cd /d %~dp0web-admin && npm.cmd start"

echo.
echo Backend:    http://localhost:5000
echo Web Admin:  http://localhost:3000
echo.
echo Keep both opened terminal windows running.
exit /b 0
