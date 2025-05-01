@echo off
echo Kha-Boom! Build Script
echo ------------------------

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Node.js is not installed. Please install Node.js from https://nodejs.org/
  exit /b 1
)

REM Menu for build options
:menu
echo.
echo Choose an option:
echo 1. Install dependencies
echo 2. Start development server
echo 3. Build for production
echo 4. Exit
echo.

set /p option="Enter option (1-4): "

if "%option%"=="1" goto install
if "%option%"=="2" goto start
if "%option%"=="3" goto build
if "%option%"=="4" goto end

echo Invalid option. Please try again.
goto menu

:install
echo.
echo Installing dependencies...
call npm install
echo.
echo Dependencies installed successfully!
goto menu

:start
echo.
echo Starting development server...
call npm run dev
goto menu

:build
echo.
echo Building for production...
call npm run build
echo.
echo Build completed successfully! Files are in the 'dist' folder.
goto menu

:end
echo.
echo Goodbye!
exit /b 0 