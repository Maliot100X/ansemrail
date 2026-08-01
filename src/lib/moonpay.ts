const MOONPAY_BASE = "https://agents.moonpay.com";

export interface MoonPayToken {
  address: string;
  name: string;
  symbol: string;
  image: string;
  chain: string;
  decimals: number;
  marketData: {
    liquidity: number;
    marketCap: number;
    price: number;
    priceChangePercent: Record<string, number>;
    volume: Record<string, number>;
    trades: Record<string, number>;
    buys: Record<string, number>;
    sells: Record<string, number>;
    uniqueWallets: Record<string, number>;
  };
}

export async function moonpayRequest(
  tool: string,
  params: Record<string, unknown> = {}
): Promise<any> {
  const res = await fetch(`${MOONPAY_BASE}/api/tools/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MoonPay ${tool}: ${res.status} ${text}`);
  }
  return res.json();
}

export async function searchTokens(
  query: string,
  chain = "solana",
  limit = 10
): Promise<MoonPayToken[]> {
  const data = await moonpayRequest("token_search", { query, chain, limit });
  return data.items || [];
}

export async function getTrendingTokens(
  chain = "solana",
  limit = 20,
  page = 1
): Promise<MoonPayToken[]> {
  const data = await moonpayRequest("token_trending_list", {
    chain,
    limit,
    page,
  });
  return data.items || [];
}

export async function getTokenDetails(
  token: string,
  chain = "solana"
): Promise<MoonPayToken> {
  return moonpayRequest("token_retrieve", { token, chain });
}

export async function getChainList(): Promise<any> {
  return moonpayRequest("chain_list", { testnet: false, vmId: 0 });
}

export const MOONPAY_SKILLS = [
  "moonpay-auth",
  "moonpay-block-explorer",
  "moonpay-buy-crypto",
  "moonpay-buy-the-dip",
  "moonpay-card-checkout",
  "moonpay-card-onboarding",
  "moonpay-check-wallet",
  "moonpay-commerce",
  "moonpay-deposit",
  "moonpay-discover-tokens",
  "moonpay-export-data",
  "moonpay-feedback",
  "moonpay-fund-polymarket",
  "moonpay-mcp",
  "moonpay-missions",
  "moonpay-price-alerts",
  "moonpay-swap-tokens",
  "moonpay-trading-automation",
  "moonpay-upgrade",
  "moonpay-virtual-account",
  "moonpay-x402",
] as const;

export const ANSEM_TOKEN_MINT =
  process.env.ANSEM_TOKEN_MINT || "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

export async function getAnsemTokenInfo(): Promise<MoonPayToken> {
  return getTokenDetails(ANSEM_TOKEN_MINT, "solana");
}
