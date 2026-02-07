import { estimateGas } from "@wagmi/core";
import { parseGwei, encodeFunctionData } from "viem";
import { getConfig } from "@/wagmi";

export interface GasPrice {
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

/**
 * Fetch gas prices from Polygon Amoy gas station
 * Falls back to default values if fetch fails
 */
export async function fetchGasPrice(): Promise<{ maxFee: string; maxPriorityFee: string }> {
  const defaultGasPrice = {
    maxFee: "25.2",
    maxPriorityFee: "25",
  };

  try {
    const response = await fetch("https://gasstation.polygon.technology/amoy");
    if (!response.ok) {
      console.warn(`Failed to fetch gas price: ${response.statusText}, using defaults`);
      return defaultGasPrice;
    }
    const data = await response.json();
    return data.fast; // Gas price in gwei
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return defaultGasPrice;
  }
}

/**
 * Get complete gas configuration for a contract call
 * Includes gas estimation and current gas prices
 */
export async function getGasConfig(
  contractAddress: `0x${string}`,
  abi: any,
  functionName: string,
  args: any[],
  account: `0x${string}`,
  value?: bigint
): Promise<GasPrice> {
  const config = getConfig();

  // Estimate gas for the transaction
  const encodedData = encodeFunctionData({
    abi,
    functionName,
    // Include args even if empty, viem handles it correctly
    args: args || [],
  });

  try {
    const contractGasFee = await estimateGas(config, {
      to: contractAddress,
      data: encodedData,
      account,
      ...(value ? { value } : {}),
    });

    // Add 200% buffer to gas estimate to avoid "out of gas" errors
    // Reentrancy guards, minting, events, and other features increase actual gas usage significantly
    const gasWithBuffer = (contractGasFee * BigInt(300)) / BigInt(100);
    
    console.log(`Gas estimation: ${contractGasFee.toString()} -> with buffer: ${gasWithBuffer.toString()} for ${functionName}`);

    // Fetch current gas prices
    const gasPrice = await fetchGasPrice();

    return {
      gas: gasWithBuffer,
      maxFeePerGas: parseGwei(gasPrice.maxFee.toString()),
      maxPriorityFeePerGas: parseGwei(gasPrice.maxPriorityFee.toString()),
    };
  } catch (error) {
    console.error("Gas estimation failed, using fallback values:", error);
    
    // Fallback: use a high gas limit
    // buyTokens needs ~100k gas due to minting and events
    const fallbackGas = value ? BigInt(150000) : BigInt(100000);
    const gasPrice = await fetchGasPrice();

    console.log(`Using fallback gas: ${fallbackGas.toString()} for ${functionName}`);

    return {
      gas: fallbackGas,
      maxFeePerGas: parseGwei(gasPrice.maxFee.toString()),
      maxPriorityFeePerGas: parseGwei(gasPrice.maxPriorityFee.toString()),
    };
  }
}
