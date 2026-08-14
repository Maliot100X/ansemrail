import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { listAgents, getClawpumpTokens } from "@/lib/clawpump";
import { getAnsemTokenInfo } from "@/lib/moonpay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/utils";
import { TrendingUp, Activity, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let userApiKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) userApiKey = await getUserClawpumpApiKey(userId);
  } catch {}

  const [agentsRes, ansemRes, tokensRes] = await Promise.allSettled([
    listAgents(userApiKey),
    getAnsemTokenInfo(),
    getClawpumpTokens("hot", 10, 0, userApiKey),
  ]);

  const agents = agentsRes.status === "fulfilled" ? agentsRes.value : [];
  const ansem = ansemRes.status === "fulfilled" ? ansemRes.value : null;
  const tokens = tokensRes.status === "fulfilled" ? tokensRes.value : [];

  const running = agents.filter((a) => a.status === "running").length;
  const totalSkills = agents.reduce((sum, a) => sum + (a.skills?.length || 0), 0);
  const ansemChange = ansem?.marketData?.priceChangePercent?.["24h"] ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Analytics</h1>
        <p className="text-sm text-zinc-400">Agent performance and market overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" /> Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{agents.length}</div>
            <p className="text-xs text-zinc-500 mt-1">{running} running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" /> Skills Deployed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{totalSkills}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">$ANSEM 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${ansemChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {ansemChange >= 0 ? "+" : ""}{(ansemChange * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Hot Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{tokens.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No agents to analyze yet.</p>
          ) : (
            <div className="space-y-3">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-zinc-100">{a.name}</p>
                    <p className="text-xs text-zinc-500">{a.model} · {a.skills?.length || 0} skills</p>
                  </div>
                  <Badge variant={a.status === "running" ? "success" : "secondary"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
