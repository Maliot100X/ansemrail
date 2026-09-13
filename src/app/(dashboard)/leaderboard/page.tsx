import { db } from "@/db/client";
import { agents, users, registrations } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { AgentAvatar } from "@/components/three/agent-avatar";
import { AnsemOrb } from "@/components/three/ansem-orb";
import { shortAddress } from "@/lib/utils";
import { Trophy, Bot, Users, Activity, ExternalLink, Star, UserCheck, CheckCircle, Sparkles } from "lucide-react";

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
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted">
            Registered users and agents on AnsemRail — tracking growth
          </p>
        </div>
      </Reveal>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users", value: allUsers.length, sub: `${agentCount[0]?.count || 0} agents · ${humanCount[0]?.count || 0} humans`, icon: Users },
          { title: "Platform Agents", value: localAgents.length, sub: "created via AnsemRail", icon: Bot },
          { title: "Registrations", value: registrationCount[0]?.count ?? 0, sub: "via skill.md / Ed25519", icon: Activity },
          { title: "Ranked", value: allUsers.length, sub: "newest first", icon: Trophy },
        ].map((stat, i) => (
          <Reveal key={stat.title} delay={0.05 + i * 0.05}>
            <Card className="transition-colors hover:border-amber-300/25">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-muted">
                  <stat.icon className="h-4 w-4 text-amber-400" /> {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted/70">{stat.sub}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Featured Platform Agent */}
      {platformUser && (
        <Reveal delay={0.25}>
          <section className="rail-profile-hero rounded-[1.75rem] p-5 sm:p-7">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <AgentAvatar
                seed={platformUser.id}
                status="running"
                name="ClawrenAi Project Team"
                className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rail-micro-label inline-flex items-center gap-1.5 text-amber-400">
                    <Star className="h-3.5 w-3.5" /> Official Platform Agent
                  </span>
                  <Badge variant="success" className="shrink-0">active</Badge>
                </div>
                <Link href={`/agents/${PLATFORM_AGENT_ID}`} className="group mt-1.5 block">
                  <p className="text-xl font-bold text-foreground group-hover:text-amber-400 transition-colors sm:text-2xl">
                    ClawrenAi Project Team
                  </p>
                </Link>
                <p className="mt-1 text-xs text-muted/70">
                  Official AnsemRail platform agent · Registered {platformUser.createdAt.toLocaleDateString()}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  {platformUser.twitterHandle && (
                    <a
                      href={`https://x.com/${platformUser.twitterHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-amber-400 transition-colors"
                    >
                      {platformUser.twitterHandle} <ExternalLink className="inline h-2.5 w-2.5" />
                    </a>
                  )}
                  {platformUser.walletAddress && (
                    <a
                      href={`https://solscan.io/account/${platformUser.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted/70 hover:text-amber-400 transition-colors"
                    >
                      Wallet: {shortAddress(platformUser.walletAddress, 6)} <ExternalLink className="inline h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Registered Users */}
      <Reveal delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" /> Registered Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {otherUsers.length === 0 ? (
              <p className="text-sm text-muted/70">No users registered yet — be the first!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-muted/70">
                      <th className="pb-2 pr-4">#</th>
                      <th className="pb-2 pr-4">User</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Wallet</th>
                      <th className="pb-2 pr-4">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherUsers.map((user, i) => {
                      const rank = i + 1;
                      const medal =
                        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                      return (
                        <tr
                          key={user.id}
                          style={{ animationDelay: `${Math.min(i * 35, 700)}ms` }}
                          className="rail-row-rise border-b border-white/10 text-foreground/75 transition-colors hover:bg-white/[0.06]"
                        >
                          <td className="py-2.5 pr-4">
                            <div className="rail-rank-medal flex items-center gap-1.5 text-muted/70">
                              {medal ? (
                                <span className="text-base">{medal}</span>
                              ) : (
                                <span className="text-sm">{rank}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <Link href={`/agents/${user.id}`} className="group flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                                <AnsemOrb
                                  seed={user.id}
                                  status={user.type === "agent" ? "running" : undefined}
                                  animate={false}
                                  interactive={false}
                                  label=""
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground group-hover:text-amber-400 transition-colors">
                                  {user.email || "Agent"}
                                  {user.verified && (
                                    <CheckCircle className="inline h-3.5 w-3.5 text-green-400 ml-1" />
                                  )}
                                </p>
                                <p className="truncate text-xs text-muted/60 group-hover:text-muted transition-colors">
                                  {shortAddress(user.id, 8)}
                                </p>
                              </div>
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
                                className="font-mono text-xs text-muted/70 hover:text-amber-400 transition-colors"
                              >
                                {shortAddress(user.walletAddress, 6)} <ExternalLink className="inline h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted/60">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-muted/70">
                            {user.createdAt.toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
