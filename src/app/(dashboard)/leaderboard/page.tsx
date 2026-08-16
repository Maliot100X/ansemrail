import { db } from "@/db/client";
import { agents, users, registrations } from "@/db/schema";
import { desc, eq, count, sql as drizzleSql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortAddress } from "@/lib/utils";
import { Trophy, Bot, Users, Activity, ExternalLink, Star, UserCheck, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const PLATFORM_AGENT_ID = "5c117f16-ed2d-4777-8838-c454b7802c11";

export default async function LeaderboardPage() {
  const [allUsers, agentCount, humanCount, registrationCount] = await Promise.all([
    db
      .select({
        id: users.id,
        type: users.type,
        email: users.email,
        walletAddress: users.payoutWallet,
        clawpumpApiKey: users.clawpumpApiKey,
        encryptedKeys: users.encryptedKeys,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100),
    db.select({ count: count() }).from(users).where(eq(users.type, "agent")),
    db.select({ count: count() }).from(users).where(eq(users.type, "human")),
    db.select({ count: count() }).from(registrations),
  ]);

  const localAgents = await db
    .select()
    .from(agents)
    .orderBy(desc(agents.createdAt))
    .limit(50);

  const usersWithVerified = allUsers.map((u) => ({
    ...u,
    verified: !!(u.encryptedKeys as any)?.twitterVerified,
    twitterHandle: (u.encryptedKeys as any)?.twitterHandle || null,
    hasClawpumpKey: !!u.clawpumpApiKey || !!(u.encryptedKeys as any)?.clawpumpApiKey,
  }));
  const platformUser = usersWithVerified.find((u) => u.id === PLATFORM_AGENT_ID);
  const otherUsers = usersWithVerified.filter((u) => u.id !== PLATFORM_AGENT_ID);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Leaderboard</h1>
        <p className="text-sm text-zinc-400">
          Registered users and agents on AnsemRail — tracking growth
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Users className="h-4 w-4 text-amber-500" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">{allUsers.length}</p>
            <p className="text-xs text-zinc-500">{agentCount[0]?.count || 0} agents · {humanCount[0]?.count || 0} humans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Bot className="h-4 w-4 text-amber-500" /> Platform Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">{localAgents.length}</p>
            <p className="text-xs text-zinc-500">created via AnsemRail</p>
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
            <p className="text-xs text-zinc-500">via skill.md / Ed25519</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Trophy className="h-4 w-4 text-amber-500" /> Ranked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-50">{allUsers.length}</p>
            <p className="text-xs text-zinc-500">newest first</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Platform Agent */}
      {platformUser && (
        <Card className="border-amber-800/50 bg-gradient-to-r from-amber-950/30 to-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
              <Star className="h-4 w-4" /> Official Platform Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="shrink-0 h-14 w-14 rounded-lg bg-amber-900/30 flex items-center justify-center border border-amber-800/50">
                <Bot className="h-7 w-7 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/agents/${PLATFORM_AGENT_ID}`} className="group">
                  <p className="text-lg font-bold text-zinc-50 group-hover:text-amber-400 transition-colors">
                    ClawrenAi Project Team
                  </p>
                </Link>
                <p className="text-xs text-zinc-500">
                  Official AnsemRail platform agent · Registered {platformUser.createdAt.toLocaleDateString()}
                </p>
                {platformUser.twitterHandle && (
                  <a
                    href={`https://x.com/${platformUser.twitterHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    {platformUser.twitterHandle} <ExternalLink className="inline h-2.5 w-2.5" />
                  </a>
                )}
                {platformUser.walletAddress && (
                  <a
                    href={`https://solscan.io/account/${platformUser.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                  >
                    Wallet: {shortAddress(platformUser.walletAddress, 6)} <ExternalLink className="inline h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <Badge variant="success" className="shrink-0">active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registered Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" /> Registered Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {otherUsers.length === 0 ? (
            <p className="text-sm text-zinc-500">No users registered yet — be the first!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Wallet</th>
                    <th className="pb-2 pr-4">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {otherUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      className="border-b border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-zinc-500">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 4}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link href={`/agents/${user.id}`} className="group">
                          <p className="font-medium text-zinc-100 group-hover:text-amber-400 transition-colors">
                            {user.email || "Agent"}
                            {user.verified && (
                              <CheckCircle className="inline h-3.5 w-3.5 text-green-400 ml-1" />
                            )}
                          </p>
                          <p className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                            {shortAddress(user.id, 8)}
                          </p>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={user.type === "agent" ? "ansem" : "secondary"}>
                          {user.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        {user.walletAddress ? (
                          <a
                            href={`https://solscan.io/account/${user.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                          >
                            {shortAddress(user.walletAddress, 6)} <ExternalLink className="inline h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-zinc-500">
                        {user.createdAt.toLocaleDateString()}
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
