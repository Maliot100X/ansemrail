const CLAWPUMP_BASE = "https://clawpump.tech";

function getApiKey(): string {
  return process.env.CLAWPUMP_API_KEY || "";
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface ClawPumpAgent {
  id: string;
  name: string;
  status: string;
  walletAddress: string;
  skills: string[];
  model: string;
  persona: string;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  meta?: { timestamp: string; requestId: string };
}

export interface ClawPumpSkill {
  slug: string;
  name: string;
  description: string;
  alwaysOn: boolean;
}

export interface ClawPumpToken {
  mintAddress: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  marketCap: number;
  price: number;
  volume24h: number;
  volumeAllTime: number;
  liquidity: number;
  agentId: string;
  agentName: string;
  isGraduated: boolean;
  verified: boolean;
  source: string;
  launchPlatform: string;
  createdAt: string;
}

export async function listAgents(): Promise<ClawPumpAgent[]> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/agents`, {
    headers: authHeaders(),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`ClawPump listAgents: ${res.status}`);
  const data = await res.json();
  return data.agents || [];
}

export async function getAgent(agentId: string): Promise<ClawPumpAgent> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/agents/${agentId}`, {
    headers: authHeaders(),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`ClawPump getAgent: ${res.status}`);
  return res.json();
}

export async function createAgent(params: {
  name: string;
  persona?: string;
  model?: string;
  skills?: string[];
}): Promise<ClawPumpAgent> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/agents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`ClawPump createAgent: ${res.status}`);
  return res.json();
}

export async function updateAgent(
  agentId: string,
  params: Partial<Pick<ClawPumpAgent, "name" | "persona" | "model" | "skills">>
): Promise<ClawPumpAgent> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/agents/${agentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`ClawPump updateAgent: ${res.status}`);
  return res.json();
}

export async function deleteAgent(agentId: string): Promise<void> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/agents/${agentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`ClawPump deleteAgent: ${res.status}`);
}

export async function listSkills(): Promise<ClawPumpSkill[]> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/skills`, {
    headers: authHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`ClawPump listSkills: ${res.status}`);
  const data = await res.json();
  return data.skills || [];
}

export async function getTokens(
  sort: "new" | "hot" | "mcap" | "volume" = "hot",
  limit = 50,
  offset = 0
): Promise<ClawPumpToken[]> {
  const res = await fetch(
    `${CLAWPUMP_BASE}/api/tokens?sort=${sort}&limit=${limit}&offset=${offset}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`ClawPump getTokens: ${res.status}`);
  const data = await res.json();
  return data.tokens || [];
}

export async function swapQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
}): Promise<any> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/swap/quote`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      input_mint: params.inputMint,
      output_mint: params.outputMint,
      amount: params.amount,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClawPump swapQuote: ${res.status} ${text}`);
  }
  return res.json();
}

export async function launchTokenGasless(params: {
  symbol: string;
  description: string;
  name?: string;
  agentId?: string;
  imageUrl?: string;
  twitter?: string;
  website?: string;
}): Promise<any> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/launch`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClawPump launchTokenGasless: ${res.status} ${text}`);
  }
  return res.json();
}

export async function launchTokenSelfFunded(params: {
  name: string;
  symbol: string;
  description: string;
  agentId?: string;
  imageUrl?: string;
}): Promise<any> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/launch/self-funded`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClawPump launchTokenSelfFunded: ${res.status} ${text}`);
  }
  return res.json();
}

export async function browseMarketplace(
  category?: string,
  search?: string,
  limit = 20
): Promise<any> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  const res = await fetch(
    `${CLAWPUMP_BASE}/api/v1/marketplace?${params.toString()}`,
    { headers: authHeaders(), next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`ClawPump browseMarketplace: ${res.status}`);
  return res.json();
}

export async function chatWithAgent(
  agentId: string,
  message: string
): Promise<any> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/agents/${agentId}/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClawPump chatWithAgent: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getWalletSummaries(): Promise<any> {
  const res = await fetch(`${CLAWPUMP_BASE}/api/v1/wallets`, {
    headers: authHeaders(),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`ClawPump getWalletSummaries: ${res.status}`);
  return res.json();
}

export async function getAgentBalance(agentId: string): Promise<any> {
  const res = await fetch(
    `${CLAWPUMP_BASE}/api/v1/agents/${agentId}/balance`,
    { headers: authHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`ClawPump getAgentBalance: ${res.status}`);
  return res.json();
}
