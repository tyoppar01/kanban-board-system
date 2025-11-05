#!/bin/bash
set -e

CSI="\033["
RESET="${CSI}0m"
BOLD="${CSI}1m"
CYAN="${CSI}36m"
YELLOW="${CSI}33m"

clear
echo -e "${BOLD}${CYAN}"
echo "     __     _   _  "
echo "     \\ \\   | \\ | | "
echo "      \\ \\  |  \\| | "
echo "  /\\__/ /  | |\\  | "
echo "  \\____/   |_| \\_| "
echo -e "${RESET}${BOLD}${YELLOW}"
echo "   NAJIHA JASPER"
echo -e "${RESET}\n"


echo -e "${MAGENTA}-----------------------------------------"
echo -e " 🚀  Starting your Node + Next.js app..."
echo -e "-----------------------------------------${RESET}\n"

sleep 1


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

echo ""
echo -e "${GREEN}  ▶ Starting app...${RESET}"
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