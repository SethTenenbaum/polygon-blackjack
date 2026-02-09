import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import { defineChain } from "viem";

// Define local Anvil chain
const anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: { name: "Anvil", url: "" },
  },
});

export function getConfig() {
  // Check for custom RPC URL in localStorage (client-side only)
  const customRpc = typeof window !== 'undefined' 
    ? localStorage.getItem("CUSTOM_RPC_URL") 
    : null;
  
  const rpcUrl = customRpc || process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/N72iogGVN-7pd1OaxcDdh";
  
  return createConfig({
    chains: [polygonAmoy], // REMOVED ANVIL - it was trying to connect to localhost and hanging
    connectors: [
      metaMask({
        dappMetadata: {
          name: "Blackjack on Polygon Amoy",
        },
        enableAnalytics: false,
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [polygonAmoy.id]: http(rpcUrl),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
