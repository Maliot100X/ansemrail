"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gift, CheckCircle2, XCircle, Clock, ExternalLink, AtSign, Coins, Wallet as WalletIcon, ShieldCheck, KeyRound } from "lucide-react";

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

function proofKind(type: string): "twitter" | "buy" | "teach" | "custom" | "generic" {
  if (type === "buy_coin" || type === "holding") return "buy";
  if (type.startsWith("twitter") || type === "twitter_post") return "twitter";
  if (type === "teach") return "teach";
  if (type === "custom") return "custom";
  return "generic";
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
  const [treasuryData, setTreasuryData] = useState<any>(null);
  const [treasuryKey, setTreasuryKey] = useState("");
  const [treasurySaving, setTreasurySaving] = useState(false);

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
        body: JSON.stringify({ taskId: submitFor.id, proofUrl: proofUrl.trim() || null, proofWallet: proofWallet.trim() || null }),
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
      const [res, tRes] = await Promise.all([
        fetch("/api/rewards/admin", { headers: { Authorization: `Bearer ${adminSecret}` } }),
        fetch("/api/rewards/treasury", { headers: { Authorization: `Bearer ${adminSecret}` } }),
      ]);
      const [d, t] = await Promise.all([res.json(), tRes.json()]);
      if (!res.ok || !tRes.ok) throw new Error(d.error || t.error || "Unauthorized");
      setAdminData(d);
      setTreasuryData(t);
    } catch (err: any) {
      setAdminMsg(err.message);
      setAdminData(null);
      setTreasuryData(null);
    }
    setAdminLoading(false);
  }

  async function saveTreasury() {
    if (!treasuryKey.trim()) return;
    setTreasurySaving(true);
    setAdminMsg(null);
    try {
      const res = await fetch("/api/rewards/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ privateKey: treasuryKey.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save treasury");
      setAdminMsg(d.message);
      setTreasuryKey("");
      setTreasuryData(d);
    } catch (err: any) {
      setAdminMsg(err.message);
    }
    setTreasurySaving(false);
  }

  async function clearTreasury() {
    setTreasurySaving(true);
    setAdminMsg(null);
    try {
      const res = await fetch("/api/rewards/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ clear: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to clear");
      setAdminMsg(d.message);
      setTreasuryData(null);
    } catch (err: any) {
      setAdminMsg(err.message);
    }
    setTreasurySaving(false);
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
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono">{t.type}</span>
                      {t.proof?.minUsd ? <span>· ${t.proof.minUsd}+ buy</span> : null}
                      <span>· proof: {proofKind(t.type) === "twitter" ? "X link" : proofKind(t.type) === "buy" ? "wallet" : proofKind(t.type) === "teach" ? "proof link" : proofKind(t.type) === "custom" ? "link + wallet" : "proof"}</span>
                    </div>
                    {t.mySubmission ? (
                      <StatusBadge status={t.mySubmission.status} />
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setSubmitFor(t); setProofUrl(""); setProofWallet(""); setResult(null); setError(null); }}>
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
              Reward: {submitFor.rewardAmount} {submitFor.rewardToken === "PROJECT" ? project?.symbol : submitFor.rewardToken} ·{" "}
              {proofKind(submitFor.type) === "twitter" && "Proof = your X post link (follow/like/comment/post on @CLAWRENAi)."}
              {proofKind(submitFor.type) === "buy" && "Proof = the Solana wallet holding the coin — verified on-chain automatically."}
              {proofKind(submitFor.type) === "teach" && "Proof = link to the ClawPump help/trade you completed."}
              {proofKind(submitFor.type) === "custom" && "Proof = link and/or wallet for the project-token task."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(proofKind(submitFor.type) === "twitter" || proofKind(submitFor.type) === "teach" || proofKind(submitFor.type) === "custom") && (
                <div className="space-y-2">
                  <Label htmlFor="proof-url">Proof link (URL)</Label>
                  <Input id="proof-url" placeholder={proofKind(submitFor.type) === "twitter" ? "https://x.com/.../status/123456" : "https://..."} value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} required={proofKind(submitFor.type) !== "custom"} />
                  {proofKind(submitFor.type) === "twitter" && <p className="text-xs text-zinc-500">Paste the link of your X post / reply / like. Post must mention or reference @CLAWRENAi.</p>}
                  {proofKind(submitFor.type) === "teach" && <p className="text-xs text-zinc-500">Paste the link of the ClawPump help/trade you completed.</p>}
                  {proofKind(submitFor.type) === "custom" && <p className="text-xs text-zinc-500">Optional — link to your post/trade/share of the coin.</p>}
                </div>
              )}
              {(proofKind(submitFor.type) === "buy" || proofKind(submitFor.type) === "teach" || proofKind(submitFor.type) === "custom" || proofKind(submitFor.type) === "generic") && (
                <div className="space-y-2">
                  <Label htmlFor="proof-wallet">Solana wallet (receives the reward{proofKind(submitFor.type) === "buy" ? " and proof of holding" : ""})</Label>
                  <Input id="proof-wallet" placeholder="Your Solana wallet address" value={proofWallet} onChange={(e) => setProofWallet(e.target.value)} required={proofKind(submitFor.type) === "buy" || proofKind(submitFor.type) === "custom"} />
                  {proofKind(submitFor.type) === "buy" && <p className="text-xs text-zinc-500">Verified on-chain automatically — the wallet must hold the required amount of {project?.symbol}.</p>}
                  {proofKind(submitFor.type) === "teach" && <p className="text-xs text-zinc-500">Optional — the wallet that receives your $CLAW reward.</p>}
                  {proofKind(submitFor.type) === "custom" && <p className="text-xs text-zinc-500">Required — this wallet receives your {project?.symbol} reward.</p>}
                </div>
              )}
              {proofKind(submitFor.type) === "twitter" && (
                <div className="space-y-2">
                  <Label htmlFor="reward-wallet-twitter">Reward wallet (optional)</Label>
                  <Input id="reward-wallet-twitter" placeholder="Solana wallet for the ANSEM reward" value={proofWallet} onChange={(e) => setProofWallet(e.target.value)} />
                  <p className="text-xs text-zinc-500">Leave empty to use your registered account wallet. We recommend adding it so the reward can be paid.</p>
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
                  {s.proofWallet && <span className="font-mono">Reward wallet: {shortAddr(s.proofWallet)}</span>}
                </div>
                {s.status === "verified" && (
                  <p className="text-xs text-green-400 mt-1">Verified — payout is sent once approved by the treasury admin.</p>
                )}
                {s.status === "pending" && (
                  <p className="text-xs text-amber-400/80 mt-1">Pending review — you will see the payment here once approved.</p>
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
            <ShieldCheck className="h-4 w-4 text-amber-500" /> Admin Review & Treasury
          </CardTitle>
          <CardDescription>Admin only: set the platform treasury wallet, verify X-task submissions, and trigger payouts. Requires the admin secret.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {treasuryData && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" /> Treasury Wallet
              </p>
              {treasuryData.configured ? (
                <div className="mt-2 text-sm">
                  <p className="text-zinc-300">
                    Address: <span className="font-mono text-xs">{treasuryData.address}</span>{" "}
                    <Badge variant={treasuryData.hasKey ? "success" : "secondary"}>{treasuryData.hasKey ? "Key set — payouts enabled" : "No key"}</Badge>
                  </p>
                  {treasuryData.balances && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {uiAmount(treasuryData.balances.ansemBase, "ANSEM")} ANSEM · {uiAmount(treasuryData.balances.clawBase, "CLAW")} CLAW ·{" "}
                      {uiAmount(treasuryData.balances.projectBase, "PROJECT")} {project?.symbol} · {treasuryData.balances.sol.toFixed(4)} SOL
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">
                    Fund this address with the reward tokens, then Approve & Pay below sends real payouts from YOUR wallet.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-amber-300/90">
                  No treasury configured. Set YOUR treasury wallet below — payouts are sent from it.
                </p>
              )}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Input
                  type="password"
                  placeholder="Treasury private key (base58 secret key)"
                  value={treasuryKey}
                  onChange={(e) => setTreasuryKey(e.target.value)}
                  className="flex-1 font-mono text-xs"
                />
                <Button size="sm" variant="ansem" onClick={saveTreasury} disabled={treasurySaving || !treasuryKey.trim()}>
                  {treasurySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />} Set Treasury
                </Button>
                {treasuryData.configured && (
                  <Button size="sm" variant="outline" onClick={clearTreasury} disabled={treasurySaving}>Clear</Button>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-2">The key is encrypted on the server and never shown again. You can replace it any time.</p>
            </div>
          )}

          {adminData && (
            <div className="mt-2 space-y-3">
              <p className="text-xs text-zinc-500">
                Pending & auto-verified queue · {adminData.pending.length} waiting for payout
              </p>
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
