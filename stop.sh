#!/bin/bash
set -e

# Auto-detect Docker or Podman
if command -v docker &> /dev/null; then
    ENGINE="docker"
    COMPOSE_CMD="compose"
    COMPOSE_FILE="docker-compose.yml"
elif command -v podman &> /dev/null; then
    ENGINE="podman"
    COMPOSE_CMD="compose"
    COMPOSE_FILE="docker-compose.host.yml"
else
    echo "Error: Docker or Podman not found."
    exit 1
fi

echo "Using [$ENGINE] to compose down kanban board..."

# Check if using podman-compose or podman compose
if [ "$ENGINE" = "podman" ]; then
    if command -v podman-compose &> /dev/null; then
        COMPOSE_CMD="podman-compose"
    fi
fi

# Execute the stop command
if [ "$ENGINE" = "podman" ] && command -v podman-compose &> /dev/null; then
    $COMPOSE_CMD -f $COMPOSE_FILE down
else
    $ENGINE $COMPOSE_CMD -f $COMPOSE_FILE down
fi

echo "Services stopped successfully, see you next time."