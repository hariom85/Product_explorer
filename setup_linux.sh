#!/bin/bash

echo "🚀 Starting Product Explorer Setup for Linux..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if MySQL is running
mysql_running() {
    systemctl is-active --quiet mysql
}

# Check and install Node.js if not present
if ! command_exists node; then
    echo "📦 Node.js not found. Installing Node.js..."
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed"
fi

# Check and install MySQL if not present
if ! command_exists mysql; then
    echo "📦 MySQL not found. Installing MySQL..."
    sudo apt-get update
    sudo apt-get install -y mysql-server
else
    echo "✅ MySQL is already installed"
fi

# Start MySQL if not running
if ! mysql_running; then
    echo "🔄 Starting MySQL server..."
    sudo systemctl start mysql
fi

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
while ! mysql -u root -proot -e "SELECT 1" >/dev/null 2>&1; do
    sleep 1
done

# Create database and tables
echo "🗄️ Setting up database..."
sudo mysql -u root << EOF
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

# Create MySQL user if not exists and grant privileges
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON test_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EOF

# Create necessary directories
echo "📁 Creating upload directories..."
mkdir -p backend/uploads/categories
mkdir -p backend/uploads/products

# Set proper permissions for upload directories
sudo chown -R $USER:$USER backend/uploads
sudo chmod -R 755 backend/uploads

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
    netstat -tuln | grep ":$1" >/dev/null 2>&1
}

# Kill processes if ports are in use
if port_in_use 5001; then
    echo "🔄 Port 5001 in use. Killing process..."
    sudo kill $(sudo lsof -t -i:5001)
fi

if port_in_use 5173; then
    echo "🔄 Port 5173 in use. Killing process..."
    sudo kill $(sudo lsof -t -i:5173)
fi

# Start backend and frontend in separate terminals
echo "🚀 Starting the application..."

# Start backend
cd ../../backend
if command_exists gnome-terminal; then
    gnome-terminal -- bash -c "node app.js"
elif command_exists xterm; then
    xterm -e "node app.js" &
else
    echo "⚠️ No suitable terminal emulator found. Starting servers in background..."
    node app.js &
fi

# Start frontend
cd ../frontend/vite-project
if command_exists gnome-terminal; then
    gnome-terminal -- bash -c "npm run dev"
elif command_exists xterm; then
    xterm -e "npm run dev" &
else
    echo "⚠️ No suitable terminal emulator found. Starting servers in background..."
    npm run dev &
fi

echo "✨ Setup complete! The application should now be running."
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:5001"
echo "⚠️ Note: You might need to wait a few moments for both servers to start completely." 