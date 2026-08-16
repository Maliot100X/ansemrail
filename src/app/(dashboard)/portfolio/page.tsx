import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey, getUserPayboxApiKey } from "@/lib/auth-session";
import { listAgents } from "@/lib/clawpump";
import { getBalance } from "@/lib/helius";
import { getTokenDetails } from "@/lib/moonpay";
import { listPayBoxCredentials, getPayBoxPortfolio } from "@/lib/paybox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd, shortAddress } from "@/lib/utils";
import { Wallet as WalletIcon, Bot, Shield, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

const WSOL_MINT = "So11111111111111111111111111111111111111112";

export default async function PortfolioPage() {
  let userApiKey: string | undefined;
  let userPayboxKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) {
      userApiKey = await getUserClawpumpApiKey(userId);
      userPayboxKey = await getUserPayboxApiKey(userId);
    }
  } catch {}

  const [agentsRes, solRes, payboxCredsRes] = await Promise.allSettled([
    userApiKey ? listAgents(userApiKey) : Promise.resolve([]),
    getTokenDetails(WSOL_MINT, "solana"),
    listPayBoxCredentials(userPayboxKey),
  ]);

  const clawpumpAgents = agentsRes.status === "fulfilled" ? agentsRes.value : [];
  const solPrice = solRes.status === "fulfilled"
    ? (solRes.value as any)?.marketData?.price
    : null;
  const creds = payboxCredsRes.status === "fulfilled"
    ? payboxCredsRes.value?.credentials || []
    : [];

  const agentBalances = await Promise.all(
    clawpumpAgents.map(async (a) => {
      if (!a.walletAddress) return { agentId: a.id, sol: 0 };
      try {
        const lamports = await getBalance(a.walletAddress);
        return { agentId: a.id, sol: (lamports || 0) / 1e9 };
      } catch {
        return { agentId: a.id, sol: 0 };
      }
    })
  );
  const solByAgent = new Map(agentBalances.map((b) => [b.agentId, b.sol]));
  const totalSol = agentBalances.reduce((sum, b) => sum + b.sol, 0);

  const payboxPortfolios = await Promise.all(
    creds.slice(0, 4).map(async (c: any) => {
      try {
        const p = await getPayBoxPortfolio(c.credential_id, userPayboxKey);
        return { credential: c, portfolio: p };
      } catch {
        return { credential: c, portfolio: null };
      }
    })
  );

  const payboxTotal = payboxPortfolios.reduce(
    (sum, p) => sum + (p.portfolio?.total_usd || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Portfolio</h1>
        <p className="text-sm text-zinc-400">
          Your ClawPump agents, on-chain balances, and PayBox wallets — all from your own connected keys
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-500" /> ClawPump Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{clawpumpAgents.length}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {userApiKey ? "Connected to your ClawPump key" : "No ClawPump key connected"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" /> On-Chain SOL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{totalSol.toFixed(4)} SOL</div>
            <p className="text-xs text-zinc-500 mt-1">
              {solPrice ? `${formatUsd(totalSol * solPrice)} across your agents` : "Across your agent wallets"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" /> PayBox Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{creds.length}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {creds.length > 0 ? `${formatUsd(payboxTotal)} total balance` : "No PayBox key connected"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your ClawPump Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {clawpumpAgents.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">
              No ClawPump agents on the connected key. Create one in the Agents tab.
            </p>
          ) : (
            <div className="space-y-3">
              {clawpumpAgents.map((a) => {
                const sol = solByAgent.get(a.id) || 0;
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div>
                      <p className="font-medium text-zinc-100">{a.name}</p>
                      <p className="text-xs font-mono text-zinc-500">{a.id}</p>
                      {a.walletAddress ? (
                        <p className="text-xs font-mono text-zinc-500">{shortAddress(a.walletAddress)}</p>
                      ) : (
                        <p className="text-xs text-zinc-600">No wallet</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-200">{sol.toFixed(4)} SOL</p>
                        {solPrice ? (
                          <p className="text-xs text-zinc-500">{formatUsd(sol * solPrice)}</p>
                        ) : null}
                      </div>
                      <Badge variant={a.status === "running" ? "success" : "secondary"}>{a.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {creds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PayBox Wallets (real balances)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {payboxPortfolios.map(({ credential, portfolio }) => (
                <div key={credential.credential_id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-zinc-100">{credential.name}</p>
                    <Badge variant="ansem">{credential.kind}</Badge>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 mt-1 break-all">
                    {credential.metadata?.address || "—"}
                  </p>
                  <p className="text-sm text-zinc-300 mt-2">
                    Balance: {formatUsd(portfolio?.total_usd ?? 0)}
                  </p>
                  {(portfolio?.items || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {(portfolio?.items || []).slice(0, 5).map((item: any, i: number) => (
                        <p key={i} className="text-xs text-zinc-500">
                          {item.symbol}: {item.amount} ({formatUsd(item.usd_value)})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!userApiKey && !userPayboxKey && (
        <Card>
          <CardContent>
            <p className="text-sm text-zinc-500 py-6 text-center">
              Connect your ClawPump and PayBox keys in Settings to see your real portfolio.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
