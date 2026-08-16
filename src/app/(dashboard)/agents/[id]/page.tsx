import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { getAgent } from "@/lib/clawpump";
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
  Copy,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let userApiKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) userApiKey = await getUserClawpumpApiKey(userId);
  } catch {}

  let agent: any;
  try {
    agent = await getAgent(id, userApiKey);
  } catch {
    notFound();
  }

  if (!agent) notFound();

  const skills: string[] = agent.skills || [];
  const createdAt = agent.createdAt ? new Date(agent.createdAt) : null;
  const updatedAt = agent.updatedAt ? new Date(agent.updatedAt) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      {/* Header Card */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0 h-20 w-20 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Bot className="h-10 w-10 text-amber-500/60" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-50">{agent.name}</h1>
                {agent.status === "running" ? (
                  <Badge variant="success">running</Badge>
                ) : agent.status === "error" ? (
                  <Badge variant="destructive">error</Badge>
                ) : (
                  <Badge variant="secondary">stopped</Badge>
                )}
                {agent.isPublic && (
                  <Badge variant="outline" className="text-zinc-400">public</Badge>
                )}
              </div>

              {agent.persona && (
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed line-clamp-3">
                  {agent.persona}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> {agent.model || "unknown"}
                </span>
                {createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created {createdAt.toLocaleDateString()}
                  </span>
                )}
                {updatedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Updated {updatedAt.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wallet */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Wallet className="h-4 w-4 text-amber-500" /> Agent Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agent.walletAddress ? (
              <div className="space-y-2">
                <p className="font-mono text-sm text-zinc-200 break-all">
                  {agent.walletAddress}
                </p>
                <div className="flex gap-2">
                  <a
                    href={`https://solscan.io/account/${agent.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      Solscan <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                  <a
                    href={`https://solana.fm/address/${agent.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      Solana FM <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No wallet assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
              <Shield className="h-4 w-4 text-amber-500" /> Skills ({skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s: string) => (
                  <Badge key={s} variant="ansem" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No skills assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent ID */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-zinc-400">
            <Bot className="h-4 w-4 text-amber-500" /> Agent Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Agent ID</p>
              <p className="font-mono text-xs text-zinc-300 break-all">{agent.id}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Model</p>
              <p className="text-zinc-300">{agent.model || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Status</p>
              <p className="text-zinc-300 capitalize">{agent.status}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Visibility</p>
              <p className="text-zinc-300">{agent.isPublic ? "Public" : "Private"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
