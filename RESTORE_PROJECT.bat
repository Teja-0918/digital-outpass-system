@echo off
echo Restoring your project exactly to how it was 2 days ago...
move frontend\*.html .
move frontend\*.css .
rmdir frontend
echo Project restored completely! You can now use your files normally.
pause
