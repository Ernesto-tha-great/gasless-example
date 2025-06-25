"use client";

import React, {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { config, projectId } from "../configs";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider, useAccount } from "wagmi";
import { ethers } from "ethers";
import { BiconomySmartAccountV2 } from "@biconomy/account";
import { createSmartAccount } from "../configs/biconomy";

const queryClient = new QueryClient();

if (!projectId) throw new Error("Project ID is not defined");

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  defaultChain: config.chains[0],
  themeMode: "light",
  themeVariables: {
    "--w3m-z-index": 1000,
  },
  featuredWalletIds: [],
});

interface AuthContextType {
  smartAccount: BiconomySmartAccountV2 | null;
  provider: ethers.providers.Web3Provider | null;
  isAuthenticated: boolean;
  address: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeSmartAccount = async () => {
      if (isConnected && address && !smartAccount) {
        try {
          const web3Provider = new ethers.providers.Web3Provider(
            (window as any).ethereum
          );
          await web3Provider.send("eth_requestAccounts", []);

          const smartAcc = await createSmartAccount(web3Provider);

          setProvider(web3Provider);
          setSmartAccount(smartAcc);
          setIsAuthenticated(true);
        } catch (error) {
          setIsAuthenticated(false);
        }
      }
    };

    initializeSmartAccount();
  }, [isConnected, address, smartAccount]);

  useEffect(() => {
    if (!isConnected) {
      setSmartAccount(null);
      setProvider(null);
      setIsAuthenticated(false);
    }
  }, [isConnected]);

  return (
    <AuthContext.Provider
      value={{
        smartAccount,
        provider,
        isAuthenticated,
        address: address ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within Web3ModalProvider");
  }
  return context;
}
