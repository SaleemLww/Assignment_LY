#!/bin/bash

# Docker Quick Start Script
# Easily start the application with Docker

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Timetable Extraction - Docker Manager${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  .env file not found!${NC}"
        echo -e "${YELLOW}Creating .env from .env.docker.example...${NC}"
        cp .env.docker.example .env
        echo -e "${RED}❗ Please edit .env file and add your API keys before continuing!${NC}"
        exit 1
    fi
}

# Function to start production
start_production() {
    echo -e "${GREEN}🚀 Starting Production Environment...${NC}"
    check_env_file
    docker-compose up -d
    echo ""
    echo -e "${GREEN}✅ Production environment started!${NC}"
    echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}Backend API: http://localhost:5001${NC}"
    echo -e "${BLUE}API Docs: http://localhost:5001/api-docs${NC}"
}

# Function to start development
start_development() {
    echo -e "${GREEN}🚀 Starting Development Environment...${NC}"
    check_env_file
    docker-compose -f docker-compose.dev.yml up -d
    echo ""
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}Backend API: http://localhost:5001${NC}"
    echo -e "${YELLOW}📝 Hot reload enabled for both frontend and backend${NC}"
}

# Function to stop all containers
stop_all() {
    echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    echo -e "${GREEN}✅ All containers stopped${NC}"
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}📋 Viewing logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to rebuild containers
rebuild() {
    echo -e "${YELLOW}🔨 Rebuilding containers...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Containers rebuilt and started!${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker-compose ps
}

# Main menu
if [ $# -eq 0 ]; then
    echo "Usage: $0 {prod|dev|stop|logs|rebuild|status}"
    echo ""
    echo "Commands:"
    echo "  prod     - Start production environment"
    echo "  dev      - Start development environment"
    echo "  stop     - Stop all containers"
    echo "  logs     - View container logs"
    echo "  rebuild  - Rebuild and restart containers"
    echo "  status   - Show container status"
    exit 1
fi

case "$1" in
    prod)
        start_production
        ;;
    dev)
        start_development
        ;;
    stop)
        stop_all
        ;;
    logs)
        view_logs
        ;;
    rebuild)
        rebuild
        ;;
    status)
        show_status
        ;;
    *)
        echo -e "${RED}❌ Invalid command: $1${NC}"
        echo "Usage: $0 {prod|dev|stop|logs|rebuild|status}"
        exit 1
        ;;
esac
