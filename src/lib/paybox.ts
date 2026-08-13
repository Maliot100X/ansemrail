const PAYBOX_BASE = process.env.PAYBOX_API_URL || "https://api.paybox.sh";
const PAYBOX_TOKEN = process.env.PAYBOX_AUTH_TOKEN || "";

export interface PayBoxCredential {
  credential_id: string;
  kind: string;
  name: string;
  approval_mode: string;
  metadata: {
    address: string;
    chains: string[];
    provider_wallet_id?: string;
  };
}

export interface PayBoxPortfolio {
  address: string;
  chain: string;
  total_usd: number;
  items: Array<{
    token: string;
    symbol: string;
    amount: string;
    usd_value: number;
    decimals: number;
  }>;
}

export interface PayBoxTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface PayBoxService {
  id: string;
  name: string;
  description: string;
  url: string;
  pricing: string;
}

export interface PayBoxRequest {
  request_id: string;
  status: string;
  approval_url?: string;
  output?: {
    value: Record<string, unknown>;
  };
}

export interface PayBoxTransaction {
  id: string;
  type: "send" | "sign" | "swap";
  chain: string;
  token: string;
  amount: string;
  recipient: string;
  status: "pending" | "confirmed" | "failed";
  txHash: string | null;
  timestamp: string;
}

let mcpInitialized = false;
let mcpSessionHeaders: Record<string, string> = {};

function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  const authToken = token || PAYBOX_TOKEN;
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

function parseMcpResponse(text: string): any {
  if (text.startsWith("event:")) {
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data:")) {
        try {
          return JSON.parse(line.slice(5).trim());
        } catch {}
      }
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`PayBox: unparseable response: ${text.slice(0, 200)}`);
  }
}

export async function ensureMcpInitialized(token?: string): Promise<void> {
  if (mcpInitialized) return;

  const res = await fetch(`${PAYBOX_BASE}/mcp`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "ansemrail", version: "1.0" },
      },
    }),
  });

  if (res.status === 406) {
    throw new Error(
      "PayBox MCP requires Accept: application/json, text/event-stream header"
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayBox initialize: ${res.status} ${text.slice(0, 200)}`);
  }

  const sessionId = res.headers.get("mcp-session-id");
  if (sessionId) {
    mcpSessionHeaders["mcp-session-id"] = sessionId;
  }

  await fetch(`${PAYBOX_BASE}/mcp`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), ...mcpSessionHeaders },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    }),
  });

  mcpInitialized = true;
}

export async function payboxCall(
  method: string,
  params: Record<string, unknown> = {},
  token?: string
): Promise<any> {
  let res: Response;
  try {
    await ensureMcpInitialized(token);
    res = await fetch(`${PAYBOX_BASE}/mcp`, {
      method: "POST",
      headers: { ...getAuthHeaders(token), ...mcpSessionHeaders },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });
  } catch {
    throw new Error(
      "PayBox MCP endpoint is not reachable. The service may be down. Set PAYBOX_API_URL and PAYBOX_AUTH_TOKEN."
    );
  }

  if (res.status === 404) {
    throw new Error(
      "PayBox MCP endpoint returned 404. Ensure PAYBOX_API_URL points to the live MCP server."
    );
  }
  if (res.status === 406) {
    mcpInitialized = false;
    throw new Error(
      "PayBox MCP requires Accept: application/json, text/event-stream header."
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayBox ${method}: ${res.status} ${text.slice(0, 200)}`);
  }

  const rawText = await res.text();
  const data = parseMcpResponse(rawText);

  if (data.error) {
    throw new Error(`PayBox ${method}: ${data.error.message || data.error.code}`);
  }
  return data.result;
}

export async function payboxToolCall(
  toolName: string,
  args: Record<string, unknown> = {},
  token?: string
): Promise<any> {
  const result = await payboxCall(
    "tools/call",
    { name: toolName, arguments: args },
    token
  );
  if (result?.content?.[0]?.text) {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return result.content[0].text;
    }
  }
  return result;
}

export async function payboxRequest(
  method: string,
  params: Record<string, unknown> = {},
  token?: string
): Promise<any> {
  return payboxCall(method, params, token);
}

export async function listPayBoxTools(token?: string): Promise<PayBoxTool[]> {
  const result = await payboxCall("tools/list", {}, token);
  return result?.tools || [];
}

export async function listPayBoxCredentials(
  token?: string
): Promise<{ credentials: PayBoxCredential[]; ungranted: PayBoxCredential[] }> {
  return payboxToolCall("list_credentials", {}, token);
}

export async function listPayBoxVaults(
  token?: string
): Promise<PayBoxCredential[]> {
  const result = await listPayBoxCredentials(token);
  return result?.credentials || [];
}

export async function getPayBoxPortfolio(
  credentialId: string,
  token?: string
): Promise<PayBoxPortfolio> {
  return payboxToolCall("get_portfolio", { credential_id: credentialId }, token);
}

export async function getPayBoxBalance(
  credentialId: string,
  token?: string
): Promise<PayBoxPortfolio> {
  return getPayBoxPortfolio(credentialId, token);
}

export async function requestPayBoxTransfer(
  credentialId: string,
  chain: string,
  to: string,
  amount: string,
  token?: string,
  tokenMint?: string
): Promise<PayBoxRequest> {
  const args: Record<string, unknown> = {
    credential_id: credentialId,
    chain,
    to,
    amount,
  };
  if (tokenMint) args.token = tokenMint;
  return payboxToolCall("request_transfer", args, token);
}

