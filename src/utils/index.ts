export { default as PriceFormatter } from "./price-formatter";
export { default as PriceConverter } from "./price-converter";

export const truncateAddress = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;
