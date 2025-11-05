#!/bin/bash
set -e

echo "🔍 Checking Node.js and npm versions..."

# Check Node.js version
if command -v node &> /dev/null; then
  echo "✅ Node.js version: $(node -v)"
else
  echo "❌ Node.js is not installed."
fi

# Check npm version
if command -v npm &> /dev/null; then
  echo "✅ npm version: $(npm -v)"
else
  echo "❌ npm is not installed."
  sudo apt-get install -y npm
  echo "✅ npm installation complete."
fi

# Install project dependencies
echo "📦 Installing project dependencies for front end..."
cd client && npm install

echo "📦 Installing project dependencies for backend....."
cd ../server && npm install

echo "✅ Completed both front and back dependencies"
cd ../

echo ""
echo "🚀 Starting both client and server..."
echo ""

# Start server in background
echo "Starting server on http://localhost:8080..."
(cd server && npm run dev) &

# Start client in background
echo "Starting client on http://localhost:3000..."
(cd client && npm run dev) &

echo ""
echo "✅ Both services are starting..."
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for both processes
wait