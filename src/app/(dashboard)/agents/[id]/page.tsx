import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { users, agents } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

    return (
      <div className="space-y-6 max-w-4xl">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
        </Link>

        {/* Header Card */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="shrink-0 h-20 w-20 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                <Bot className="h-10 w-10 text-amber-500/60" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-zinc-50">
                    {localUser.email || "AnsemRail Agent"}
                  </h1>
                  <Badge variant={localUser.type === "agent" ? "ansem" : "secondary"}>
                    {localUser.type}
                  </Badge>
                  {twitterVerified && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Twitter Verified
                    </Badge>
                  )}
                  {hasClawpumpKey && (
                    <Badge variant="outline" className="text-zinc-400">ClawPump Connected</Badge>
                  )}
                </div>
                {twitterHandle && (
                  <a
                    href={`https://x.com/${twitterHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    {twitterHandle}
                  </a>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  Registered {localUser.createdAt.toLocaleDateString()} · ID: {shortAddress(localUser.id, 8)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet */}
        {localUser.payoutWallet && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
                <Wallet className="h-4 w-4 text-amber-500" /> Payout Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm text-zinc-200 break-all">{localUser.payoutWallet}</p>
                <a href={`https://solscan.io/account/${localUser.payoutWallet}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs gap-1 shrink-0">
                    Solscan <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ClawPump Agents */}
        {clawpumpAgents.length > 0 && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
                <Bot className="h-4 w-4 text-amber-500" /> ClawPump Agents ({clawpumpAgents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clawpumpAgents.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {a.status === "running" ? (
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-zinc-600" />
                      )}
                      <span className="text-sm text-zinc-200">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{a.model}</span>
                      {a.walletAddress && (
                        <a href={`https://solscan.io/account/${a.walletAddress}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-amber-400">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Stats */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <User className="h-4 w-4 text-amber-500" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500 mb-1">User ID</p>
              <p className="font-mono text-xs text-zinc-300 break-all">{localUser.id}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Type</p>
              <p className="text-zinc-300 capitalize">{localUser.type}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Registered</p>
              <p className="text-zinc-300">{localUser.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">$ANSEM Preference</p>
              <p className="text-zinc-300">{localUser.ansemPreference ? "Yes" : "No"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. If found as a local agent (created via platform)
  if (localAgent) {
    const skills: string[] = (localAgent.skills as string[]) || [];
    return (
      <div className="space-y-6 max-w-4xl">
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
        </Link>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="shrink-0 h-20 w-20 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                {localAgent.avatarUrl ? (
                  <img src={localAgent.avatarUrl} alt={localAgent.name} className="h-full w-full object-cover" />
                ) : (
                  <Bot className="h-10 w-10 text-amber-500/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-zinc-50">{localAgent.name}</h1>
                  {localAgent.status === "running" ? <Badge variant="success">running</Badge> : <Badge variant="secondary">{localAgent.status}</Badge>}
                </div>
                {localAgent.persona && <p className="mt-2 text-sm text-zinc-400 line-clamp-3">{localAgent.persona}</p>}
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {localAgent.model || "unknown"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {localAgent.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {localAgent.walletAddress && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-zinc-400"><Wallet className="h-4 w-4 text-amber-500" /> Wallet</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm text-zinc-200 break-all">{localAgent.walletAddress}</p>
                <a href={`https://solscan.io/account/${localAgent.walletAddress}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs gap-1">Solscan <ExternalLink className="h-3 w-3" /></Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
        {skills.length > 0 && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-zinc-400"><Shield className="h-4 w-4 text-amber-500" /> Skills ({skills.length})</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-1.5">{skills.map((s: string) => <Badge key={s} variant="ansem" className="text-xs">{s}</Badge>)}</div></CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Not found in our platform — ClawPump agents are private to their owner
  notFound();
}
