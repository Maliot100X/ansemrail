import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { listAgents, getAgentPonsLaunches } from "@/lib/clawpump";
import { getBalance } from "@/lib/helius";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Rocket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  let userApiKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) userApiKey = await getUserClawpumpApiKey(userId);
  } catch {}

  const agentsRes = await Promise.allSettled([userApiKey ? listAgents(userApiKey) : Promise.resolve([])]);
  const agents = agentsRes[0].status === "fulfilled" ? agentsRes[0].value : [];

  const agentDetails = await Promise.all(
    agents.map(async (a) => {
      let sol = 0;
      let launches: any[] = [];
      try {
        if (a.walletAddress) {
          const lamports = await getBalance(a.walletAddress);
          sol = (lamports || 0) / 1e9;
        }
      } catch {}
      try {
        launches = await getAgentPonsLaunches(a.id, userApiKey);
      } catch {}
      return { agent: a, sol, launches };
    })
  );

  const totalSol = agentDetails.reduce((sum, d) => sum + d.sol, 0);
  const totalLaunches = agentDetails.reduce((sum, d) => sum + d.launches.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Earnings</h1>
        <p className="text-sm text-zinc-400">
          65% creator fees from your ClawPump agents — your agents, on-chain balances, and launches
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Coins className="h-4 w-4 text-amber-500" /> Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{agents.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Owned by your connected ClawPump key</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
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
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Rocket className="h-4 w-4 text-amber-500" /> Token Launches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{totalLaunches}</div>
            <p className="text-xs text-zinc-500 mt-1">PONS launches across your agents</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">
              No agents found on the connected key. Create one in the Agents tab.
            </p>
          ) : (
            <div className="space-y-4">
              {agentDetails.map(({ agent: a, sol, launches }) => (
                <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-100">{a.name}</p>
                      <p className="text-xs text-zinc-500">{a.model}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-200">{sol.toFixed(4)} SOL</p>
                        <p className="text-xs text-zinc-500">{launches.length} launches</p>
                      </div>
                      <Badge variant={a.status === "running" ? "success" : "secondary"}>
                        {a.status}
                      </Badge>
                    </div>
                  </div>
                  {launches.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                      {launches.slice(0, 3).map((launch) => (
                        <div key={launch.id} className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <span className="font-medium text-zinc-200">
                              {launch.symbol || launch.name || "Untitled"}
                            </span>
                            {launch.tokenAddress ? (
                              <a
                                href={`https://clawpump.tech/tokens/${launch.tokenAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 font-mono text-amber-400 underline hover:text-amber-300"
                              >
                                token {launch.tokenAddress.slice(0, 6)}…
                              </a>
                            ) : (
                              <span className="ml-2 text-zinc-600">token pending</span>
                            )}
                          </div>
                          <Badge variant={launch.status === "finalized" ? "success" : "secondary"}>
                            {launch.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-xs text-zinc-500 py-4">
            {totalSol > 0
              ? `${totalSol.toFixed(4)} SOL on-chain across your agent wallets — fee settlements appear here as your agents earn.`
              : "ClawPump does not expose earnings totals via REST yet — showing your agents' on-chain balances and launches instead."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
