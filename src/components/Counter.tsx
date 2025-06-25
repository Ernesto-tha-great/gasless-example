"use client";

import { useState } from "react";
import { useReadContract, useAccount } from "wagmi";
import { PaymasterMode } from "@biconomy/paymaster";
import { counterAddress, abi } from "../constants";
import { useAuth } from "../context/Web3Modal";
import { ethers } from "ethers";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export function Counter() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { smartAccount, provider, isAuthenticated } = useAuth();
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const { data: count } = useReadContract({
    address: counterAddress,
    abi: abi,
    functionName: "number",
  });

  const handleIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartAccount || !provider) return;

    setLoading(true);
    try {
      const contract = new ethers.Contract(counterAddress, abi, provider);
      const data = contract.interface.encodeFunctionData("increment");

      const tx = {
        to: counterAddress,
        data: data,
        value: "0x0",
      };

      const userOpResponse = await smartAccount.sendTransaction(tx, {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED,
          calculateGasLimits: true,
        },
      });

      const { transactionHash } = await userOpResponse.waitForTxHash();
      setTxHash(transactionHash ?? null);
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[400px] max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-gray-600 text-center mb-4">
            Connect your wallet to interact with the counter
          </p>
          <button
            onClick={() => open()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white py-3 px-8 rounded-lg font-semibold
                     hover:from-blue-600 hover:to-blue-700 
                     transition-all duration-200 transform hover:scale-105"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl p-8 text-center border border-gray-100 shadow-inner">
            <p className="text-gray-600 font-medium mb-3">Counter Value</p>
            <p className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {count?.toString() || "0"}
            </p>
          </div>

          <button
            onClick={handleIncrement}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white 
                      transition-all duration-200 transform hover:scale-[1.02]
                      ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      }`}
          >
            {loading ? "Processing..." : "Increment Counter"}
          </button>

          {txHash && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <a
                href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-500 hover:text-blue-700 transition-colors duration-200 group"
              >
                <span>View Transaction</span>
                <svg
                  className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
