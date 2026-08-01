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
