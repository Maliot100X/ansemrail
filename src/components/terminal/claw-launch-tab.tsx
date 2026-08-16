"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Rocket, Flame, Wallet, ExternalLink, Copy, CheckCircle2, Upload } from "lucide-react";

function shortAddr(addr?: string | null, len = 6) {
  if (!addr) return "—";
  return addr.length > len * 2 + 3
    ? `${addr.slice(0, len)}...${addr.slice(-len)}`
    : addr;
}

type ClawAgent = {
  id: string;
  name: string;
  status: string;
  walletAddress: string;
  model: string;
};

function ResultField({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm font-mono text-zinc-200 break-all">{String(value)}</p>
    </div>
  );
}

export default function ClawLaunchTab() {
  const [mode, setMode] = useState<"gasless" | "self-funded">("gasless");
  const [myAgents, setMyAgents] = useState<ClawAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [form, setForm] = useState({
    agentId: "",
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    twitter: "",
    website: "",
    devBuy: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [funding, setFunding] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function fetchMyAgents() {
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        const list = data?.agents || data || [];
        setMyAgents(list);
        if (list.length > 0 && !form.agentId) {
          setForm((f) => ({ ...f, agentId: list[0].id }));
        }
      }
    } catch {}
    setAgentsLoading(false);
  }

  useEffect(() => {
    fetchMyAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setFunding(null);
    try {
      const res = await fetch("/api/launch/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        const isFunding =
          !!data?.selfFunded ||
          data?.code === "MAX_GASLESS_LAUNCHES_PER_USER_EXCEEDED" ||
          data?.status === "needs_funding" ||
          data?.nextStep === "self_funded" ||
          data?.nextStep === "fund_agent_wallet";
        if (isFunding) {
          setFunding(data);
        } else {
          throw new Error(data.error || "Launch failed");
        }
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyAddress(addr: string) {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const selectedAgent = myAgents.find((a) => a.id === form.agentId);
  const launch = result?.launch || result;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("gasless")}
          className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
            mode === "gasless"
              ? "border-amber-600 bg-amber-950/30"
              : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <p className="text-sm font-medium text-zinc-100 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-amber-500" /> Gasless Launch
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Tokenizes the selected agent once using gasless sponsorship — no bonding-curve buy.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode("self-funded")}
          className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
            mode === "self-funded"
              ? "border-amber-600 bg-amber-950/30"
              : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <p className="text-sm font-medium text-zinc-100 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-500" /> Self-Funded
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Agent wallet pays creation (+ optional dev buy); tokens from the buy go to the agent wallet.
          </p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="claw-agent">ClawPump Agent</Label>
          {agentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your agents...
            </div>
          ) : myAgents.length === 0 ? (
            <p className="text-xs text-amber-400">
              No agents found for your connected key. Create one on the{" "}
              <a href="/agents" className="underline">Agents page</a> first, then refresh.
            </p>
          ) : (
            <select
              id="claw-agent"
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              value={form.agentId}
              onChange={(e) => setForm({ ...form, agentId: e.target.value })}
            >
              {myAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.id} ({a.status})
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-zinc-500">
            Launches only work with agents owned by your connected ClawPump key
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="claw-name">Token Name</Label>
            <Input
              id="claw-name"
              placeholder="My Token"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="claw-symbol">Ticker (max 12)</Label>
            <Input
              id="claw-symbol"
              placeholder="CLAW"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="claw-desc">Description</Label>
          <Input
            id="claw-desc"
            placeholder={mode === "self-funded" ? "Token description (min 20 characters)" : "Token description"}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="claw-image">Image URL (optional, https)</Label>
          <div className="flex gap-2">
            <Input
              id="claw-image"
              placeholder="https://... or upload an image"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
            <input
              id="claw-image-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("claw-image-file")?.click()}
              disabled={uploading}
              className="shrink-0"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading" : "Upload"}
            </Button>
          </div>
          {form.imageUrl && (
            <p className="text-[11px] text-zinc-500 break-all">
              Image URL: <span className="font-mono">{form.imageUrl}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="claw-twitter">X / Twitter URL (optional)</Label>
            <Input
              id="claw-twitter"
              placeholder="https://x.com/..."
              value={form.twitter}
              onChange={(e) => setForm({ ...form, twitter: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="claw-website">Website URL (optional)</Label>
            <Input
              id="claw-website"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
        </div>

        {mode === "self-funded" && (
          <div className="space-y-2">
            <Label htmlFor="claw-devbuy">Dev Buy (optional SOL)</Label>
            <Input
              id="claw-devbuy"
              placeholder="0.1"
              value={form.devBuy}
              onChange={(e) => setForm({ ...form, devBuy: e.target.value })}
            />
            <p className="text-xs text-zinc-500">
              Optional initial buy from the agent wallet. Leave empty for no dev buy.
            </p>
          </div>
        )}

        {mode === "self-funded" && selectedAgent && !selectedAgent.walletAddress && (
          <p className="text-xs text-amber-400">
            This agent has no wallet address — self-funded launches need the agent wallet to pay.
          </p>
        )}

        <Button type="submit" variant="ansem" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Flame className="h-4 w-4" />{" "}
              {mode === "gasless" ? "Launch Gasless Token" : "Launch Self-Funded Token"}
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/30 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {funding && (
        <div className="space-y-3 rounded-xl border border-amber-700/50 bg-zinc-950 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-500" /> Agent Wallet Needs Funding
            </p>
            <Badge variant="secondary">
              {funding.code === "MAX_GASLESS_LAUNCHES_PER_USER_EXCEEDED" ? "gasless limit reached" : "needs funding"}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            {funding.code === "MAX_GASLESS_LAUNCHES_PER_USER_EXCEEDED"
              ? funding.message ||
                "You have used your sponsored gasless launches. Fund the agent wallet, then retry as Self-Funded — ClawPump still mints on your behalf and you keep 65% of creator fees."
              : funding.selfFunded?.requiredSol
              ? `Fund the agent wallet with ~${funding.selfFunded.requiredSol} SOL, then retry as Self-Funded. ClawPump still mints on your behalf — you keep 65% of creator fees.`
              : funding.message || funding.error || "The agent wallet needs SOL to cover the launch. Fund it from an external wallet, then retry."}
          </p>
          {funding.selfFunded?.fundWallet && (
            <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Fund wallet</p>
                <p className="text-sm font-mono text-zinc-200 break-all">{funding.selfFunded.fundWallet}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyAddress(funding.selfFunded.fundWallet)}
                className="ml-3 shrink-0"
              >
                {copied ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
          {funding.selfFunded?.requiredSol && (
            <p className="text-xs text-zinc-500">
              Required: ~{funding.selfFunded.requiredSol} SOL · {funding.selfFunded.platformMintsOnYourBehalf ? "ClawPump mints on your behalf" : ""}
            </p>
          )}
          <Button
            type="button"
            variant="ansem"
            className="w-full"
            onClick={() => {
              setMode("self-funded");
              setFunding(null);
            }}
          >
            Retry as Self-Funded <Wallet className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border border-amber-700/50 bg-zinc-950 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-amber-500" /> Launch Result
            </p>
            <Badge variant="ansem">{launch?.status || "submitted"}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultField label="Launch ID" value={launch?.id || launch?.launchId} />
            <ResultField label="Token Symbol" value={form.symbol || launch?.symbol} />
            <ResultField label="Status" value={launch?.status} />
            <ResultField label="Created" value={launch?.createdAt} />
            <ResultField
              label="Mint Address"
              value={launch?.mintAddress || launch?.tokenAddress || launch?.predictedTokenAddress}
            />
            <ResultField label="TX Hash" value={launch?.txHash || launch?.txSignature || launch?.signature} />
            <ResultField label="Error" value={launch?.errorMessage} />
          </div>

          {(launch?.mintAddress || launch?.tokenAddress || launch?.predictedTokenAddress) && (
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://pump.fun/${launch?.mintAddress || launch?.tokenAddress || launch?.predictedTokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-400 underline hover:text-amber-300"
              >
                View on pump.fun <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`https://solscan.io/token/${launch?.mintAddress || launch?.tokenAddress || launch?.predictedTokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-400 underline hover:text-amber-300"
              >
                View on Solscan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {launch?.txHash && (
            <a
              href={`https://solscan.io/tx/${launch.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 underline hover:text-zinc-300"
            >
              Transaction {shortAddr(launch.txHash, 8)} <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-zinc-500">Full response</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-zinc-900 p-3 text-[11px] text-zinc-400">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
