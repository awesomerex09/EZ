@echo off
chcp 65001 > nul
echo ==============================================
echo  EZ Builder - GitHub Auto Updater
echo ==============================================
echo.

echo [1/3] Adding changes...
git add -A

echo [2/3] Committing changes...
git commit -m "chore: auto-update via batch script"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
if %errorlevel% neq 0 (
    echo [ERROR] Failed to push to GitHub.
) else (
    echo [SUCCESS] Successfully pushed to GitHub!
)
echo.
pause
