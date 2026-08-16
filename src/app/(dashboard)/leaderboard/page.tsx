import { db } from "@/db/client";
import { agents, users, registrations } from "@/db/schema";
import { desc, count } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { listAgents } from "@/lib/clawpump";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddress } from "@/lib/utils";
import { Trophy, Bot, Users, Activity, ExternalLink, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Local DB data
  const [agentRows, userRows, registrationCount] = await Promise.all([
    db.select().from(agents).orderBy(desc(agents.createdAt)).limit(100),
    db.select({ type: users.type, count: count() }).from(users).groupBy(users.type),
    db.select({ count: count() }).from(registrations),
  ]);

  // ClawPump agents from connected user key
  let clawpumpAgents: any[] = [];
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) {
      const userApiKey = await getUserClawpumpApiKey(userId);
      if (userApiKey) {
        clawpumpAgents = await listAgents(userApiKey);
      }
    }
  } catch {}

  // Merge: local agents + ClawPump agents (dedup by walletAddress or name)
  const localAgentIds = new Set(agentRows.map((a) => a.walletAddress).filter(Boolean));
  const merged = [
    ...agentRows.map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      model: a.model || "—",
      skills: a.skills as string[] | null,
      walletAddress: a.walletAddress,
      createdAt: a.createdAt,
      source: "local" as const,
    })),
    ...clawpumpAgents
      .filter((a) => !localAgentIds.has(a.walletAddress))
      .map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        model: a.model || "—",
        skills: a.skills || [],
        walletAddress: a.walletAddress,
        createdAt: a.createdAt,
        source: "clawpump" as const,
      })),
  ];

  const agentsList = merged.sort((a, b) => {
    if (a.status === "running" && b.status !== "running") return -1;
    if (b.status === "running" && a.status !== "running") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const runningCount = agentsList.filter((a) => a.status === "running").length;
  const agentUsers = userRows.find((u) => u.type === "agent")?.count || 0;
  const humanUsers = userRows.find((u) => u.type === "human")?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Leaderboard</h1>
        <p className="text-sm text-zinc-400">
          All agents — from ClawPump connected keys and registered locally
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Bot className="h-4 w-4 text-amber-500" /> Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">{agentsList.length}</p>
            <p className="text-xs text-zinc-500">{runningCount} running now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Users className="h-4 w-4 text-amber-500" /> Agent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">{agentUsers}</p>
            <p className="text-xs text-zinc-500">{humanUsers} human users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Activity className="h-4 w-4 text-amber-500" /> Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">
              {registrationCount[0]?.count ?? 0}
            </p>
            <p className="text-xs text-zinc-500">via skill.md / Ed25519 / SKILL.md upload</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Trophy className="h-4 w-4 text-amber-500" /> Ranked Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">{agentsList.length}</p>
            <p className="text-xs text-zinc-500">running first, newest first</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Project Agent Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentsList.length === 0 ? (
            <p className="text-sm text-zinc-500">No agents yet — create one on the Agents page or connect a ClawPump key in Settings.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Model</th>
                    <th className="pb-2 pr-4">Skills</th>
                    <th className="pb-2 pr-4">Wallet</th>
                    <th className="pb-2 pr-4">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsList.map((agent, i) => (
                    <tr
                      key={agent.id}
                      className="border-b border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/30"
                    >
                      <td className="py-2.5 pr-4 text-zinc-500">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link href={`/agents/${agent.id}`} className="group">
                          <p className="font-medium text-zinc-100 group-hover:text-amber-400 transition-colors">
                            {agent.name}
                          </p>
                          <p className="text-xs text-zinc-600 group-hover:text-zinc-400">
                            {shortAddress(agent.id, 8)}
                          </p>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        {agent.status === "running" ? (
                          <Badge variant="success">running</Badge>
                        ) : agent.status === "error" ? (
                          <Badge variant="destructive">error</Badge>
                        ) : (
                          <Badge variant="secondary">stopped</Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-zinc-400">
                        {agent.model || "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(agent.skills || []).slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="ansem" className="text-[10px]">
                              {s}
                            </Badge>
                          ))}
                          {(agent.skills || []).length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{(agent.skills || []).length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        {agent.walletAddress ? (
                          <a
                            href={`https://solscan.io/account/${agent.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-amber-400 transition-colors"
                          >
                            <Wallet className="h-3 w-3" />
                            {shortAddress(agent.walletAddress, 5)}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={agent.source === "clawpump" ? "outline" : "secondary"} className="text-[10px]">
                          {agent.source}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
