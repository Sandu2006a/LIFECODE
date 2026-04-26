@echo off
title LIFECODE Dev Server
echo.
echo  ================================
echo   LIFECODE - Pornire server...
echo  ================================
echo.
echo  Dupa ce apare QR code-ul, scaneaza-l
echo  cu camera iPhone-ului in Expo Go.
echo.
cd /d "%~dp0"
npx expo start
pause
