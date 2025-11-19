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
elif command -v podman &> /dev/null; then
    ENGINE="podman"
    COMPOSE_FILE="docker-compose.host.yml"
else
    echo "Error: Docker or Podman not found."
    exit 1
fi

echo "Using [$ENGINE] to compose kanban board..."

# Use appropriate compose file based on container engine
if [ "$ENGINE" = "podman" ]; then
    echo "Using host networking for Podman..."
    if [ -f "$COMPOSE_FILE" ]; then
        $ENGINE compose -f $COMPOSE_FILE up -d
        echo "✅ Podman with host networking succeeded"
    else
        echo "❌ $COMPOSE_FILE not found"
        exit 1
    fi
else
    # Try bridge networking first for Docker (docker-compose.yml)
    echo "Attempting bridge networking for Docker..."
    if $ENGINE compose up -d 2>&1 | tee /tmp/compose-output.log | grep -q "netavark"; then
        echo "⚠️  Bridge networking failed (netavark error)"
        echo "Cleaning up and switching to host networking..."
        
        # Clean up failed containers
        $ENGINE compose down 2>/dev/null || true
        $ENGINE rm -af 2>/dev/null || true
        
        # Try host networking
        if [ -f "docker-compose.host.yml" ]; then
            echo "Starting with host networking..."
            $ENGINE compose -f docker-compose.host.yml up -d
            echo "✅ Host networking succeeded"
        else
            echo "❌ docker-compose.host.yml not found"
            exit 1
        fi
    else
        echo "✅ Bridge networking succeeded"
    fi
fi

echo "Services started successfully."