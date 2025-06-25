import { createSmartAccountClient } from "@biconomy/account";
import { ethers } from "ethers";

export const BICONOMY_CHAIN_ID = 84532;

export const createSmartAccount = async (
  provider: ethers.providers.Web3Provider
) => {
  const signer = provider.getSigner();

  const config = {
    chainId: 84532,
    biconomyPaymasterApiKey:
      process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY!,
    bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL!,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
    signer: signer,
  };

  const smartAccount = await createSmartAccountClient(config);
  return smartAccount;
};
