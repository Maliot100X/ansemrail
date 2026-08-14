import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey, getUserPayboxApiKey } from "@/lib/auth-session";
import { listAgents, getClawpumpTokens } from "@/lib/clawpump";
import { getAnsemTokenInfo, getClawTokenInfo } from "@/lib/moonpay";
import { listPayBoxCredentials, getPayBoxPortfolio } from "@/lib/paybox";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd, shortAddress } from "@/lib/utils";
import { Coins, Wallet as WalletIcon, Bot, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const [
    agentsRes,
    ansemRes,
    clawRes,
    tokensRes,
    projectAgentsRes,
    payboxCredsRes,
  ] = await Promise.allSettled([
    listAgents(userApiKey),
    getAnsemTokenInfo(),
    getClawTokenInfo(),
    getClawpumpTokens("hot", 10, 0, userApiKey),
    db.select().from(agents).orderBy(desc(agents.createdAt)).limit(50),
    listPayBoxCredentials(userPayboxKey),
  ]);

  const clawpumpAgents = agentsRes.status === "fulfilled" ? agentsRes.value : [];
  const ansem = ansemRes.status === "fulfilled" ? ansemRes.value : null;
  const claw = clawRes.status === "fulfilled" ? clawRes.value : null;
  const tokens = tokensRes.status === "fulfilled" ? tokensRes.value : [];
  const projectAgents = projectAgentsRes.status === "fulfilled" ? projectAgentsRes.value : [];
  const creds = payboxCredsRes.status === "fulfilled"
    ? payboxCredsRes.value?.credentials || []
    : [];

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
          Project agents, your ClawPump agents, and PayBox wallets with real balances
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-500" /> Project Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{projectAgents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-amber-500" /> ClawPump Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{clawpumpAgents.length}</div>
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
            <p className="text-xs text-zinc-500 mt-1">{formatUsd(payboxTotal)} total balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" /> $ANSEM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">
              {ansem ? formatUsd(ansem.marketData?.marketCap) : "$—"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {ansem ? `$${ansem.marketData?.price?.toFixed(6)}` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {projectAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Agents (registered in AnsemRail)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projectAgents.slice(0, 9).map((a) => (
                <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-zinc-100 truncate">{a.name}</p>
                    <Badge variant={a.status === "running" ? "success" : "secondary"}>{a.status}</Badge>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 mt-1 break-all">{a.id}</p>
                  {a.walletAddress && (
                    <p className="text-xs font-mono text-zinc-600">{shortAddress(a.walletAddress)}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {a.skills?.length || 0} skills · {a.model || "—"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              {clawpumpAgents.map((a) => (
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
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "running" ? "success" : "secondary"}>{a.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Market Watch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tokens.slice(0, 6).map((t) => (
                <div key={t.mintAddress} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <p className="font-medium text-zinc-100">${t.symbol}</p>
                  <p className="text-xs text-zinc-500">{formatUsd(t.marketCap)} · {formatUsd(t.volume24h)} vol</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
