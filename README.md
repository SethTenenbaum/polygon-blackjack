# Polygon Blackjack

A decentralized blackjack game built on Polygon using Chainlink VRF for provably fair randomness.

## Features

- 🎲 Provably fair randomness using Chainlink VRF
- 💰 Multiple bet sizes (0.01, 0.1, 1, 5 MATIC)
- 🎮 Classic blackjack gameplay (Hit, Stand, Double, Split)
- 🔒 Secure smart contract implementation
- 🌐 React + TypeScript frontend with modern UI

## Getting Started

### Prerequisites

- Node.js 16+
- MetaMask or compatible Web3 wallet
- MATIC tokens on Polygon network

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

### Environment Variables

Create a `.env` file with:

```
VITE_CONTRACT_ADDRESS=<your_contract_address>
VITE_NETWORK_ID=137
```

## Deployment

This project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

The `vercel.json` configuration is already set up for proper routing.

## Smart Contract

The smart contract is deployed on Polygon and uses Chainlink VRF for random number generation. Contract address: [View on PolygonScan]

## License

MIT
