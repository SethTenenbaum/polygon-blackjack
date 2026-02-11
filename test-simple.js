// Simple script to test calling continueDealer on the stuck game
const { ethers } = require('ethers');

const GAME_ADDRESS = '0x664942439AB14F69BC1fd1D2CD7091c012Aaf069';
const RPC_URL = 'https://polygon-amoy.g.alchemy.com/v2/9Mke0zFLl2sP7lxL5WVJZGqz3lqyI1se';

// Minimal ABI
const GAME_ABI = [
  'function continueDealer() external',
  'function state() external view returns (uint8)',
  'function getDealerCards() external view returns (uint256[])',
  'function getPlayerHandCards(uint256 handIndex) external view returns (uint256[])',
];

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(GAME_ADDRESS, GAME_ABI, provider);
    
    console.log('📖 Reading contract state...');
    const state = await contract.state();
    console.log(`Current state: ${state} (4 = DealerTurn)`);
    
    const dealerCards = await contract.getDealerCards();
    console.log(`Dealer cards: ${dealerCards} (${dealerCards.length} cards)`);
    
    const playerCards = await contract.getPlayerHandCards(0);
    console.log(`Player cards: ${playerCards} (${playerCards.length} cards)`);
    
    console.log('\n🔍 Simulating continueDealer call...');
    
    try {
      await contract.continueDealer.staticCall();
      console.log('✅ continueDealer simulation SUCCEEDED');
    } catch (err) {
      console.log('❌ continueDealer simulation FAILED:');
      console.error(err.message);
      if (err.data) console.log('Error data:', err.data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
