#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Timetable Extraction - Server Manager${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Kill all existing node processes
echo -e "${YELLOW}🔪 Killing all existing Node.js processes...${NC}"
pkill -9 node 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All Node.js processes terminated${NC}"
else
    echo -e "${YELLOW}⚠️  No Node.js processes found (already clean)${NC}"
fi
sleep 1
echo ""

# Step 2: Start backend in a new terminal
echo -e "${YELLOW}🚀 Starting Backend Server (Port 5001)...${NC}"
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd $(pwd)/backend && clear && echo '🔥 BACKEND SERVER - Port 5001' && echo '=================================' && npm run dev"
end tell
EOF
echo -e "${GREEN}✅ Backend server starting in new terminal${NC}"
sleep 2
echo ""

# Step 3: Start frontend in a new terminal
echo -e "${YELLOW}🎨 Starting Frontend Server (Port 3000)...${NC}"
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd $(pwd)/frontend && clear && echo '⚡ FRONTEND SERVER - Port 3000' && echo '=================================' && npm run dev"
end tell
EOF
echo -e "${GREEN}✅ Frontend server starting in new terminal${NC}"
sleep 2
echo ""

# Step 4: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✨ Both servers are starting!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📍 Backend:${NC}  http://localhost:5001"
echo -e "${YELLOW}📍 Frontend:${NC} http://localhost:3000"
echo -e "${YELLOW}💚 Health:${NC}   http://localhost:5001/health"
echo ""
echo -e "${BLUE}Logs will appear in separate terminal windows.${NC}"
echo -e "${BLUE}Press Ctrl+C in each terminal to stop servers.${NC}"
echo ""
