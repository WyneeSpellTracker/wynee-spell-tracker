@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo =============================================
echo   WYNEE - PRUEBAS LOCALES DE FIRESTORE
echo   No conecta al Firebase real
echo =============================================
call npm install
if errorlevel 1 goto error
call npm test
if errorlevel 1 goto error
echo.
echo PRUEBAS COMPLETADAS. Revisa resultados anteriores.
pause
exit /b 0
:error
echo.
echo ERROR: Copia o captura el mensaje y mandalo al chat.
pause
exit /b 1
