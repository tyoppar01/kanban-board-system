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
elif command -v podman &> /dev/null; then
    ENGINE="podman"
else
    echo "Error: Docker or Podman not found."
    exit 1
fi

echo "Using [$ENGINE] to compose kanban board..."

$ENGINE compose up -d

echo "Services started successfully."