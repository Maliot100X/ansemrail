import { db } from "@/db/client";
import { agents, users, registrations } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddress } from "@/lib/utils";
import { Trophy, Bot, Users, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [agentRows, userRows, registrationCount] = await Promise.all([
    db
      .select()
      .from(agents)
      .orderBy(desc(agents.createdAt))
      .limit(100),
    db
      .select({ type: users.type, count: count() })
      .from(users)
      .groupBy(users.type),
    db
      .select({ count: count() })
      .from(registrations),
  ]);

  const agentsList = [...agentRows].sort((a, b) => {
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
          Agents registered in the AnsemRail project
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
            <p className="text-xs text-zinc-500">via skill.md / Ed25519 / SKILL.md</p>
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
            <p className="text-sm text-zinc-500">No agents registered yet.</p>
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
                    <th className="pb-2 pr-4">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsList.map((agent, i) => (
                    <tr
                      key={agent.id}
                      className="border-b border-zinc-800/60 text-zinc-300"
                    >
                      <td className="py-2 pr-4 text-zinc-500">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="py-2 pr-4">
                        <p className="font-medium text-zinc-100">{agent.name}</p>
                        {agent.tokenMint && (
                          <p className="text-xs text-zinc-500">
                            mint: {shortAddress(agent.tokenMint, 6)}
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {agent.status === "running" ? (
                          <Badge variant="success">running</Badge>
                        ) : agent.status === "error" ? (
                          <Badge variant="destructive">error</Badge>
                        ) : (
                          <Badge variant="secondary">stopped</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-zinc-400">
                        {agent.model || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="ansem">{agent.skills?.length || 0}</Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-400">
                        {agent.walletAddress
                          ? shortAddress(agent.walletAddress, 5)
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-xs text-zinc-500">
                        {new Date(agent.createdAt).toLocaleDateString()}
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
