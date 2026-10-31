@echo off
title Data Centre Water Simulation Launcher
echo ==============================================================
echo   3D Interactive Data Centre Water Consumption Simulation     
echo   Starting local server and opening web browser...            
echo ==============================================================

cd /d "%~dp0"
start "" powershell -WindowStyle Minimized -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
timeout /t 2 /nobreak >nul
start http://localhost:8080/
exit