export async function requestPayBoxSwap(
  credentialId: string,
  srcChain: string,
  srcToken: string,
  dstToken: string,
  amount: string,
  token?: string
): Promise<PayBoxRequest> {
  return payboxToolCall(
    "request_swap",
    {
      credential_id: credentialId,
      src_chain: srcChain,
      src_token: srcToken,
      dst_token: dstToken,
      amount,
    },
    token
  );
}

export async function requestPayBoxSign(
  credentialId: string,
  intent: Record<string, unknown>,
  token?: string
): Promise<PayBoxRequest> {
  return payboxToolCall(
    "request_wallet_sign",
    { credential_id: credentialId, intent },
    token
  );
}

export async function signWithPayBox(
  credentialId: string,
  message: string,
  _passphrase?: string,
  token?: string
): Promise<PayBoxRequest> {
  return requestPayBoxSign(
    credentialId,
    { op: "message", message },
    token
  );
}

export async function getPayBoxRequest(
  requestId: string,
  token?: string
): Promise<PayBoxRequest> {
  return payboxToolCall("get_request", { request_id: requestId }, token);
}

export async function discoverPayBoxServices(
  token?: string
): Promise<PayBoxService[]> {
  const result = await payboxToolCall("discover_services", {}, token);
  if (Array.isArray(result)) return result;
  return result?.services || [];
}

export async function getPayBoxBuyLink(
  credentialId: string,
  chain: string,
  token?: string
): Promise<{ url: string }> {
  return payboxToolCall(
    "get_buy_link",
    { credential_id: credentialId, chain },
    token
  );
}

export async function usePayBoxService(
  credentialId: string,
  url: string,
  method?: string,
  body?: Record<string, unknown>,
  token?: string
): Promise<any> {
  const args: Record<string, unknown> = {
    credential_id: credentialId,
    url,
  };
  if (method) args.method = method;
  if (body) args.body = body;
  return payboxToolCall("use_service", args, token);
}

export async function verifySolanaBalance(
  address: string,
  tokenMint: string,
  txSignature: string,
  token?: string
): Promise<any> {
  return payboxToolCall(
    "verify_solana_balance",
    {
      address,
      token_mint: tokenMint,
      transaction_signature: txSignature,
    },
    token
  );
}

export async function worldFindMarkets(
  params: {
    events?: boolean;
    status?: string;
    limit?: number;
    cursor?: number;
  } = {},
  token?: string
): Promise<any> {
  return payboxToolCall("world_find_markets", params, token);
}

export async function worldGetMarket(
  eventTicker: string,
  token?: string
): Promise<any> {
  return payboxToolCall(
    "world_get_market",
    { event_ticker: eventTicker },
    token
  );
}

export async function worldPositions(
  address: string,
  token?: string
): Promise<any> {
  return payboxToolCall("world_positions", { address }, token);
}

export async function worldBuyOutcome(
  credentialId: string,
  marketMint: string,
  size: string,
  token?: string
): Promise<PayBoxRequest> {
  return payboxToolCall(
    "world_buy_outcome",
    { credential_id: credentialId, market_mint: marketMint, size },
    token
  );
}

export function buildAnsemPayBoxPolicy() {
  return {
    id: `ansemrail-paybox-ansem-${Date.now()}`,
    name: "AnsemRail Ansem-Only Policy",
    rules: [
      { type: "allowed_chains", chains: ["solana"] },
      {
        type: "allowed_tokens",
        allowedTokens: [
          "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
          "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump",
          "So11111111111111111111111111111111111111112",
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        ],
      },
      { type: "max_spend", maxSpend: "100" },
    ],
    action: "deny",
    priority: 1,
  };
}

export function buildSpendLimitPayBoxPolicy(
  maxPerTx: number,
  maxPerDay: number
) {
  return {
    id: `ansemrail-paybox-spend-${Date.now()}`,
    name: `AnsemRail Spend Limit (${maxPerTx}/tx, ${maxPerDay}/day)`,
    rules: [
      { type: "allowed_chains", chains: ["solana"] },
      { type: "max_spend", maxSpend: String(maxPerTx) },
      { type: "daily_limit", maxSpend: String(maxPerDay) },
    ],
    action: "deny",
    priority: 2,
  };
}

export async function createPayBoxVault(
  _name: string,
  _passphrase: string,
  token?: string
): Promise<any> {
  throw new Error(
    "PayBox uses credential-based wallets, not vault creation. Use list_credentials to see your wallets."
  );
}

export async function createPayBoxPolicy(
  _policy: unknown,
  _token?: string
): Promise<any> {
  throw new Error(
    "PayBox policies are managed via access grants. Use request_account_change to modify credential access."
  );
}

export async function listPayBoxPolicies(
  token?: string
): Promise<any[]> {
  const creds = await listPayBoxCredentials(token);
  return creds?.credentials || [];
}

export async function authenticateWithPayBox(
  _agentToken: string
): Promise<any> {
  throw new Error(
    "PayBox authentication uses Bearer token via PAYBOX_AUTH_TOKEN env var, not agent token exchange."
  );
}

export async function sendWithPayBox(
  credentialId: string,
  recipient: string,
  amount: string,
  tokenMint: string,
  _passphrase?: string,
  token?: string
): Promise<PayBoxRequest> {
  return requestPayBoxTransfer(
    credentialId,
    "solana:mainnet",
    recipient,
    amount,
    token,
    tokenMint
  );
}
