#!/bin/bash
set -e

# Auto-detect Docker or Podman
if command -v docker &> /dev/null; then
    ENGINE="docker"
elif command -v podman &> /dev/null; then
    ENGINE="podman"
else
    echo "Error: Docker or Podman not found."
    exit 1
fi

echo "Using [$ENGINE] to compose down kanban board..."

$ENGINE-compose down

echo "Services stopped successfully, see you next time."