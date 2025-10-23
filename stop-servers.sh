#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔪 Stopping all Node.js servers...${NC}"
pkill -9 node 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All servers stopped${NC}"
else
    echo -e "${YELLOW}⚠️  No running servers found${NC}"
fi
