"use client";

// react
import { useState, useLayoutEffect, useRef } from "react";
//  next
import Link from "next/link";
// import
import { Web3 } from "web3";
import { toast } from "sonner";
import { Link as LinkIcon, Loader, Zap } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// utils
import { PriceConverter, PriceFormatter } from "@/utils";

// schemas
import { formSchema, FormValues } from "@/common/transaction-form.schema";

export default function Home() {
  const web3Ref = useRef<Web3>(new Web3());
  // utils
  const priceConverter = new PriceConverter({
    web3: web3Ref.current,
  });

  // state
  const [estimating, setEstimating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState("");
  const [gasPriceEstimation, setGasPriceEstimation] = useState<{
    gasPriceWei: string;
    gasPriceEth: string;
    gasPriceValue: string;
  } | null>(null);

  // hooks
  const {
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // derived state
  const isUsd = watch("amount.isUsd");
  const amount = watch("amount.value");

  // handlers
  // Simulated conversion function (replace with actual conversion logic)
  const convertAmount = async (value: string, fromUsd: boolean) => {
    setConverting(true);

    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return "";

      const convertedPrice = fromUsd
        ? await priceConverter.toTokenValue(numValue)
        : await priceConverter.toPriceValue(numValue.toString());

      setConvertedAmount(convertedPrice);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while converting price");
    } finally {
      setConverting(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data, event) => {
    event?.preventDefault();
    setEstimating(true);

    try {
      const { fromAddress, toAddress, amount } = data;
      const ethAmount = amount.isUsd ? convertedAmount : amount.value;

      // Estimate transfer cost
      const estimationResult = await priceConverter.estimateTransactionCost({
        fromAddress,
        toAddress,
        value: parseFloat(ethAmount),
      });

      setGasPriceEstimation({
        gasPriceWei: estimationResult.transferCostWei,
        gasPriceEth: estimationResult.transferCostEth,
        gasPriceValue: estimationResult.transferCostValue,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        "An error occurred while estimating gas price. Sender account may not have enough balance to cover the transaction cost"
      );
    } finally {
      setEstimating(false);
    }
  };

  // effects
  useLayoutEffect(() => {
    if (window.ethereum) {
      // set web3 provider
      web3Ref.current.setProvider(window.ethereum);
    }
  }, []);

  useLayoutEffect(() => {
    convertAmount(amount, isUsd);
  }, [amount, isUsd]);

  return (
    <main className="container mt-10 mx-auto px-4 py-12">
      <div className="mb-6 text-center flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-200">
          Transaction Gas Price Estimator
        </h1>
        <p className="text-base md:text-lg text-gray-300">
          Estimate the gas price of a transaction from one address to another
        </p>
        <Link
          href="/contract"
          className="text-sm md:text-base text-blue-500 hover:text-blue-400 mt-2"
        >
          Estimate contract transaction instead
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
                {...register("fromAddress")}
                placeholder="Enter sender address"
                className="mt-1 bg-gray-700 border-2 border-transparent focus:border-purple-500 text-gray-100 placeholder-gray-400 rounded-lg shadow-inner-lg transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              />
              <div className="absolute inset-0 rounded-lg shadow-lg pointer-events-none"></div>
            </div>
            {errors.fromAddress && (
              <p className="text-sm text-red-500 mt-1">
                {errors.fromAddress.message}
              </p>
            )}
          </div>
          <div className="mb-6">
            <Label
              htmlFor="recipient"
              className="text-base text-gray-300 font-medium block"
            >
              Recipient Address
            </Label>
            <div className="relative">
              <Input
                id="recipient"
                {...register("toAddress")}
                placeholder="Enter recipient address"
                className="mt-1 bg-gray-700 border-2 border-transparent focus:border-pink-500 text-gray-100 placeholder-gray-400 rounded-lg shadow-inner-lg transition-all duration-300 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
              />
              <div className="absolute inset-0 rounded-lg shadow-lg pointer-events-none"></div>
            </div>
            {errors.toAddress && (
              <p className="text-sm text-red-500 mt-1">
                {errors.toAddress.message}
              </p>
            )}
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="amount"
                className="text-base text-gray-300 font-medium"
              >
                Amount
              </Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="currency-toggle" className="text-gray-400">
                  ETH
                </Label>
                <Switch
                  id="currency-toggle"
                  checked={isUsd}
                  onCheckedChange={() => setValue("amount.isUsd", !isUsd)}
                  className="data-[state=checked]:bg-purple-500"
                />
                <Label htmlFor="currency-toggle" className="text-gray-400">
                  USD
                </Label>
              </div>
            </div>
            <div className="relative">
              <Input
                id="amount"
                step="any"
                type="number"
                {...register("amount.value")}
                placeholder={`Enter amount in ${isUsd ? "USD" : "ETH"}`}
                className="mt-1 bg-gray-700 border-2 border-transparent focus:border-blue-500 text-gray-100 placeholder-gray-400 rounded-lg shadow-inner-lg transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
              <div className="absolute inset-0 rounded-lg shadow-lg pointer-events-none"></div>
            </div>
            {Boolean(amount && !converting) && (
              <div className="mt-2 p-2 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300">
                  ≈ {convertedAmount} {isUsd ? "ETH" : "USD"}
                </p>
              </div>
            )}
            {converting && (
              <div className="mt-2 p-2 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600 flex items-center justify-center gap-1.5">
                <Loader
                  size={16}
                  className="h-4 w-4 text-gray-300 animate-spin"
                />
                <p className="text-sm text-gray-300 ml-2">
                  calculating price...
                </p>
              </div>
            )}

            {errors.amount?.value && (
              <p className="text-sm text-red-500 mt-1">
                {errors.amount.value.message}
              </p>
            )}
          </div>
          <Button
            size="lg"
            type="submit"
            disabled={estimating}
            className="w-full mt-4 mb-6 relative overflow-hidden group bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-out hover:shadow-pink-500/25 hover:shadow-xl"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
            <span className="relative flex items-center justify-center">
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
