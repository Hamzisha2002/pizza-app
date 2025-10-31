@echo off
REM Boss Pizza Mobile - Deploy Auth Fix
echo.
echo 🔧 Deploying Authentication Fix to Production
echo.

REM Check if logged in
echo Checking Expo login status...
npx expo whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Not logged in to Expo
    echo Please login first: npx expo login
    exit /b 1
)

for /f "delims=" %%i in ('npx expo whoami') do set USERNAME=%%i
echo ✅ Logged in as: %USERNAME%
echo.

echo 🚀 Publishing authentication fixes to production...
echo.
echo Changes included:
echo - Fixed window.location.origin errors in production
echo - Updated redirect URLs for production environment
echo - Added comprehensive error logging
echo - Improved error handling and user feedback
echo.

npx eas update --branch production --message "Fix: Production sign-up authentication errors"

if errorlevel 1 (
    echo ❌ Deployment failed!
    echo Check the error messages above.
    exit /b 1
)

echo.
echo ✅ Authentication fix deployed successfully!
echo.
echo 🧪 Test your sign-up functionality now:
echo 1. Open your app
echo 2. Try to sign up with a test email
echo 3. Check console logs for detailed error messages
echo 4. Verify email is sent to your inbox
echo.
echo 📱 To generate QR code for testing:
echo    npm run tunnel
echo.
echo 🎉 Sign-up should now work in production!
echo.
pause
