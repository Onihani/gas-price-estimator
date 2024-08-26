// imports
import Web3 from "web3";
import axios from "axios";
import {
  ChainlinkPlugin,
  MainnetPriceFeeds,
} from "@chainsafe/web3-plugin-chainlink";

class PriceConverter {
  private web3: Web3;
  private priceFeed: string;

  constructor({
    web3 = new Web3(window ? window.ethereum : undefined),
    priceFeed = MainnetPriceFeeds.EthUsd,
  }: {
    web3?: Web3;
    priceFeed?: string;
  }) {
    this.web3 = web3;
    this.priceFeed = priceFeed ?? MainnetPriceFeeds.EthUsd;

    // check if plugin is registered
    if (!this.web3.chainlink) {
      this.web3.registerPlugin(new ChainlinkPlugin());
    }
  }

  async toTokenValue(priceValue: number): Promise<string> {
    const priceFeedResult = await this.web3.chainlink.getPrice(this.priceFeed);
    const priceFeedAnswer = this.web3.utils.toBigInt(
      priceFeedResult.answer.toString()
    );
    const feedAnswerNumber = this.web3.utils.fromWei(priceFeedAnswer, 8);

    const result = priceValue / Number(feedAnswerNumber);

    return result.toString();
  }

  async toPriceValue(tokenValue: string): Promise<string> {
    const priceFeedResult = await this.web3.chainlink.getPrice(this.priceFeed);
    const priceFeedAnswer = this.web3.utils.toBigInt(
      priceFeedResult.answer.toString()
    );
    const tokenValueWei = this.web3.utils.toWei(tokenValue.toString(), "ether");

    const result = this.web3.utils.toBigInt(tokenValueWei) * priceFeedAnswer;

    const formattedPrice = this.web3.utils.fromWei(result, 18 + 8);

    return formattedPrice.toString();
  }

  async getCurrentGasPrice(): Promise<{
    gasPriceWei: string;
    gasPriceEth: string;
    gasPriceValue: string;
  }> {
    const gasPriceWei = await this.web3.eth.getGasPrice();
    const gasPriceEth = this.web3.utils.fromWei(gasPriceWei, "ether");

    const gasPriceValue = await this.toPriceValue(gasPriceEth);

    return {
      gasPriceWei: gasPriceWei.toString(),
      gasPriceEth,
      gasPriceValue,
    };
  }

  async estimateTransactionCost({
    fromAddress,
    toAddress,
    value,
  }: {
    fromAddress: string;
    toAddress: string;
    value: number;
  }): Promise<{
    transferCostWei: string;
    transferCostEth: string;
    transferCostValue: string;
  }> {
    const getCurrentGasPrice = await this.web3.eth.getGasPrice();
    const transferGas = await this.web3.eth.estimateGas({
      from: fromAddress,
      to: toAddress,
      nonce: await this.web3.eth.getTransactionCount(fromAddress),
      value: this.web3.utils.toWei(value.toString(), "ether"),
    });

    const transactionCostWei = getCurrentGasPrice * transferGas;
    const transactionCostEth = this.web3.utils.fromWei(
      transactionCostWei,
      "ether"
    );

    const transferCostValue = await this.toPriceValue(transactionCostEth);

    return {
      transferCostWei: transactionCostWei.toString(),
      transferCostEth: transactionCostEth,
      transferCostValue,
    };
  }

  async estimateContractTransactionCost({
    chainId = 1,
    senderAddress,
    contractAddress,
    method,
    args,
  }: {
    chainId: number;
    senderAddress: string;
    contractAddress: string;
    method: string;
    args?: any[];
  }) {
    const response = await axios.get(
      `https://anyabi.xyz/api/get-abi/${chainId}/${contractAddress}`
    );
    const data = response.data as { abi: any[] };

    const contract = new this.web3.eth.Contract(data.abi, contractAddress);
    const contractGas = await contract.methods[method](
      ...(args ?? [])
    ).estimateGas({
      from: senderAddress ?? "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", // defaults to vitalik buterin's address
    });

    const getCurrentGasPrice = await this.web3.eth.getGasPrice();
    const transactionCostWei = getCurrentGasPrice * contractGas;

    const transactionCostEth = this.web3.utils.fromWei(
      transactionCostWei,
      "ether"
    );
    const transactionCostValue = await this.toPriceValue(transactionCostEth);

    return {
      transactionCostWei: transactionCostWei.toString(),
      transactionCostEth,
      transactionCostValue,
    };
  }
}

export default PriceConverter;
