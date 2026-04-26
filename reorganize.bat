@echo off
echo Reorganizing your project into 'frontend' and 'backend' folders...
if not exist frontend mkdir frontend

:: Move all frontend files into the new 'frontend' folder
move *.html frontend\
move *.css frontend\

echo.
echo ============================================================
echo Separation Complete! 
echo Your app is now neatly split into 'frontend' and 'backend'.
echo ============================================================
pause
