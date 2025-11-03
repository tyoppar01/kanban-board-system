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
