const { createPublicClient, http, parseAbi } = require('viem');
const { polygonAmoy } = require('viem/chains');

const client = createPublicClient({
  chain: polygonAmoy,
  transport: http('https://rpc-amoy.polygon.technology'),
});

const FACTORY_ADDRESS = '0x30D4E7cFF4Fb7f15cbEb119192530Fe6dd724AE0';
const PLAYER_ADDRESS = '0xC6d04Dd0433860b99D37C866Ff31853B45E02F1f';

async function test() {
  try {
    console.log('Testing getPlayerGames...');
    const games = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: parseAbi(['function getPlayerGames(address) view returns (address[])']),
      functionName: 'getPlayerGames',
      args: [PLAYER_ADDRESS],
    });
    console.log('Games found:', games.length);
    console.log('First 5 games:', games.slice(0, 5));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
