@echo off
title FaradayBoard - Cabinet Faraday
cd /d "%~dp0"

echo ============================================
echo   FaradayBoard - Cabinet Faraday
echo ============================================
echo.

echo Verification de l'installation (peut prendre quelques minutes la premiere fois)...
call npm install --loglevel verbose > npm-install-log.txt 2>&1
if errorlevel 1 (
    echo.
    echo ERREUR pendant npm install. Verifiez que Node.js est bien installe.
    echo Details dans npm-install-log.txt
    pause
    exit /b
)

echo Generation du client Prisma...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERREUR pendant la generation du client Prisma.
    pause
    exit /b
)

IF NOT EXIST .setup_complete (
    call npx prisma migrate dev --name init
    call npm run db:seed
    echo ok > .setup_complete
)

echo.
echo Demarrage du serveur...
echo.

start "FaradayBoard - Serveur (NE PAS FERMER)" cmd /k "npm run dev"

echo Attente du demarrage du serveur, merci de patienter...
set count=0
:waitloop
set /a count+=1
powershell -Command "try { Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    if %count% GEQ 60 (
        echo.
        echo Le serveur met trop de temps a demarrer.
        echo Regardez la fenetre "FaradayBoard - Serveur" pour voir s'il y a une erreur.
        pause
        exit /b
    )
    timeout /t 2 >nul
    goto waitloop
)

echo.
echo Le serveur est pret ! Ouverture du site...
start "" "http://localhost:3000"
echo.
echo Le site est maintenant ouvert dans votre navigateur a l'adresse http://localhost:3000
echo Ne fermez pas la fenetre "FaradayBoard - Serveur" tant que vous utilisez l'application.
echo Vous pouvez fermer cette fenetre-ci.
echo.
pause
