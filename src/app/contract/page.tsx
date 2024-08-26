"use client";

// react
import { useState, useEffect } from "react";
//  next
import Link from "next/link";
// import
import axios from "axios";
import { toast } from "sonner";
import { Web3, validator } from "web3";
import { Link as LinkIcon, Loader, WalletIcon, Zap } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";

// components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// utils
import { PriceConverter, PriceFormatter } from "@/utils";

// schemas
import {
  formSchema,
  FormValues,
} from "@/common/contract-transaction-form.schema";

// types
import { ABIType } from "@/common/types";

export default function Home() {
  const web3 = new Web3(window.ethereum);
  // utils
  const priceConverter = new PriceConverter({
    web3,
  });

  // state
  const [address, setAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [fetchingAbi, setFetchingAbi] = useState(false);
  const [contractAbi, setContractAbi] = useState<ABIType | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [gasPriceEstimation, setGasPriceEstimation] = useState<{
    gasPriceWei: string;
    gasPriceEth: string;
    gasPriceValue: string;
  } | null>(null);

  // hooks
  const {
    watch,
    control,
    register,
    setValue,
    resetField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  const { fields, append } = useFieldArray<FormValues>({
    control,
    name: "contractArgs",
  });

  // derived state
  const contractAddress = watch("contractAddress");
  const contractMethod = watch("contractMethod");

  console.log({ contractAbi, errors, fields });

  // handlers
  const connectWallet = async () => {
    try {
      const accounts = await web3.eth.requestAccounts();
      if (accounts.length) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      toast.warning("Failed to connect wallet. Please try again.");
    }
  };

  const fetchContractAbi = async (address: string) => {
    setFetchingAbi(true);

    try {
      const chainId = await web3.eth.getChainId();
      const parsedChainId = Number(chainId);

      if (parsedChainId != 1) {
        toast.error("Switch to Ethereum Mainnet to estimate gas price");
        return null;
      }

      const response = await axios.get(
        `https://anyabi.xyz/api/get-abi/${parsedChainId}/${address}`
      );
      const data = response.data;

      if (data.abi) {
        setContractAbi(data.abi);
        return data.abi;
      }
    } catch (error) {
      console.error(error);
      setContractAbi(null);
      toast.error("An error occurred while fetching contract ABI");
      return null;
    } finally {
      setFetchingAbi(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data, event) => {
    event?.preventDefault();
    setEstimating(true);

    try {
      console.log({ data });
      const chainId = await web3.eth.getChainId();
      const parsedChainId = Number(chainId);

      if (parsedChainId != 1) {
        toast.error("Switch to Ethereum Mainnet to estimate gas price");
        return;
      }

      const estimationResult =
        await priceConverter.estimateContractTransactionCost({
          chainId: parsedChainId,
          senderAddress: data.senderAddress,
          contractAddress: data.contractAddress,
          method: data.contractMethod,
          args: data.contractArgs.map((arg) => {
            if (arg.type === "bool") {
              return arg.value === "true";
            }

            if (arg.type === "uint256") {
              return Number(arg.value);
            }

            return arg.value;
          }),
        });

      console.log({ estimationResult });

      if (estimationResult) {
        setGasPriceEstimation({
          gasPriceWei: estimationResult.transactionCostWei,
          gasPriceEth: estimationResult.transactionCostEth,
          gasPriceValue: estimationResult.transactionCostValue,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(
        "An error occurred while estimating gas price. Your may not have enough balance to cover the transaction cost"
      );
    } finally {
      setEstimating(false);
    }
  };

  // effects
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
  }, []);

  useEffect(() => {
    // check if contract address is valid
    if (validator.isAddress(contractAddress)) {
      // fetch contract contract abi and store in state
      fetchContractAbi(contractAddress);
    } else {
      // reset contract abi
      setContractAbi(null);
    }
  }, [contractAddress]);

  useEffect(() => {
    if (contractMethod && contractAbi) {
      // remove all old args if any
      resetField("contractArgs");

      // add the args
      const method = contractAbi.find((item) => item.name === contractMethod);
      if (method) {
        const args = method.inputs.map((input) => {
          return {
            name: input.name,
            type: input.type,
            value: "",
          };
        });
        append(args);
      }
    } else {
      resetField("contractArgs");
    }
  }, [contractMethod, contractAbi]);

  return (
    <main className="container mt-10 mx-auto px-4 py-12">
      <div className="mb-6 text-center flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-200">
          Contract Transaction Gas Price Estimator
        </h1>
        <p className="text-base md:text-lg text-gray-300">
          Estimate how much gas contract write method will use
        </p>
        <Link
          href="/"
          className="text-sm md:text-base text-blue-500 hover:text-blue-400 mt-2"
        >
          Estimate normal transaction instead
          <LinkIcon className="h-3 w-3 inline-block ml-1" />
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-md mx-auto bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-gray-700">
          <div className="mb-6">
            <Label
              htmlFor="sender"
              className="text-base text-gray-300 font-medium mb-2 block"
            >
              Sender Address
            </Label>
            <div className="relative">
              <Input
                id="sender"
                {...register("senderAddress")}
                placeholder="Enter contract address"
                className="mt-1 bg-gray-700 border-2 border-transparent focus:border-purple-500 text-gray-100 placeholder-gray-400 rounded-lg shadow-inner-lg transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              />
              <div className="absolute inset-0 rounded-lg shadow-lg pointer-events-none"></div>
            </div>
            {errors.senderAddress && (
              <p className="text-sm text-red-500 mt-1">
                {errors.senderAddress.message}
              </p>
            )}
          </div>
          <div className="mb-6">
            <Label
              htmlFor="contract"
              className="text-base text-gray-300 font-medium mb-2 block"
            >
              Contract Address
            </Label>
            <div className="relative">
              <Input
                id="contract"
                {...register("contractAddress")}
                placeholder="Enter contract address"
                className="mt-1 bg-gray-700 border-2 border-transparent focus:border-purple-500 text-gray-100 placeholder-gray-400 rounded-lg shadow-inner-lg transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              />
              <div className="absolute inset-0 rounded-lg shadow-lg pointer-events-none"></div>
            </div>
            {errors.contractAddress && (
              <p className="text-sm text-red-500 mt-1">
                {errors.contractAddress.message}
              </p>
            )}
          </div>
          {/* check if loading abi */}
          {fetchingAbi && (
            <div className="mt-2 p-2 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600 flex items-center justify-center gap-1.5">
              <Loader
                size={16}
                className="h-4 w-4 text-gray-300 animate-spin"
              />
              <p className="text-sm text-gray-300 ml-2">
                fetching contract abi...
              </p>
            </div>
          )}
          {/* check if abi is available */}
          {contractAbi && (
            <>
              <div className="mb-6">
                <Label
                  htmlFor="sender"
                  className="text-base text-gray-300 font-medium mb-2 block"
                >
                  Contract Method
                </Label>
                <div className="relative">
                  <Select
                    onValueChange={(value) => setValue("contractMethod", value)}
                    value={contractMethod}
                  >
                    <SelectTrigger
                      id="method"
                      className="bg-gray-700 border-gray-600"
                    >
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {contractAbi
                        .filter(
                          (method) =>
                            method.type === "function" &&
                            (method.stateMutability === "nonpayable" ||
                              method.stateMutability === "payable")
                        )
                        .map((method) => (
                          <SelectItem
                            key={method.name}
                            value={method.name}
                            className="text-gray-100"
                          >
                            {method.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {
                // check if contract method is selected
                contractMethod && (
                  <div className="mb-6">
                    {contractAbi
                      .find((item) => item.name === contractMethod)
                      ?.inputs.map((input, index) => (
                        <div key={index} className="space-y-2">
                          <Label
                            htmlFor="value"
                            className="text-base text-gray-300 font-medium mb-2 block"
                          >
                            {input.name}
                          </Label>
                          <div className="relative">
                            <Input
                              id="value"
                              {...register(
                                `contractArgs.${index}.value` as const
                              )}
                              placeholder={`Enter ${input.type}`}
                              className="mt-1 bg-gray-700 border-2 border-transparent focus:border-purple-500 text-gray-100 placeholder-gray-400 rounded-lg shadow-inner-lg transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                            />
                            <div className="absolute inset-0 rounded-lg shadow-lg pointer-events-none"></div>
                          </div>
                          {/* erro */}
                        </div>
                      ))}
                  </div>
                )
              }
            </>
          )}
          <Button
            size="lg"
            type={!isConnected ? "button" : "submit"}
            {...(!isConnected && { onClick: connectWallet })}
            disabled={estimating}
            className="w-full mt-4 mb-6 relative overflow-hidden group bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-out hover:shadow-pink-500/25 hover:shadow-xl"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
            <span className="relative flex items-center justify-center">
              {!isConnected && (
                <>
                  <WalletIcon className="mr-2 h-5 w-5" /> Connect Wallet
                </>
              )}
              {isConnected && (
                <>
                  {estimating ? (
                    <>
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                      Estimating Gas Price
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Estimate Gas Price
                    </>
                  )}
                </>
              )}
            </span>
          </Button>
          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-gray-600">
            <h2 className="text-lg font-semibold mb-2 text-gray-200">
              Estimated Gas Price
            </h2>
            <div>
              {gasPriceEstimation ? (
                <div className="flex gap-2">
                  <p className="text-lg font-bold text-purple-400">
                    {gasPriceEstimation.gasPriceEth} ETH
                  </p>
                  <p className="text-base font-bold text-pink-400">
                    ({" "}
                    {PriceFormatter.formatUsd(gasPriceEstimation.gasPriceValue)}{" "}
                    )
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-300">
                  Please submit the form to estimate gas price
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
