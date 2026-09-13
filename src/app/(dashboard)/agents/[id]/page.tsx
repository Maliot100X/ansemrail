import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { users, agents, communityFollows, communityPosts, communityProfiles } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { AgentAvatar } from "@/components/three/agent-avatar";
import { shortAddress } from "@/lib/utils";
import {
  Bot,
  ArrowLeft,
  ExternalLink,
  Wallet,
  Calendar,
  Cpu,
  Shield,
  CheckCircle,
  User,
  Users,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let userApiKey: string | undefined;
  let sessionUserId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    sessionUserId = (session?.user as any)?.id;
    if (sessionUserId) userApiKey = await getUserClawpumpApiKey(sessionUserId);
  } catch {}

  // 1. Try local users table (platform registered agents/humans)
  const [localUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const [communityProfile] = await db
    .select()
    .from(communityProfiles)
    .where(eq(communityProfiles.userId, id))
    .limit(1);
  const visiblePostsFilter = and(eq(communityPosts.userId, id), eq(communityPosts.status, "visible"));
  const [communityFeed, postCountRow, followerCountRow, followingCountRow, followRow] = await Promise.all([
    db.select().from(communityPosts).where(visiblePostsFilter),
    db.select({ count: sql<number>`count(*)::int` }).from(communityPosts).where(visiblePostsFilter),
    db.select({ count: sql<number>`count(*)::int` }).from(communityFollows).where(eq(communityFollows.followingUserId, id)),
    db.select({ count: sql<number>`count(*)::int` }).from(communityFollows).where(eq(communityFollows.followerUserId, id)),
    sessionUserId ? db.select().from(communityFollows).where(and(eq(communityFollows.followerUserId, sessionUserId), eq(communityFollows.followingUserId, id))).limit(1) : Promise.resolve([]),
  ]);
  const communityName = communityProfile?.displayName || (localUser?.type === "agent" ? localUser.email || "AnsemRail Agent" : "AnsemRail Human");

  // 2. Try local agents table (agents created via platform)
  const [localAgent] = await db
    .select()
    .from(agents)
    .where(or(eq(agents.id, id), eq(agents.clawpumpAgentId, id)))
    .limit(1);

  // 3. If found locally, use local data
  if (localUser) {
    const encKeys = (localUser.encryptedKeys as any) || {};
    const twitterVerified = !!encKeys.twitterVerified;
    const twitterHandle = encKeys.twitterHandle || null;
    const profile = encKeys.clawpumpProfile || null;
    const clawpumpAgents = profile?.agents || [];
    const hasClawpumpKey = !!localUser.clawpumpApiKey;
    const isAgent = localUser.type === "agent";
    const followerCount = followerCountRow[0]?.count || 0;
    const postCount = postCountRow[0]?.count || 0;
    const followingCount = followingCountRow[0]?.count || 0;

    return (
      <div className="space-y-6 max-w-4xl">
        <Reveal delay={0}>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
          </Link>
        </Reveal>

        {/* Header Hero */}
        <Reveal delay={0.05}>
          <section className="rail-profile-hero rounded-[1.75rem]">
            <div className="relative h-28 sm:h-36">
              {communityProfile?.bannerUrl ? (
                <img src={communityProfile.bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-amber-500/25 via-orange-500/10 to-cyan-400/10" />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-80" />
            </div>

            <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
                <div className="-mt-14 shrink-0 sm:-mt-16">
                  <AgentAvatar
                    seed={localUser.id}
                    status={isAgent ? "running" : undefined}
                    name={communityName}
                    className="h-28 w-28 ring-4 ring-[#050507] sm:h-32 sm:w-32"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-foreground">
                      {communityName}
                    </h1>
                    <Badge variant={isAgent ? "ansem" : "secondary"}>
                      {localUser.type}
                    </Badge>
                    {twitterVerified && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Twitter Verified
                      </Badge>
                    )}
                    {hasClawpumpKey && (
                      <Badge variant="outline" className="text-muted">ClawPump Connected</Badge>
                    )}
                    {isAgent && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                        Live Rail
                      </span>
                    )}
                  </div>

                  {twitterHandle && (
                    <a
                      href={`https://x.com/${twitterHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-muted hover:text-amber-400 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      {twitterHandle}
                    </a>
                  )}
                  {communityProfile?.bio && <p className="mt-2 text-sm text-foreground/75">{communityProfile.bio}</p>}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Posts", value: postCount, icon: MessageSquare },
                  { label: "Followers", value: followerCount, icon: Users },
                  { label: "Following", value: followingCount, icon: User },
                  { label: "Member Since", value: localUser.createdAt.toLocaleDateString(), icon: Calendar },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-muted/70">
                      <stat.icon className="h-3.5 w-3.5 text-amber-400/80" />
                      <span className="rail-micro-label">{stat.label}</span>
                    </div>
                    <p className="mt-1 truncate text-lg font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* Wallet */}
        {localUser.payoutWallet && (
          <Reveal delay={0.1}>
            <div className="rail-card rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Wallet className="h-4 w-4 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="rail-micro-label text-muted/70">Payout Wallet</p>
                    <p className="truncate font-mono text-sm text-foreground/90">{localUser.payoutWallet}</p>
                  </div>
                </div>
                <a href={`https://solscan.io/account/${localUser.payoutWallet}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    Solscan <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
          </Reveal>
        )}

        {/* ClawPump Agents */}
        {clawpumpAgents.length > 0 && (
          <Reveal delay={0.15}>
            <Card className="bg-white/[0.02]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-muted">
                  <Bot className="h-4 w-4 text-amber-400" /> ClawPump Agents ({clawpumpAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {clawpumpAgents.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 transition-colors hover:border-amber-300/25">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className={`absolute inline-flex h-full w-full rounded-full ${a.status === "running" ? "animate-ping bg-green-400/60" : "bg-transparent"}`} />
                          <span className={`relative inline-flex h-2 w-2 rounded-full ${a.status === "running" ? "bg-green-500" : "bg-zinc-600"}`} />
                        </span>
                        <span className="truncate text-sm text-foreground/90">{a.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted/70">{a.model}</span>
                        {a.walletAddress && (
                          <a href={`https://solscan.io/account/${a.walletAddress}`} target="_blank" rel="noopener noreferrer" className="text-muted/70 hover:text-amber-400">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        )}

        {/* Platform Stats */}
        <Reveal delay={0.2}>
          <Card className="bg-white/[0.02]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-muted">
                <User className="h-4 w-4 text-amber-400" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="rail-micro-label mb-1 text-muted/70">User ID</p>
                <p className="break-all font-mono text-xs text-foreground/75">{localUser.id}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="rail-micro-label mb-1 text-muted/70">Type</p>
                <p className="text-foreground/75 capitalize">{localUser.type}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="rail-micro-label mb-1 text-muted/70">Registered</p>
                <p className="text-foreground/75">{localUser.createdAt.toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="rail-micro-label mb-1 text-muted/70">$ANSEM Preference</p>
                <p className="text-foreground/75">{localUser.ansemPreference ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Community Posts */}
        <Reveal delay={0.25}>
          <Card className="bg-white/[0.02]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-muted">
                <MessageSquare className="h-4 w-4 text-amber-400" /> Community Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {communityFeed.length === 0 && <p className="text-sm text-muted/70">No Community posts yet.</p>}
              {communityFeed.map((post) => (
                <div key={post.id} className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-2 transition-colors hover:border-white/20">
                  <p className="text-xs text-muted/70">{post.createdAt.toLocaleString()}</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{post.content}</p>
                  {post.imageUrl && <img src={post.imageUrl} alt="" className="max-h-80 w-full rounded-lg object-cover" />}
                  {post.tweetUrl && (
                    <a href={post.tweetUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-white/[0.05] p-2 text-xs text-sky-400 hover:text-sky-300">
                      {(post.tweetPreview as any)?.text || post.tweetUrl}
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    );
  }

  // 4. If found as a local agent (created via platform)
  if (localAgent) {
    const skills: string[] = (localAgent.skills as string[]) || [];
    const running = localAgent.status === "running";
    return (
      <div className="space-y-6 max-w-4xl">
        <Reveal delay={0}>
          <Link href="/leaderboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground/90 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
          </Link>
        </Reveal>

        <Reveal delay={0.05}>
          <section className="rail-profile-hero rounded-[1.75rem] p-6 sm:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <AgentAvatar
                seed={localAgent.id}
                status={localAgent.status}
                name={localAgent.name}
                className="h-28 w-28 shrink-0 sm:h-32 sm:w-32"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-foreground">{localAgent.name}</h1>
                  <Badge variant={running ? "success" : "secondary"}>{localAgent.status}</Badge>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${running ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-muted"}`}>
                    <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${running ? "bg-emerald-300" : "bg-zinc-500"}`} />
                    {running ? "Live Rail" : "Standby"}
                  </span>
                </div>
                {localAgent.persona && <p className="mt-2 text-sm text-muted line-clamp-3">{localAgent.persona}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted/70">
                  <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {localAgent.model || "unknown"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {localAgent.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="rail-micro-label mb-2.5 flex items-center gap-1.5 text-muted/70">
                  <Shield className="h-3.5 w-3.5 text-amber-400" /> Skills ({skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">{skills.map((s: string) => <Badge key={s} variant="ansem" className="text-xs">{s}</Badge>)}</div>
              </div>
            )}
          </section>
        </Reveal>

        {localAgent.walletAddress && (
          <Reveal delay={0.1}>
            <div className="rail-card rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Wallet className="h-4 w-4 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="rail-micro-label text-muted/70">Wallet</p>
                    <p className="truncate font-mono text-sm text-foreground/90">{localAgent.walletAddress}</p>
                  </div>
                </div>
                <a href={`https://solscan.io/account/${localAgent.walletAddress}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs gap-1">Solscan <ExternalLink className="h-3 w-3" /></Button>
                </a>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    );
  }

  // Not found in our platform — ClawPump agents are private to their owner
  notFound();
}
