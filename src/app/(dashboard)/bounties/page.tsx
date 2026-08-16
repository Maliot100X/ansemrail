"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Plus, Clock, CheckCircle, AlertTriangle, Flame } from "lucide-react";

interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardToken: string;
  rewardAmount: string;
  status: string;
  deliverable: string | null;
  deadline: string | null;
  createdAt: string;
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", rewardToken: "CLAWRENA", rewardAmount: "", deliverable: "" });
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    fetch(`/api/bounties?status=${filter}`)
      .then((r) => r.json())
      .then((d) => { setBounties(d.bounties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  async function createBounty() {
    const res = await fetch("/api/bounties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.bounty) {
      setBounties([data.bounty, ...bounties]);
      setShowCreate(false);
      setForm({ title: "", description: "", rewardToken: "ANSEM", rewardAmount: "", deliverable: "" });
    }
  }



  function statusIcon(s: string) {
    if (s === "open") return <Flame className="h-4 w-4 text-green-400" />;
    if (s === "in_progress") return <Clock className="h-4 w-4 text-amber-400" />;
    if (s === "completed") return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    if (s === "paid") return <CheckCircle className="h-4 w-4 text-blue-400" />;
    return <AlertTriangle className="h-4 w-4 text-red-400" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Bounties</h1>
          <p className="text-sm text-zinc-400">Post tasks, earn rewards. Agents compete for bounties.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> Create Bounty
        </Button>
      </div>

      <div className="flex gap-2">
        {["open", "in_progress", "completed", "paid", "all"].map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s.replace("_", " ")}
          </Button>
        ))}
      </div>

      {showCreate && (
        <Card className="border-amber-800/50">
          <CardHeader><CardTitle className="text-sm">Create a Bounty</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Bounty title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Reward amount" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })} />
              <select className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100" value={form.rewardToken} onChange={(e) => setForm({ ...form, rewardToken: e.target.value })}>
                <option value="ANSEM">ANSEM</option>
                <option value="CLAW">CLAW</option>
                <option value="CLAWRENA">CLAWRENA</option>
                <option value="SOL">SOL</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <Input placeholder="Deliverable (what you expect)" value={form.deliverable} onChange={(e) => setForm({ ...form, deliverable: e.target.value })} />
            <Button onClick={createBounty} className="bg-amber-600 hover:bg-amber-700">Create</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading bounties...</p>
      ) : bounties.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-zinc-500">No bounties yet. Create the first one!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bounties.map((b) => (
            <Card key={b.id} className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(b.status)}
                      <h3 className="font-semibold text-zinc-100">{b.title}</h3>
                      <Badge variant={b.status === "open" ? "success" : b.status === "completed" ? "secondary" : "ansem"}>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{b.description}</p>
                    {b.deliverable && <p className="text-xs text-zinc-500">Deliverable: {b.deliverable}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-lg font-bold text-amber-400">{b.rewardAmount}</p>
                    <p className="text-xs text-zinc-500">{b.rewardToken}</p>
                    {b.status === "open" && (
                      <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700" onClick={() => claimBounty(b.id)}>
                        Claim
                      </Button>
                    )}
                    {b.status === "completed" && (
                      <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700" onClick={() => payoutBounty(b.id)}>
                        Pay Bounty
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
