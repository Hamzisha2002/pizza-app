@echo off
REM Boss Pizza Mobile - Quick Deployment Script for Windows
REM Usage: deploy.bat [preview|production|apk]

setlocal enabledelayedexpansion

echo.
echo 🍕 Boss Pizza Mobile - Deployment Script
echo.

REM Check if logged in
echo Checking Expo login status...
npx expo whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Not logged in to Expo
    echo.
    echo Please login first:
    echo   npx expo login
    exit /b 1
)

for /f "delims=" %%i in ('npx expo whoami') do set USERNAME=%%i
echo ✅ Logged in as: %USERNAME%
echo.

REM Get deployment type from argument
set DEPLOY_TYPE=%1
if "%DEPLOY_TYPE%"=="" set DEPLOY_TYPE=preview

if "%DEPLOY_TYPE%"=="preview" (
    echo 📤 Publishing preview update to Expo cloud...
    npx eas update --branch preview --message "Preview update: %date% %time%"
    echo.
    echo ✅ Preview published successfully!
    echo 📱 To test, run: npx expo start --tunnel
    goto :end
)

if "%DEPLOY_TYPE%"=="production" (
    echo 📤 Publishing production update to Expo cloud...
    npx eas update --branch production --message "Production update: %date% %time%"
    echo.
    echo ✅ Production published successfully!
    goto :end
)

if "%DEPLOY_TYPE%"=="apk" (
    echo 🔨 Building preview APK...
    echo This will take 5-15 minutes...
    npx eas build --profile preview --platform android
    echo.
    echo ✅ APK build started!
    echo Monitor progress at: https://expo.dev
    goto :end
)

if "%DEPLOY_TYPE%"=="development" (
    echo 🔨 Building development APK...
    echo This will take 5-15 minutes...
    npx eas build --profile development --platform android
    echo.
    echo ✅ Development build started!
    echo Monitor progress at: https://expo.dev
    goto :end
)

REM Invalid option
echo ❌ Invalid deployment type: %DEPLOY_TYPE%
echo.
echo Usage: deploy.bat [preview^|production^|apk^|development]
echo.
echo Options:
echo   preview      - Publish update to preview channel (default)
echo   production   - Publish update to production channel
echo   apk          - Build installable APK for Android
echo   development  - Build development APK with debug features
exit /b 1

:end
echo.
echo 🎉 Deployment complete!
endlocal

