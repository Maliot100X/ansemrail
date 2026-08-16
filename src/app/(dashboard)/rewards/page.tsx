"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gift, CheckCircle2, XCircle, Clock, ExternalLink, AtSign, Wallet as WalletIcon, ShieldCheck } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
}

function shortAddr(addr?: string | null) {
  if (!addr) return "—";
  return addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

function proofKind(type: string): "twitter" | "buy" | "teach" | "custom" | "generic" {
  if (type === "buy_coin" || type === "holding") return "buy";
  if (type.startsWith("twitter") || type === "twitter_post") return "twitter";
  if (type === "teach") return "teach";
  if (type === "custom") return "custom";
  return "generic";
}

function proofLabel(type: string): string {
  const k = proofKind(type);
  if (k === "twitter") return "X post link";
  if (k === "buy") return "wallet";
  if (k === "teach") return "proof link";
  if (k === "custom") return "link + wallet";
  return "proof";
}

export default function RewardsPage() {
  const [data, setData] = useState<any>(null);
  const [mine, setMine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofWallet, setProofWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultFor, setResultFor] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [errorFor, setErrorFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
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

  function openClaim(task: any) {
    setOpenTaskId(task.id);
    setProofUrl("");
    setProofWallet("");
    setResultFor(null);
    setResult(null);
    setErrorFor(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent, taskId: string) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/rewards/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, proofUrl: proofUrl.trim() || null, proofWallet: proofWallet.trim() || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Submission failed");
      setResultFor(taskId);
      setResult(d);
      load();
    } catch (err: any) {
      setErrorFor(taskId);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function loadAdmin() {
    setAdminLoading(true);
    setAdminMsg(null);
    try {
      const res = await fetch("/api/rewards/admin", { headers: { Authorization: `Bearer ${adminSecret}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Unauthorized");
      setAdminData(d);
    } catch (err: any) {
      setAdminMsg(err.message);
      setAdminData(null);
    }
    setAdminLoading(false);
  }

  async function decide(id: string, action: "approve" | "reject" | "delete") {
    setAdminMsg(null);
    try {
      const res = await fetch("/api/rewards/admin/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ submissionId: id, action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setAdminMsg(d.message || (action === "approve" ? "Approved + paid" : action === "reject" ? "Rejected" : "Removed"));
      loadAdmin();
    } catch (err: any) {
      setAdminMsg(err.message);
    }
  }

  const project = data?.project;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
          <Gift className="h-6 w-6 text-amber-500" /> Rewards
        </h1>
        <p className="text-sm text-zinc-400">
          Complete real tasks — X posts, coin buys, ClawPump helps — and earn real $ANSEM, $CLAW, and {project?.symbol || "CLAWRENA"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" /> My Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{data?.counts?.claimed ?? 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Proofs submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{data?.counts?.verified ?? 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Approved & paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-sky-400" /> Rewards Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{mine?.payments?.length ?? 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Payments sent to your wallet</p>
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
              Follow, like, comment, and post about us — then submit your X post link as proof. Coin: {project.symbol} (mint {shortAddr(project.mint)}).
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
          <CardDescription>Click Claim on a task, paste your proof link and reward wallet, submit. Same proof can never be claimed twice.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tasks...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(data?.tasks || []).map((t: any) => {
                const isOpen = openTaskId === t.id;
                const kind = proofKind(t.type);
                const my = t.mySubmission;
                return (
                  <div key={t.id} className={`rounded-lg border bg-zinc-900/50 p-4 ${isOpen ? "border-amber-700/50" : "border-zinc-800"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100">{t.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                      </div>
                      <Badge variant="ansem" className="shrink-0">
                        {t.rewardAmount} {t.rewardToken === "PROJECT" ? project?.symbol : t.rewardToken}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono">{t.type}</span>
                        {t.proof?.minUsd ? <span>· ${t.proof.minUsd}+ buy</span> : null}
                        <span>· proof: {proofLabel(t.type)}</span>
                      </div>
                      {my ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={my.status} />
                          {my.status === "rejected" && (
                            <Button size="sm" variant="outline" onClick={() => openClaim(t)}>
                              Retry with new proof
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button size="sm" variant={isOpen ? "secondary" : "outline"} onClick={() => (isOpen ? setOpenTaskId(null) : openClaim(t))}>
                          {isOpen ? "Close" : "Claim"}
                        </Button>
                      )}
                    </div>

                    {isOpen && (
                      <form onSubmit={(e) => handleSubmit(e, t.id)} className="mt-4 space-y-3 rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
                        <p className="text-xs font-medium text-zinc-300">
                          Reward: {t.rewardAmount} {t.rewardToken === "PROJECT" ? project?.symbol : t.rewardToken} — fill in your proof:
                        </p>

                        {(kind === "twitter" || kind === "teach" || kind === "custom") && (
                          <div className="space-y-1.5">
                            <Label htmlFor={`proof-url-${t.id}`}>
                              {kind === "twitter" ? "Your X post link (proof)" : kind === "teach" ? "Proof link (e.g. X post / ClawPump link)" : "Proof link (optional — e.g. your post or share)"}
                            </Label>
                            <Input
                              id={`proof-url-${t.id}`}
                              placeholder={kind === "twitter" ? "https://x.com/.../status/123456" : "https://..."}
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              required={kind !== "custom"}
                            />
                            {kind === "twitter" && <p className="text-xs text-zinc-500">Paste the link of your X post / reply / like. It must mention or reference @CLAWRENAi.</p>}
                            {kind === "teach" && <p className="text-xs text-zinc-500">Paste the link of the ClawPump help/trade you completed.</p>}
                          </div>
                        )}

                        {(kind === "buy" || kind === "teach" || kind === "custom" || kind === "generic") && (
                          <div className="space-y-1.5">
                            <Label htmlFor={`proof-wallet-${t.id}`}>
                              {kind === "buy" ? "Your Solana wallet (proof of holding + reward)" : "Your Solana wallet (reward is sent here)"}
                            </Label>
                            <Input
                              id={`proof-wallet-${t.id}`}
                              placeholder="Your Solana wallet address"
                              value={proofWallet}
                              onChange={(e) => setProofWallet(e.target.value)}
                              required={kind === "buy" || kind === "custom"}
                            />
                            {kind === "buy" && <p className="text-xs text-zinc-500">Verified on-chain automatically — the wallet must hold the required amount of {project?.symbol}.</p>}
                          </div>
                        )}

                        {kind === "twitter" && (
                          <div className="space-y-1.5">
                            <Label htmlFor={`reward-wallet-${t.id}`}>Your Solana wallet (reward is sent here)</Label>
                            <Input
                              id={`reward-wallet-${t.id}`}
                              placeholder="Your Solana wallet address"
                              value={proofWallet}
                              onChange={(e) => setProofWallet(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500">Add your wallet so the reward can be paid to you.</p>
                          </div>
                        )}

                        {errorFor === t.id && error && <p className="text-sm text-red-400">{error}</p>}
                        {resultFor === t.id && result && (
                          <div className="rounded-md border border-green-800 bg-green-950/20 p-3 text-sm text-green-300">
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

                        <div className="flex gap-2">
                          <Button type="submit" variant="ansem" size="sm" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />} Submit Proof
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setOpenTaskId(null)}>Cancel</Button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                  {s.proofWallet && <span className="font-mono">Reward wallet: {shortAddr(s.proofWallet)}</span>}
                </div>
                {s.status === "verified" && (
                  <p className="text-xs text-green-400 mt-1">Verified — payout is sent once approved by the treasury admin.</p>
                )}
                {s.status === "pending" && (
                  <p className="text-xs text-amber-400/80 mt-1">Pending review — you will see the payment here once approved.</p>
                )}
                {s.status === "rejected" && (
                  <p className="text-xs text-red-400/80 mt-1">Rejected — go back to the task and Retry with a new, correct proof.</p>
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
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-amber-500" /> Admin — verify claims & pay
          </CardTitle>
          <CardDescription>Admins: review submitted proofs, approve to pay from the treasury, or reject. Requires the admin secret.</CardDescription>
        </CardHeader>
        <CardContent>
          {!showAdmin ? (
            <Button variant="outline" size="sm" onClick={() => setShowAdmin(true)}>Admin panel</Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="admin-secret">Admin secret</Label>
                  <Input id="admin-secret" type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} placeholder="Rewards admin secret" />
                </div>
                <Button variant="outline" onClick={loadAdmin} disabled={adminLoading || !adminSecret}>
                  {adminLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load pending"}
                </Button>
              </div>
              {adminMsg && <p className="text-sm text-zinc-400">{adminMsg}</p>}
              {adminData && (
                <div className="space-y-3">
                  {adminData.treasury ? (
                    <p className="text-xs text-zinc-500">
                      Treasury: {shortAddr(adminData.treasury.address)} · {(adminData.treasury.sol || 0).toFixed(4)} SOL · funded in reward tokens
                    </p>
                  ) : (
                    <p className="text-xs text-amber-300/80">Treasury wallet not configured yet — payouts are disabled until it is set.</p>
                  )}
                  <p className="text-xs text-zinc-500">{adminData.pending.length} submission(s) waiting</p>
                  {adminData.pending.length === 0 ? (
                    <p className="text-sm text-zinc-500">No submissions waiting for payout.</p>
                  ) : (
                    adminData.pending.map((s: any) => (
                      <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-200">{s.task?.title}</p>
                          <StatusBadge status={s.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                          {s.proofUrl && <span className="font-mono break-all">{s.proofUrl}</span>}
                          {s.proofWallet && <span className="font-mono">Wallet: {shortAddr(s.proofWallet)}</span>}
                          <span className="font-mono">User: {shortAddr(s.userId)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="sm" variant="ansem" onClick={() => decide(s.id, "approve")}>
                            Approve & Pay ({s.task?.rewardAmount} {s.task?.rewardToken})
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => decide(s.id, "reject")}>Reject</Button>
                          <Button size="sm" variant="ghost" className="text-zinc-500" onClick={() => decide(s.id, "delete")}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
