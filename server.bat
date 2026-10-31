@echo off
echo Starting Forest Dash Local Server on port 8080...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

