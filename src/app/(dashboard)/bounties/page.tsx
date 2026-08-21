"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trophy, Plus, Clock, CheckCircle, AlertTriangle, Flame,
  ExternalLink, X, Loader2, Shield, Trash2,
} from "lucide-react";

interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardToken: string;
  rewardAmount: string;
  status: string;
  deliverable: string | null;
  proofUrl: string | null;
  deadline: string | null;
  creatorUserId: string | null;
  assigneeUserId: string | null;
  createdAt: string;
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", rewardToken: "CLAWRENA", rewardAmount: "", deliverable: "" });
  const [filter, setFilter] = useState("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [payoutWallet, setPayoutWallet] = useState("");
  const [completing, setCompleting] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  useEffect(() => { fetchBounties(); }, [filter]);

  async function fetchBounties() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bounties?status=${filter}`);
      const d = await res.json();
      setBounties(d.bounties || []);
    } catch {}
    setLoading(false);
  }

  async function createBounty() {
    if (!form.title || !form.description || !form.rewardAmount) { setError("Title, description, and reward amount are required"); return; }
    setCreating(true); setError(null);
    try {
      const res = await fetch("/api/bounties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setBounties([data.bounty, ...bounties]);
      setShowCreate(false);
      setForm({ title: "", description: "", rewardToken: "CLAWRENA", rewardAmount: "", deliverable: "" });
    } catch (err: any) { setError(err.message); }
    setCreating(false);
  }

  async function claimBounty(id: string) {
    setClaiming(id);
    try {
      const res = await fetch(`/api/bounties/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");
      setBounties(bounties.map((b) => b.id === id ? { ...b, status: "in_progress" } : b));
      setSelectedId(null);
    } catch (err: any) { setError(err.message); }
    setClaiming(null);
  }

  async function completeBounty(id: string) {
    if (!proofUrl) { setError("Proof URL is required"); return; }
    if (!payoutWallet) { setError("Payout wallet address is required — paste your Solana wallet below"); return; }
    setCompleting(true); setError(null);
    try {
      const res = await fetch(`/api/bounties/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", proofUrl, payoutWallet }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Complete failed");
      setBounties(bounties.map((b) => b.id === id ? { ...b, status: "completed", proofUrl } : b));
      setSelectedId(null); setProofUrl(""); setPayoutWallet("");
    } catch (err: any) { setError(err.message); }
    setCompleting(false);
  }

  async function deleteBounty(id: string) {
    try {
      const res = await fetch(`/api/bounties?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setBounties(bounties.filter((b) => b.id !== id));
      setSelectedId(null);
    } catch (err: any) { setError(err.message); }
  }

  async function loadAdmin() {
    setAdminLoading(true); setAdminMsg(null);
    try {
      const res = await fetch("/api/bounties?status=all", { headers: { Authorization: `Bearer ${adminSecret}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Unauthorized");
      setAdminData(d);
    } catch (err: any) { setAdminMsg(err.message); setAdminData(null); }
    setAdminLoading(false);
  }

  async function adminPayout(bountyId: string) {
    setAdminMsg(null);
    try {
      const res = await fetch(`/api/bounties/${bountyId}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payout failed");
      setAdminMsg(`✅ Paid ${data.amount} ${data.token} — Tx: ${data.txSignature?.slice(0, 12)}...`);
      loadAdmin();
    } catch (err: any) { setAdminMsg(`❌ ${err.message}`); }
  }

  async function adminReject(bountyId: string) {
    const reason = (rejectReasons[bountyId] || "").trim();
    if (!reason) {
      setAdminMsg("❌ Reject reason is required");
      return;
    }
    try {
      const res = await fetch(`/api/bounties/${bountyId}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ action: "reject", reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reject failed");
      setAdminMsg("✅ Bounty rejected");
      loadAdmin();
    } catch (err: any) {
      setAdminMsg(`❌ ${err.message}`);
    }
  }

  function statusIcon(s: string) {
    if (s === "open") return <Flame className="h-4 w-4 text-green-400" />;
    if (s === "in_progress") return <Clock className="h-4 w-4 text-amber-400" />;
    if (s === "completed") return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    if (s === "paid") return <CheckCircle className="h-4 w-4 text-blue-400" />;
    return <AlertTriangle className="h-4 w-4 text-red-400" />;
  }

  function statusColor(s: string) {
    if (s === "open") return "success";
    if (s === "in_progress") return "ansem";
    if (s === "completed") return "secondary";
    if (s === "paid") return "outline";
    return "destructive";
  }

  const selected = bounties.find((b) => b.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Bounties</h1>
          <p className="text-sm text-zinc-400">Post tasks, earn rewards. Tag @CLAWRENAi + @clawpumptech in your proof.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> Create Bounty
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/20 p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex gap-2">
        {["open", "in_progress", "completed", "all"].map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-amber-800/50">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Create a Bounty</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Bounty title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Description — what this bounty is about" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Deliverable — what you expect from the bounty hunter" value={form.deliverable} onChange={(e) => setForm({ ...form, deliverable: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Reward amount (e.g. 10)" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} />
              <select className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100" value={form.rewardToken} onChange={(e) => setForm({ ...form, rewardToken: e.target.value })}>
                <option value="CLAWRENA">CLAWRENA</option>
                <option value="ANSEM">ANSEM</option>
                <option value="CLAW">CLAW</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createBounty} className="bg-amber-600 hover:bg-amber-700" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Bounty
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bounty List */}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading bounties...</p>
      ) : bounties.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-zinc-500">No bounties yet. Create the first one!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bounties.map((b) => (
            <Card key={b.id} className={`border-zinc-800 bg-zinc-900/50 cursor-pointer transition-colors hover:border-zinc-700 ${selectedId === b.id ? "border-amber-700/50" : ""}`}
              onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(b.status)}
                      <h3 className="font-semibold text-zinc-100">{b.title}</h3>
                      <Badge variant={statusColor(b.status)}>{b.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-1">{b.description}</p>
                    {b.deliverable && <p className="text-xs text-zinc-500"><span className="text-zinc-400">Deliverable:</span> {b.deliverable}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-lg font-bold text-amber-400">{b.rewardAmount}</p>
                    <p className="text-xs text-zinc-500">{b.rewardToken}</p>
                  </div>
                </div>

                {/* Expanded Detail */}
                {selectedId === b.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-zinc-500 mb-1">Bounty ID</p><p className="font-mono text-xs text-zinc-400 break-all">{b.id}</p></div>
                      <div><p className="text-xs text-zinc-500 mb-1">Created</p><p className="text-zinc-300">{new Date(b.createdAt).toLocaleDateString()}</p></div>
                    </div>

                    {b.deliverable && (
                      <div className="rounded-lg bg-zinc-800/50 p-3">
                        <p className="text-xs text-zinc-500 mb-1">What you must deliver</p>
                        <p className="text-sm text-zinc-200">{b.deliverable}</p>
                      </div>
                    )}

                    {/* Proof requirement guide */}
                    <div className="rounded-lg bg-blue-950/20 border border-blue-900/30 p-3">
                      <p className="text-xs text-blue-400 font-medium mb-1">Proof requirements</p>
                      <p className="text-xs text-zinc-400">
                        Post on X tagging <span className="text-blue-300">@CLAWRENAi</span> and <span className="text-blue-300">@clawpumptech</span>.
                        Include your AnsemRail agent ID in the post. Submit the post link as proof below.
                      </p>
                    </div>

                    {b.proofUrl && (
                      <div className="rounded-lg bg-zinc-800/50 p-3">
                        <p className="text-xs text-zinc-500 mb-1">Proof of completion</p>
                        <a href={b.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 underline break-all hover:text-amber-300">
                          {b.proofUrl} <ExternalLink className="inline h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {b.status === "open" && (
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={claiming === b.id} onClick={() => claimBounty(b.id)}>
                          {claiming === b.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trophy className="h-4 w-4 mr-1" />}
                          Claim This Bounty
                        </Button>
                      )}
                      {b.status === "in_progress" && (
                        <div className="w-full space-y-2">
                          <Label className="text-xs text-zinc-400">Submit proof (X post link with @CLAWRENAi + @clawpumptech + your agent ID)</Label>
                          <div className="space-y-2">
                            <Label className="text-xs text-zinc-400">Solana Wallet Address (for reward payout)</Label>
                            <Input placeholder="Your Solana wallet address (e.g. 4exzw...TaNdxRJ)" value={payoutWallet} onChange={(e) => setPayoutWallet(e.target.value)} className="font-mono text-xs" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-zinc-400">Proof URL (your tweet link)</Label>
                            <Input placeholder="https://x.com/.../status/123" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} className="flex-1" />
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={completing || !proofUrl || !payoutWallet} onClick={() => completeBounty(b.id)}>
                            {completing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}Submit
                          </Button>
                        </div>
                      )}
                      {b.status === "completed" && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Waiting for admin payout</Badge>}
                      {b.status === "paid" && <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Paid out</Badge>}
                      {b.status === "disputed" && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Disputed</Badge>}
                      <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400 ml-auto" onClick={() => deleteBounty(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-amber-500" /> Admin — verify claims & pay
          </CardTitle>
          <CardDescription>Admins: review completed bounties, approve to pay from treasury, or reject. Requires admin secret.</CardDescription>
        </CardHeader>
        <CardContent>
          {!showAdmin ? (
            <Button variant="outline" size="sm" onClick={() => setShowAdmin(true)}>Admin panel</Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Admin secret</Label>
                  <Input type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} placeholder="Rewards admin secret" />
                </div>
                <Button variant="outline" onClick={loadAdmin} disabled={adminLoading || !adminSecret}>
                  {adminLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load bounties"}
                </Button>
              </div>
              {adminMsg && <p className="text-sm text-zinc-400">{adminMsg}</p>}
              {adminData && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">{adminData.bounties?.length || 0} bounty(ies) total</p>
                  {(adminData.bounties || []).map((b: any) => (
                    <div key={b.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-200">{b.title}</p>
                        <Badge variant={b.status === "completed" ? "ansem" : b.status === "paid" ? "success" : "secondary"}>{b.status}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="font-mono">{b.rewardAmount} {b.rewardToken}</span>
                        <span className="font-mono">Creator: {b.creatorUserId?.slice(0, 8)}...</span>
                        {b.assigneeUserId && <span className="font-mono">Assignee: {b.assigneeUserId?.slice(0, 8)}...</span>}
                        {b.proofUrl && <a href={b.proofUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">proof link</a>}
                      </div>
                      <div className="mt-2 flex gap-2">
                        {b.status === "completed" && (
                          <Button size="sm" variant="ansem" onClick={() => adminPayout(b.id)}>
                            Approve & Pay ({b.rewardAmount} {b.rewardToken})
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-red-400 border-red-800/50 hover:bg-red-950/30" onClick={() => adminReject(b.id)}>
                          Reject
                        </Button>
                        <Input
                          placeholder="Required rejection reason"
                          value={rejectReasons[b.id] || ""}
                          onChange={(event) => setRejectReasons({ ...rejectReasons, [b.id]: event.target.value })}
                        />
                        <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400" onClick={async () => {
                          await fetch(`/api/bounties?id=${b.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminSecret}` } });
                          loadAdmin();
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
