@echo off
echo 🚀 Starting Product Explorer Setup for Windows...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    exit /b 1
) else (
    echo ✅ Node.js is already installed
)

REM Check if MySQL is installed
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL is not installed. Please install MySQL from https://dev.mysql.com/downloads/installer/
    exit /b 1
) else (
    echo ✅ MySQL is already installed
)

REM Create database and tables
echo 🗄️ Setting up database...
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS test_db;"
mysql -u root -proot test_db -e "
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_path VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    image_path VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);"

REM Create directories
echo 📁 Creating upload directories...
if not exist "backend\uploads\categories" mkdir "backend\uploads\categories"
if not exist "backend\uploads\products" mkdir "backend\uploads\products"

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
if not exist package.json (
    call npm init -y
    call npm install express mysql2 cors body-parser multer
) else (
    call npm install
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend\vite-project
if not exist package.json (
    call npm create vite@latest . -- --template react
    call npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom react-slick slick-carousel
) else (
    call npm install
)

REM Kill processes on ports if they exist
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>nul

REM Start backend and frontend in separate windows
echo 🚀 Starting the application...
cd ..\..\backend
start cmd /k "node app.js"
cd ..\frontend\vite-project
start cmd /k "npm run dev"

echo ✨ Setup complete! The application should now be running.
echo 📱 Frontend: http://localhost:5173
echo 🔌 Backend: http://localhost:5001
echo ⚠️ Note: You might need to wait a few moments for both servers to start completely. 