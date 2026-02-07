#!/usr/bin/env bash

# Quick start script for frontend with local Anvil

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Blackjack Frontend - Local Anvil Mode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Check if Anvil is running
if ! curl -s http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}⚠️  Anvil is not running!${NC}"
    echo ""
    echo "Please start Anvil in another terminal:"
    echo "  anvil"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Anvil is running${NC}"
echo ""

# Switch to Anvil configuration
echo -e "${YELLOW}1. Switching to Anvil configuration...${NC}"
./switch-network.sh anvil > /dev/null 2>&1

echo -e "${GREEN}✓ Configuration loaded${NC}"
echo ""

# Instructions
echo -e "${YELLOW}2. Make sure MetaMask is configured:${NC}"
echo "   - Network: Anvil (Localhost)"
echo "   - Chain ID: 31337"
echo "   - RPC: http://127.0.0.1:8545"
echo ""

echo -e "${YELLOW}3. Starting frontend...${NC}"
echo ""

# Start the frontend
npm run dev
