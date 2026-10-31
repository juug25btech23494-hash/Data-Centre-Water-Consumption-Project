@echo off
title Data Centre Water Simulation Launcher
echo Starting 3D Data Centre Water Simulation...
cd /d "%~dp0datacenter-simulation"
call "%~dp0datacenter-simulation\start-simulation.bat"
