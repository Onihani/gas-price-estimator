"use client";

// react
import { useState, useEffect } from "react";
// next
import { Inter } from "next/font/google";
// imports
import Web3 from "web3";
import { Toaster } from "sonner";
import { WalletIcon, Zap } from "lucide-react";

// styles
import "./globals.css";

// components
import { Button } from "@/components/ui/button";

// utils
import { truncateAddress } from "@/utils";

// fonts
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const web3 = new Web3(window.ethereum);

  // state
  const [address, setAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectNetworkId, setConnectNetworkId] = useState(0);

  // handlers
  const connectWallet = async () => {
    try {
      const accounts = await web3.eth.requestAccounts();
      if (accounts.length) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // check if the chain to connect to is installed
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }], // chainId must be in hexadecimal numbers
        });
      } catch (error) {
        // This error code indicates that the chain has not been added to MetaMask
        // if it is not, then install it into the user MetaMask
        if ((error as { code?: number }).code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x1",
                  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
                },
              ],
            });
          } catch (addError) {
            console.error(addError);
          }
        }
        console.error(error);
      }
    } else {
      // if no window.ethereum then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please consider installing it: https://metamask.io/download.html"
      );
    }
  };

  // effects
  useEffect(() => {
    const address = window.localStorage.getItem("address");
    if (address) {
      setAddress(address);
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    // check if wallet is connected
    web3.eth
      .getAccounts()
      .then((accounts) => {
        if (accounts.length) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      })
      .catch(() => {
        setIsConnected(false);
      });
  }, []);

  useEffect(() => {
    // check if network is connected
    web3.eth.net
      .getId()
      .then((networkId) => {
        setConnectNetworkId(Number(networkId));
      })
      .catch(() => {
        setConnectNetworkId(0);
      });

    // listen for network change
    window.ethereum.on("chainChanged", (chainId: bigint) => {
      setConnectNetworkId(Number(chainId));
    });

    // listen for account change
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length) {
        setAddress(accounts[0]);
        setIsConnected(true);
      } else {
        setAddress("");
        setIsConnected(false);
      }
    });

    // listen for connect
    window.ethereum.on("connect", () => {
      setIsConnected(true);
    });

    // listen for disconnect
    window.ethereum.on("disconnect", () => {
      setAddress("");
      setIsConnected(false);
    });
  }, [isConnected]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans">
          <header className="border-b border-gray-700 bg-gray-800 bg-opacity-50 backdrop-blur-lg shadow-lg">
            <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
              <h1 className="text-3xl font-bold flex items-center font-display tracking-tight">
                <Zap className="mr-3 h-8 w-8 text-yellow-400 filter drop-shadow-md" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm">
                  Gas Price Estimator
                </span>
              </h1>
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={connectWallet}
                  className="relative overflow-hidden group bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 ease-out hover:shadow-pink-500/25 hover:shadow-xl"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                  <span className="relative flex items-center">
                    <WalletIcon className="mr-2 h-4 w-4" /> Connect Wallet
                  </span>
                </Button>
              ) : (
                <div className="flex gap-3">
                  {/* button to switch network */}
                  {connectNetworkId !== 1 && (
                    <Button
                      size="lg"
                      onClick={switchNetwork}
                      className="relative overflow-hidden group bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 ease-out hover:shadow-red-700/25 hover:shadow-xl"
                    >
                      <span className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                      <span className="relative flex items-center">
                        <WalletIcon className="mr-2 h-4 w-4" /> Switch To
                        Mainnet
                      </span>
                    </Button>
                  )}
                  {/* connect wallet info */}
                  <div className="flex items-center space-x-4 bg-gray-800 text-white py-1.5 px-3 rounded-lg shadow-md">
                    <div className="flex items-center">
                      <div className="bg-green-500 h-3 w-3 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold">
                        {truncateAddress(address)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>
          {children}
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
