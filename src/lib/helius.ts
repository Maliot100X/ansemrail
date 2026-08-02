const HELIUS_RPC = process.env.HELIUS_RPC_URL || "";

export async function heliusRpc(method: string, params: any[] = []): Promise<any> {
  const res = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Helius RPC ${method}: ${res.status}`);
  return res.json();
}

export async function getBalance(address: string): Promise<number> {
  const data = await heliusRpc("getBalance", [address]);
  return data.result?.value || 0;
}

export async function getTokenAccountsByOwner(
  owner: string
): Promise<any[]> {
  const data = await heliusRpc("getTokenAccountsByOwner", [
    owner,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);
  return data.result?.value || [];
}

export async function getTransactionHistory(
  address: string,
  limit = 20
): Promise<any> {
  const apiKey = process.env.HELIUS_API_KEY;
  const res = await fetch(
    `https://mainnet.helius-rpc.com/v0/addresses/${address}/transactions/?api-key=${apiKey}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Helius tx history: ${res.status}`);
  return res.json();
}

export async function parseTransaction(txHash: string): Promise<any> {
  const apiKey = process.env.HELIUS_API_KEY;
  const res = await fetch(
    `https://mainnet.helius-rpc.com/v0/transactions/?api-key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: [txHash] }),
    }
  );
  if (!res.ok) throw new Error(`Helius parseTx: ${res.status}`);
  return res.json();
}

export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function evmRpcUrl(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (key) return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
  return "https://eth.llamarpc.com";
}

async function evmRpc(method: string, params: any[] = []): Promise<any> {
  const res = await fetch(evmRpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`EVM RPC ${method}: ${res.status}`);
  return res.json();
}

export async function getEthBalance(address: string): Promise<string> {
  const data = await evmRpc("eth_getBalance", [address, "latest"]);
  if (data.error) throw new Error(`EVM eth_getBalance: ${data.error.message}`);
  return data.result;
}

export async function getEvmTokenBalances(address: string): Promise<any[]> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return [];
  const data = await evmRpc("alchemy_getTokenBalances", [address]);
  if (data.error) return [];
  const balances = data.result?.tokenBalances || [];
  return balances
    .filter((b: any) => b.tokenBalance && b.tokenBalance !== "0")
    .map((b: any) => ({
      mint: b.contractAddress,
      amount: Number(BigInt(b.tokenBalance)) / 1e18,
      rawBalance: b.tokenBalance,
    }));
}
