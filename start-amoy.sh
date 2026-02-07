#!/usr/bin/env bash

# Quick start script for frontend with Polygon Amoy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Blackjack Frontend - Polygon Amoy Mode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Switch to Amoy configuration
echo -e "${YELLOW}1. Switching to Polygon Amoy configuration...${NC}"
./switch-network.sh amoy > /dev/null 2>&1

echo -e "${GREEN}✓ Configuration loaded${NC}"
echo ""

# Show contract addresses
echo -e "${BLUE}Deployed Contracts on Polygon Amoy:${NC}"
echo "  Factory:  https://amoy.polygonscan.com/address/0x0cc2ad63b941e1799b1b23708c68adf276cb3d4d"
echo "  Token:    https://amoy.polygonscan.com/address/0xa74aeeaf37b52bbdf77d121e41cde70a7a19d00f"
echo "  Game:     https://amoy.polygonscan.com/address/0x1491fde3b5b7a1a86807739d5ff1e4bf920c7631"
echo ""

# Instructions
echo -e "${YELLOW}2. Make sure MetaMask is configured:${NC}"
echo "   - Network: Polygon Amoy Testnet"
echo "   - Chain ID: 80002"
echo "   - RPC: https://rpc-amoy.polygon.technology/"
echo "   - You have testnet MATIC for gas"
echo ""

echo -e "${YELLOW}3. Starting frontend...${NC}"
echo ""

# Start the frontend
npm run dev
