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

# Auto-detect Docker or Podman
if command -v docker &> /dev/null; then
    ENGINE="docker"
    COMPOSE_FILE="docker-compose.yml"
elif command -v podman-compose &> /dev/null; then
    ENGINE="podman-compose"
    COMPOSE_FILE="docker-compose.yml"
else
    echo "Error: Docker or Podman-compose not found."
    exit 1
fi

echo "Using [$ENGINE] to compose kanban board..."

# Stop and remove old containers first
echo "🛑 Stopping existing containers..."
$ENGINE down --remove-orphans 2>/dev/null || true
# Remove Volume only if password has modified!
# $ENGINE down -v 2>/dev/null || true

# Build and start with fresh containers
echo "🔨 Building containers..."
$ENGINE up -d --build

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📍 Access your services:"
echo "   🌐 Client (Next.js):  http://localhost:3000"
echo "   🔌 Server (GraphQL):  http://localhost:8080/graphql"
echo "   🗄️  PostgreSQL:        localhost:5432"
echo ""
echo "💡 Check status with: podman ps"
echo "📋 View logs with: podman logs kanban-server"