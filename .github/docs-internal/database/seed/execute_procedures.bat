@echo off
echo ============================================
echo Installation Procedure Templates
echo ============================================
echo.

REM Récupérer les infos de connexion Supabase
set /p DB_HOST="Entrer DB Host (ex: db.xxx.supabase.co): "
set /p DB_NAME="Entrer DB Name (postgres): "
set /p DB_USER="Entrer DB User (postgres): "
set /p DB_PASS="Entrer DB Password: "

echo.
echo Connexion a la base...
echo.

REM Exécuter le fichier complet
psql "postgresql://%DB_USER%:%DB_PASS%@%DB_HOST%:5432/%DB_NAME%" -f seed_procedure_templates.sql

echo.
echo ============================================
echo Installation terminee
echo ============================================
pause
