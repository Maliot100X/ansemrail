const MOONPAY_BASE = "https://agents.moonpay.com";

export interface MoonPayToken {
  address: string;
  name: string;
  symbol: string;
  image: string;
  chain: string;
  decimals: number;
  description?: string;
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

export const CLAW_TOKEN_MINT =
  process.env.CLAW_TOKEN_MINT || "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump";

export async function getAnsemTokenInfo(): Promise<MoonPayToken> {
  return getTokenDetails(ANSEM_TOKEN_MINT, "solana");
}

export async function getClawTokenInfo(): Promise<MoonPayToken> {
  return getTokenDetails(CLAW_TOKEN_MINT, "solana");
}

export const SOLANA_SKILLS = [
  {
    name: "Common Errors & Solutions",
    slug: "solana-common-errors",
    description: "Diagnose and fix common errors: GLIBC issues, Anchor version conflicts, RPC errors",
    category: "Reference",
    url: "https://solana.com/skills",
  },
  {
    name: "Version Compatibility Matrix",
    slug: "solana-version-compat",
    description: "Reference table for Anchor, Solana CLI, Rust, and Node.js version matching",
    category: "Tooling",
    url: "https://solana.com/skills",
  },
  {
    name: "Solana Runtime Concepts",
    slug: "solana-runtime",
    description: "Rent as deposit, Ed25519 keys, PDAs, entrypoint dispatch, on-chain crypto, transaction wire format",
    category: "Skill",
    url: "https://solana.com/skills",
  },
  {
    name: "Confidential Transfers",
    slug: "solana-confidential-transfers",
    description: "Private encrypted token balances using Token-2022 confidential transfers extension",
    category: "Tokens",
    url: "https://solana.com/skills",
  },
  {
    name: "Frontend with Solana Kit",
    slug: "solana-frontend-kit",
    description: "React/Next.js Solana apps with Kit plugin client, Wallet Standard, React hooks",
    category: "Skill",
    url: "https://solana.com/skills",
  },
  {
    name: "IDL & Client Code Generation",
    slug: "solana-idl-codegen",
    description: "Type-safe program clients from IDLs using Codama — no hand-maintained serializers",
    category: "Tooling",
    url: "https://solana.com/skills",
  },
  {
    name: "Kit ↔ web3.js Interop",
    slug: "solana-kit-web3js",
    description: "Handle legacy web3.js code — web3.js v3 (Kit internals) migration path",
    category: "Tooling",
    url: "https://solana.com/skills",
  },
  {
    name: "Payments & Commerce",
    slug: "solana-payments",
    description: "Checkout flows, payment buttons, QR payments via Solana Pay, Kit builders, Kora gasless",
    category: "Payments",
    url: "https://solana.com/skills",
  },
  {
    name: "Curated Resources",
    slug: "solana-resources",
    description: "Official Solana learning platforms, docs, tooling references, community resources",
    category: "Reference",
    url: "https://solana.com/skills",
  },
  {
    name: "RPC Quick Lookups",
    slug: "solana-rpc-lookups",
    description: "Fast RPC endpoint lookups and best practices for Solana mainnet/devnet",
    category: "Skill",
    url: "https://solana.com/skills",
  },
  {
    name: "Security Checklist",
    slug: "solana-security",
    description: "Account validation, signer checks, common attack vectors — review before deploying",
    category: "Security",
    url: "https://solana.com/skills",
  },
  {
    name: "Testing Strategy",
    slug: "solana-testing",
    description: "LiteSVM + Mollusk unit tests, Surfpool integration tests, mainnet forking, CI patterns",
    category: "Testing",
    url: "https://solana.com/skills",
  },
] as const;
