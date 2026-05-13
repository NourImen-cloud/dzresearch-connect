@echo off
echo.
echo  DzResearch Connect ^- Frontend
echo  Starting at http://localhost:3000
echo.
cd /d "%~dp0"
node node_modules/vite/bin/vite.js
