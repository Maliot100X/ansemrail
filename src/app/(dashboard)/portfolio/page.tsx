import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { listAgents, getClawpumpTokens } from "@/lib/clawpump";
import { getAnsemTokenInfo, getClawTokenInfo } from "@/lib/moonpay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd, shortAddress } from "@/lib/utils";
import { Coins, Wallet as WalletIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  let userApiKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) userApiKey = await getUserClawpumpApiKey(userId);
  } catch {}

  const [agentsRes, ansemRes, clawRes, tokensRes] = await Promise.allSettled([
    listAgents(userApiKey),
    getAnsemTokenInfo(),
    getClawTokenInfo(),
    getClawpumpTokens("hot", 10, 0, userApiKey),
  ]);

  const agents = agentsRes.status === "fulfilled" ? agentsRes.value : [];
  const ansem = ansemRes.status === "fulfilled" ? ansemRes.value : null;
  const claw = clawRes.status === "fulfilled" ? clawRes.value : null;
  const tokens = tokensRes.status === "fulfilled" ? tokensRes.value : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Portfolio</h1>
        <p className="text-sm text-zinc-400">Multi-agent portfolio and token positions</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-amber-500" /> Agent Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{agents.length}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">$CLAW</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {claw ? formatUsd(claw.marketData?.marketCap) : "$—"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {claw ? `$${claw.marketData?.price?.toFixed(6)}` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No agents yet. Create one in the Agents tab.</p>
          ) : (
            <div className="space-y-3">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-zinc-100">{a.name}</p>
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
