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
  return createConfig({
    chains: [anvil, polygonAmoy],
    connectors: [
      metaMask({
        dappMetadata: {
          name: "Blackjack on Polygon Amoy",
        },
        // Disable analytics to prevent "Failed to fetch" errors in console
        enableAnalytics: false,
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [anvil.id]: http("http://127.0.0.1:8545"),
      [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/N72iogGVN-7pd1OaxcDdh"),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
