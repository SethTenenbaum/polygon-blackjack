#!/usr/bin/env node

// Quick script to debug a stuck game and check RPC connectivity
const { createPublicClient, http } = require('viem');
const { polygonAmoy } = require('viem/chains');

// Get game address from command line argument
const GAME_ADDRESS = process.argv[2];
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-amoy.polygon.technology';

// Validate game address
if (!GAME_ADDRESS) {
  console.error('❌ Error: Game address is required!');
  console.error('Usage: node debug-stuck-game.js <GAME_ADDRESS>');
  console.error('Example: node debug-stuck-game.js 0x03256998A4c9CC7fF409FF6a118ed1f058fc6C10');
  process.exit(1);
}

// Validate address format (basic check)
if (!GAME_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  console.error('❌ Error: Invalid Ethereum address format!');
  console.error('Address must be 42 characters starting with 0x');
  process.exit(1);
}

const GAME_ABI = [
  {
    "inputs": [],
    "name": "state",
    "outputs": [{ "internalType": "enum BlackjackGame.GameState", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDealerCards",
    "outputs": [{ "internalType": "uint8[]", "name": "", "type": "uint8[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "handIndex", "type": "uint256" }],
    "name": "getPlayerHandCards",
    "outputs": [{ "internalType": "uint8[]", "name": "", "type": "uint8[]" }],
    "stateMutability": "view",
    "type": "function"
  },
];

const gameStateNames = ['NotStarted', 'Dealing', 'InsuranceOffer', 'PlayerTurn', 'DealerTurn', 'Finished'];

async function debugGame() {
  console.log(`\n🔍 Debugging stuck game: ${GAME_ADDRESS}`);
  console.log(`📡 Using RPC: ${RPC_URL}\n`);

  const client = createPublicClient({
    chain: polygonAmoy,
    transport: http(RPC_URL, {
      timeout: 10000, // 10 second timeout
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  try {
    console.log('⏳ Fetching game state...');
    const state = await client.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'state',
    });
    
    console.log(`✅ Game State: ${gameStateNames[state]} (${state})`);

    if (state === 4) { // DealerTurn
      console.log('\n⏳ Fetching dealer cards...');
      const dealerCards = await client.readContract({
        address: GAME_ADDRESS,
        abi: GAME_ABI,
        functionName: 'getDealerCards',
      });
      
      console.log(`✅ Dealer has ${dealerCards.length} cards:`, dealerCards);
      
      // Calculate dealer score
      let score = 0;
      let aces = 0;
      
      for (const cardId of dealerCards) {
        const rank = ((cardId - 1) % 13) + 1;
        let value;
        
        if (rank === 1) {
          value = 11;
          aces++;
        } else if (rank >= 11) {
          value = 10;
        } else {
          value = rank;
        }
        
        score += value;
      }
      
      while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
      }
      
      console.log(`🎲 Dealer score: ${score}`);
      
      if (score < 17) {
        console.log('⚠️  ISSUE: Dealer should hit (score < 17) but automation might be stuck!');
        console.log('    Possible causes:');
        console.log('    1. RPC rate limiting (429 errors)');
        console.log('    2. Frontend not detecting dealer needs to hit');
        console.log('    3. LINK balance too low in contract');
        console.log('    4. Transaction pending but not visible');
      } else {
        console.log('✅ Dealer score >= 17, should call continueDealer() to finish game');
      }
      
      console.log('\n⏳ Fetching player cards...');
      const playerCards = await client.readContract({
        address: GAME_ADDRESS,
        abi: GAME_ABI,
        functionName: 'getPlayerHandCards',
        args: [BigInt(0)],
      });
      
      console.log(`✅ Player has ${playerCards.length} cards:`, playerCards);
    }

    console.log('\n✅ RPC connection is working!');
    console.log('   If the game is stuck, it\'s likely a frontend issue, not RPC.');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      console.log('\n🚨 RPC RATE LIMIT DETECTED!');
      console.log('   Solution: Switch to a different RPC endpoint');
      console.log('   Options:');
      console.log('   1. Alchemy: https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY');
      console.log('   2. Infura: https://polygon-amoy.infura.io/v3/YOUR_KEY');
      console.log('   3. QuickNode: https://your-endpoint.matic-amoy.quiknode.pro/YOUR_KEY/');
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.log('\n🚨 RPC TIMEOUT!');
      console.log('   The RPC endpoint is too slow or unresponsive');
      console.log('   Try a different endpoint with better performance');
    } else {
      console.log('\n🚨 RPC ERROR!');
      console.log('   Check your internet connection and RPC endpoint');
    }
  }
}

debugGame();
