const PAYBOX_BASE = process.env.PAYBOX_API_URL || "https://api.paybox.sh";

export interface PayBoxVault {
  id: string;
  name: string;
  address: string;
  chain: string;
  balance: string;
  limits: {
    perTransaction: string;
    daily: string;
    monthly: string;
  };
  policies: string[];
  createdAt: string;
}

export interface PayBoxPolicy {
  id: string;
  name: string;
  rules: {
    type: string;
    chains?: string[];
    maxSpend?: string;
    allowedTokens?: string[];
    allowedRecipients?: string[];
  }[];
  action: "allow" | "deny";
  priority: number;
}

export interface PayBoxTransaction {
  id: string;
  type: "send" | "sign" | "auth";
  chain: string;
  token: string;
  amount: string;
  recipient: string;
  status: "pending" | "confirmed" | "failed";
  txHash: string | null;
  timestamp: string;
}

function getAuthHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function payboxRequest(
  method: string,
  params: Record<string, unknown> = {},
  token?: string
): Promise<any> {
  const res = await fetch(`${PAYBOX_BASE}/mcp`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayBox ${method}: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`PayBox ${method}: ${data.error.message || data.error.code}`);
  }
  return data.result;
}

export async function listPayBoxTools(token?: string): Promise<any[]> {
  const result = await payboxRequest("tools/list", {}, token);
  return result?.tools || [];
}

export async function createPayBoxVault(
  name: string,
  passphrase: string,
  token?: string
): Promise<PayBoxVault> {
  return payboxRequest("vault/create", { name, passphrase }, token);
}

export async function listPayBoxVaults(token?: string): Promise<PayBoxVault[]> {
  const result = await payboxRequest("vault/list", {}, token);
  return result?.vaults || [];
}

export async function getPayBoxBalance(
  vaultId: string,
  token?: string
): Promise<{ balance: string; tokens: any[] }> {
  return payboxRequest("vault/balance", { vaultId }, token);
}

export async function signWithPayBox(
  vaultId: string,
  message: string,
  passphrase: string,
  token?: string
): Promise<{ signature: string; publicKey: string }> {
  return payboxRequest("vault/sign", { vaultId, message, passphrase }, token);
}

export async function sendWithPayBox(
  vaultId: string,
  recipient: string,
  amount: string,
  tokenMint: string,
  passphrase: string,
  token?: string
): Promise<PayBoxTransaction> {
  return payboxRequest(
    "vault/send",
    { vaultId, recipient, amount, tokenMint, passphrase },
    token
  );
}

export async function createPayBoxPolicy(
  policy: PayBoxPolicy,
  token?: string
): Promise<PayBoxPolicy> {
  return payboxRequest("policy/create", { policy }, token);
}

export async function listPayBoxPolicies(token?: string): Promise<PayBoxPolicy[]> {
  const result = await payboxRequest("policy/list", {}, token);
  return result?.policies || [];
}

export function buildAnsemPayBoxPolicy(): PayBoxPolicy {
  return {
    id: `ansemrail-paybox-ansem-${Date.now()}`,
    name: "AnsemRail Ansem-Only Policy",
    rules: [
      {
        type: "allowed_chains",
        chains: ["solana"],
      },
      {
        type: "allowed_tokens",
        allowedTokens: [
          "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
          "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump",
          "So11111111111111111111111111111111111111112",
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        ],
      },
      {
        type: "max_spend",
        maxSpend: "100",
      },
    ],
    action: "deny",
    priority: 1,
  };
}

export function buildSpendLimitPayBoxPolicy(
  maxPerTx: number,
  maxPerDay: number
): PayBoxPolicy {
  return {
    id: `ansemrail-paybox-spend-${Date.now()}`,
    name: `AnsemRail Spend Limit (${maxPerTx}/tx, ${maxPerDay}/day)`,
    rules: [
      {
        type: "allowed_chains",
        chains: ["solana"],
      },
      {
        type: "max_spend",
        maxSpend: String(maxPerTx),
      },
      {
        type: "daily_limit",
        maxSpend: String(maxPerDay),
      },
    ],
    action: "deny",
    priority: 2,
  };
}

export async function authenticateWithPayBox(
  agentToken: string
): Promise<{ payboxToken: string; vaultId: string }> {
  return payboxRequest("auth/agent", { agentToken });
}
