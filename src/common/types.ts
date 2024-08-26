type AbiItem = {
  name: string;
  inputs: Array<{ type: string; name: string; indexed: boolean }>;
  outputs: Array<{ type: string; name: string }>;
  constant: boolean;
  payable: boolean;
  type: string;
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  anonymous: boolean;
};

export type ABIType = Array<AbiItem>;
