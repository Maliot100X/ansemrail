import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { listAgents, getClawpumpTokens } from "@/lib/clawpump";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/utils";
import { Coins, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  let userApiKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) userApiKey = await getUserClawpumpApiKey(userId);
  } catch {}

  const [agentsRes, tokensRes] = await Promise.allSettled([
    listAgents(userApiKey),
    getClawpumpTokens("hot", 10, 0, userApiKey),
  ]);

  const agents = agentsRes.status === "fulfilled" ? agentsRes.value : [];
  const tokens = tokensRes.status === "fulfilled" ? tokensRes.value : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Earnings</h1>
        <p className="text-sm text-zinc-400">65% creator fees from your ClawPump agents</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Coins className="h-4 w-4 text-amber-500" /> Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Fee Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">65%</div>
            <p className="text-xs text-zinc-500 mt-1">Creator fees redirected to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Token Launches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{tokens.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Hot tokens on ClawPump</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No agents found. Create one in the Agents tab.</p>
          ) : (
            <div className="space-y-3">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-zinc-100">{a.name}</p>
                    <p className="text-xs text-zinc-500">{a.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "running" ? "success" : "secondary"}>
                      {a.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">{a.skills?.length || 0} skills</span>
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
            <CardTitle>Fee Opportunities — Hot Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tokens.slice(0, 6).map((t) => (
                <div key={t.mintAddress} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <p className="font-medium text-zinc-100">${t.symbol}</p>
                  <p className="text-xs text-zinc-500">MCap: {formatUsd(t.marketCap)} | Vol: {formatUsd(t.volume24h)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
