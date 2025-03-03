#!/bin/bash

echo "🚀 Starting Product Explorer Setup for macOS..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if MySQL is running
mysql_running() {
    if pgrep mysqld >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Check and install Homebrew if not present
if ! command_exists brew; then
    echo "📦 Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew is already installed"
fi

# Check and install Node.js if not present
if ! command_exists node; then
    echo "📦 Node.js not found. Installing Node.js..."
    brew install node
else
    echo "✅ Node.js is already installed"
fi

# Check and install MySQL if not present
if ! command_exists mysql; then
    echo "📦 MySQL not found. Installing MySQL..."
    brew install mysql
else
    echo "✅ MySQL is already installed"
fi

# Start MySQL if not running
if ! mysql_running; then
    echo "🔄 Starting MySQL server..."
    brew services start mysql
fi

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
while ! mysql -u root -proot -e "SELECT 1" >/dev/null 2>&1; do
    sleep 1
done

# Create database and tables
echo "🗄️ Setting up database..."
mysql -u root -proot << EOF
CREATE DATABASE IF NOT EXISTS test_db;
USE test_db;

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
);
EOF

# Create necessary directories
echo "📁 Creating upload directories..."
mkdir -p backend/uploads/categories
mkdir -p backend/uploads/products

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -f package.json ]; then
    npm init -y
    npm install express mysql2 cors body-parser multer
else
    npm install
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend/vite-project
if [ ! -f package.json ]; then
    npm create vite@latest . -- --template react
    npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom react-slick slick-carousel
else
    npm install
fi

# Function to check if a port is in use
port_in_use() {
    lsof -i:"$1" >/dev/null 2>&1
}

# Kill processes if ports are in use
if port_in_use 5001; then
    echo "🔄 Port 5001 in use. Killing process..."
    lsof -ti:5001 | xargs kill -9
fi

if port_in_use 5173; then
    echo "🔄 Port 5173 in use. Killing process..."
    lsof -ti:5173 | xargs kill -9
fi

# Start backend and frontend in separate terminals
echo "🚀 Starting the application..."

# Start backend
cd ../../backend
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && node app.js"'

# Start frontend
cd ../frontend/vite-project
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"'

echo "✨ Setup complete! The application should now be running."
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:5001"
echo "⚠️ Note: You might need to wait a few moments for both servers to start completely." 