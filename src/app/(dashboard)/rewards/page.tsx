"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gift, CheckCircle2, XCircle, Clock, ExternalLink, AtSign, Coins, Wallet as WalletIcon, ShieldCheck } from "lucide-react";

const TOKEN_DECIMALS: Record<string, number> = { ANSEM: 6, CLAW: 6, PROJECT: 6 };

function uiAmount(base: number, token: string): string {
  const dec = TOKEN_DECIMALS[token] ?? 6;
  return (base / 10 ** dec).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
}

function shortAddr(addr?: string | null) {
  if (!addr) return "—";
  return addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

export default function RewardsPage() {
  const [data, setData] = useState<any>(null);
  const [mine, setMine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitFor, setSubmitFor] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofWallet, setProofWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminSecret, setAdminSecret] = useState("");
  const [adminData, setAdminData] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/rewards").then((r) => r.json()),
        fetch("/api/rewards/my").then((r) => (r.ok ? r.json() : null)),
      ]);
      setData(r1);
      setMine(r2);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submitFor) return;
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/rewards/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: submitFor.id, proofUrl, proofWallet }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Submission failed");
      setResult(d);
      setSubmitFor(null);
      setProofUrl("");
      setProofWallet("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function loadAdmin() {
    setAdminLoading(true);
    setAdminMsg(null);
    try {
      const res = await fetch("/api/rewards/admin", {
        headers: { Authorization: `Bearer ${adminSecret}` },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Unauthorized");
      setAdminData(d);
    } catch (err: any) {
      setAdminMsg(err.message);
      setAdminData(null);
    }
    setAdminLoading(false);
  }

  async function decide(id: string, action: "approve" | "reject") {
    setAdminMsg(null);
    try {
      const res = await fetch("/api/rewards/admin/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ submissionId: id, action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setAdminMsg(d.message || (action === "approve" ? "Approved + paid" : "Rejected"));
      loadAdmin();
    } catch (err: any) {
      setAdminMsg(err.message);
    }
  }

  const treasury = data?.treasury;
  const project = data?.project;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
          <Gift className="h-6 w-6 text-amber-500" /> Rewards
        </h1>
        <p className="text-sm text-zinc-400">
          Complete real tasks — X posts, coin buys, ClawPump helps — and earn real $ANSEM, $CLAW, and {project?.symbol || "CLAWRENA"} from the platform treasury.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" /> Treasury $ANSEM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">
              {treasury ? uiAmount(treasury.ansemBase, "ANSEM") : "—"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{treasury ? shortAddr(treasury.address) : "Treasury pending funding"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" /> Treasury $CLAW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{treasury ? uiAmount(treasury.clawBase, "CLAW") : "—"}</div>
            <p className="text-xs text-zinc-500 mt-1">ClawPump teach rewards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" /> Treasury {project?.symbol || "CLAWRENA"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">
              {treasury ? uiAmount(treasury.projectBase, "PROJECT") : "—"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Project token double rewards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-amber-500" /> My Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{mine?.payments?.length ?? 0}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {data?.counts?.claimed ?? 0} claims · {data?.counts?.verified ?? 0} verified
            </p>
          </CardContent>
        </Card>
      </div>

      {project && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-sky-400" /> @{project.twitterHandle}
            </CardTitle>
            <CardDescription>
              Follow, like, and comment on our posts — then verify with your X post link. Coin: {project.symbol} (mint {shortAddr(project.mint)}).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href={project.twitterUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Open X profile <ExternalLink className="h-3 w-3 ml-1" /></Button>
            </a>
            <a href={project.buyLink} target="_blank" rel="noopener noreferrer">
              <Button variant="ansem" size="sm">Buy {project.symbol} on pump.fun <ExternalLink className="h-3 w-3 ml-1" /></Button>
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>Real tasks, real verification, real rewards. Same proof can never be claimed twice.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tasks...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(data?.tasks || []).map((t: any) => (
                <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100">{t.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                    </div>
                    <Badge variant="ansem" className="shrink-0">
                      {t.rewardAmount} {t.rewardToken === "PROJECT" ? project?.symbol : t.rewardToken}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono">{t.type}</span>
                      {t.proof?.minUsd ? <span>· ${t.proof.minUsd}+ buy</span> : null}
                    </div>
                    {t.mySubmission ? (
                      <StatusBadge status={t.mySubmission.status} />
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setSubmitFor(t)}>
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {submitFor && (
        <Card className="border-amber-700/50">
          <CardHeader>
            <CardTitle>Claim: {submitFor.title}</CardTitle>
            <CardDescription>
              Reward: {submitFor.rewardAmount} {submitFor.rewardToken === "PROJECT" ? project?.symbol : submitFor.rewardToken}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(submitFor.type.startsWith("twitter") || submitFor.type === "twitter_post") && (
                <div className="space-y-2">
                  <Label htmlFor="proof-url">X post link (proof)</Label>
                  <Input id="proof-url" placeholder="https://x.com/.../status/123456" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} required />
                </div>
              )}
              {submitFor.type === "buy_coin" && (
                <div className="space-y-2">
                  <Label htmlFor="proof-wallet">Solana wallet that bought/holds the coin (proof)</Label>
                  <Input id="proof-wallet" placeholder="Your Solana wallet address" value={proofWallet} onChange={(e) => setProofWallet(e.target.value)} required />
                  <p className="text-xs text-zinc-500">Verified on-chain automatically — the wallet must hold the required amount of {project?.symbol}.</p>
                </div>
              )}
              {submitFor.type === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="proof-wallet-custom">Solana wallet for the reward</Label>
                  <Input id="proof-wallet-custom" placeholder="Your Solana wallet address" value={proofWallet} onChange={(e) => setProofWallet(e.target.value)} required />
                </div>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" variant="ansem" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />} Submit Proof
                </Button>
                <Button type="button" variant="outline" onClick={() => setSubmitFor(null)}>Cancel</Button>
              </div>
            </form>
            {result && (
              <div className="mt-4 rounded-md border border-green-800 bg-green-950/20 p-3 text-sm text-green-300">
                {result.message}
                {result.verify && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {result.verify.ok
                      ? `On-chain balance ${(result.verify.balance / 1e6).toLocaleString()} / required ${(result.verify.min / 1e6).toLocaleString()} — verified.`
                      : `On-chain balance ${(result.verify.balance / 1e6).toLocaleString()} / required ${(result.verify.min / 1e6).toLocaleString()} — not enough yet.`}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mine && mine.submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Submissions & Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mine.submissions.map((s: any) => (
              <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200">{s.task?.title || "Task"}</p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  {s.proofUrl && <span className="font-mono break-all">{s.proofUrl}</span>}
                  {s.proofWallet && <span className="font-mono">{shortAddr(s.proofWallet)}</span>}
                </div>
                {s.status === "verified" && (
                  <p className="text-xs text-green-400 mt-1">Reward queued — payout recorded below once sent.</p>
                )}
              </div>
            ))}
            {mine.payments.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium text-zinc-300 mb-2">Payments received</p>
                {mine.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-green-800/50 bg-green-950/10 p-3 text-sm">
                    <div>
                      <p className="text-green-300">{p.amount} {p.token} — {p.task?.title || "Task"}</p>
                      {p.txSignature && (
                        <a href={`https://solscan.io/tx/${p.txSignature}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 underline hover:text-zinc-300">
                          {shortAddr(p.txSignature)} <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      )}
                    </div>
                    <Badge variant="success">Paid</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-500" /> Admin Review
          </CardTitle>
          <CardDescription>Verify X-task submissions and trigger treasury payouts. Requires the admin secret.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="admin-secret">Admin secret</Label>
              <Input id="admin-secret" type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} placeholder="Rewards admin secret" />
            </div>
            <Button variant="outline" onClick={loadAdmin} disabled={adminLoading || !adminSecret}>
              {adminLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load pending"}
            </Button>
          </div>
          {adminMsg && <p className="text-sm text-zinc-400 mt-2">{adminMsg}</p>}
          {adminData && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-zinc-500">
                Treasury: {uiAmount(adminData.treasury?.ansemBase || 0, "ANSEM")} ANSEM ·{" "}
                {uiAmount(adminData.treasury?.clawBase || 0, "CLAW")} CLAW ·{" "}
                {uiAmount(adminData.treasury?.projectBase || 0, "PROJECT")} {project?.symbol} · {adminData.treasury?.sol?.toFixed(4)} SOL
              </p>
              {adminData.pending.length === 0 ? (
                <p className="text-sm text-zinc-500">No pending submissions.</p>
              ) : (
                adminData.pending.map((s: any) => (
                  <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-200">{s.task?.title}</p>
                      <Badge variant="secondary">pending</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-mono break-all">
                      {s.proofUrl || shortAddr(s.proofWallet)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ansem" onClick={() => decide(s.id, "approve")}>
                        Approve & Pay ({s.task?.rewardAmount} {s.task?.rewardToken})
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide(s.id, "reject")}>Reject</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
