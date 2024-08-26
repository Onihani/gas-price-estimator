class PriceFormatter {
  static formatUsd(price: string): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    return Number(price) < 0.01
      ? `≤ ${formatter.format(0.01)}`
      : `≈ ${formatter.format(parseFloat(price))}`;
  }

  static formatEth(price: string): string {
    // make the value come before the currency symbol
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETH",
    });

    return Number(price) < 0.01
      ? `≤ ${formatter.format(parseFloat("0.01"))}`
      : `≈ ${formatter.format(parseFloat(price))}`;
  }
}

export default PriceFormatter;
