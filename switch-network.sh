#!/usr/bin/env bash

# Script to switch between Anvil (local) and Amoy (deployed) configurations
# Usage: ./switch-network.sh [anvil|amoy]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}Network Switcher for Blackjack Frontend${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    echo "Usage: $0 [anvil|amoy]"
    echo ""
    echo "Options:"
    echo "  anvil  - Switch to local Anvil network (http://127.0.0.1:8545)"
    echo "  amoy   - Switch to Polygon Amoy testnet (deployed contracts)"
    echo ""
    echo "Examples:"
    echo "  $0 anvil    # Use local development network"
    echo "  $0 amoy     # Use deployed Polygon Amoy contracts"
    echo ""
}

show_current() {
    if [ -f ".env.local" ]; then
        CURRENT_CHAIN=$(grep "NEXT_PUBLIC_CHAIN_ID" .env.local | cut -d'=' -f2)
        if [ "$CURRENT_CHAIN" == "31337" ]; then
            echo -e "${GREEN}Current network: Local Anvil${NC}"
        elif [ "$CURRENT_CHAIN" == "80002" ]; then
            echo -e "${GREEN}Current network: Polygon Amoy${NC}"
        else
            echo -e "${YELLOW}Current network: Unknown (Chain ID: $CURRENT_CHAIN)${NC}"
        fi
    else
        echo -e "${YELLOW}No configuration file found${NC}"
    fi
}

switch_to_anvil() {
    echo -e "${BLUE}Switching to Local Anvil network...${NC}"
    
    if [ ! -f ".env.anvil" ]; then
        echo -e "${RED}Error: .env.anvil not found${NC}"
        exit 1
    fi
    
    # Backup current config if it exists
    if [ -f ".env.local" ]; then
        cp .env.local .env.local.backup
        echo -e "${GREEN}✓ Backed up current configuration${NC}"
    fi
    
    # Copy Anvil configuration
    cp .env.anvil .env.local
    echo -e "${GREEN}✓ Switched to Local Anvil network${NC}"
    echo ""
    echo -e "${YELLOW}Configuration:${NC}"
    echo "  Chain ID: 31337"
    echo "  RPC URL: http://127.0.0.1:8545"
    echo "  Network: Local Anvil"
    echo ""
    echo -e "${YELLOW}Remember to:${NC}"
    echo "  1. Start Anvil: anvil"
    echo "  2. Deploy contracts: ./deploy-local-metamask.sh"
    echo "  3. Restart frontend: npm run dev"
}

switch_to_amoy() {
    echo -e "${BLUE}Switching to Polygon Amoy testnet...${NC}"
    
    if [ ! -f ".env.amoy" ]; then
        echo -e "${RED}Error: .env.amoy not found${NC}"
        exit 1
    fi
    
    # Backup current config if it exists
    if [ -f ".env.local" ]; then
        cp .env.local .env.local.backup
        echo -e "${GREEN}✓ Backed up current configuration${NC}"
    fi
    
    # Copy Amoy configuration
    cp .env.amoy .env.local
    echo -e "${GREEN}✓ Switched to Polygon Amoy testnet${NC}"
    echo ""
    echo -e "${YELLOW}Configuration:${NC}"
    echo "  Chain ID: 80002"
    echo "  RPC URL: Alchemy Amoy"
    echo "  Network: Polygon Amoy Testnet"
    echo ""
    echo -e "${GREEN}Deployed Contract Addresses:${NC}"
    grep "NEXT_PUBLIC.*ADDRESS" .env.local | sed 's/NEXT_PUBLIC_/  /' | sed 's/_ADDRESS//' | sed 's/=/ = /'
    echo ""
    echo -e "${YELLOW}Remember to:${NC}"
    echo "  1. Switch MetaMask to Polygon Amoy network"
    echo "  2. Restart frontend: npm run dev"
    echo "  3. View contracts on Polygonscan:"
    echo "     https://amoy.polygonscan.com/address/0x0cc2ad63b941e1799b1b23708c68adf276cb3d4d"
}

# Main script logic
if [ $# -eq 0 ]; then
    show_usage
    echo ""
    show_current
    exit 0
fi

NETWORK=$1

case "$NETWORK" in
    anvil)
        switch_to_anvil
        ;;
    amoy)
        switch_to_amoy
        ;;
    status)
        show_current
        ;;
    *)
        echo -e "${RED}Error: Invalid network '$NETWORK'${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}Network switch complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
