"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, Send, ArrowRightLeft, Store, Shield, Loader2,
  RefreshCw, ExternalLink, Copy, CheckCircle2, AlertTriangle,
} from "lucide-react";

const TOKEN_MAP: Record<string, string> = {
  SOL: "native",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ANSEM: "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
  CLAW: "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump",
};

const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  ANSEM: 6,
  CLAW: 6,
};

function toSmallestUnit(humanAmount: string, token: string): string {
  const decimals = TOKEN_DECIMALS[token] || 9;
  const parts = humanAmount.split(".");
  let whole = parts[0] || "0";
  let frac = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  // Remove leading zeros from whole part
  whole = whole.replace(/^0+/, "") || "0";
  return whole + frac;
}

function shortAddr(addr?: string, len = 6) {
  if (!addr) return "—";
  return addr.length > len * 2 + 3 ? `${addr.slice(0, len)}...${addr.slice(-len)}` : addr;
}

export default function PayBoxPage() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedCred, setSelectedCred] = useState("");
  const [portfolio, setPortfolio] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Transfer form
  const [transfer, setTransfer] = useState({ to: "", amount: "", token: "SOL" });
  // Swap form
  const [swap, setSwap] = useState({ src: "SOL", dst: "USDC", amount: "" });

  async function apiGet(action: string, extra?: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/paybox?action=${action}${extra ? "&" + extra : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (err: any) { setError(err.message); return null; }
    finally { setLoading(false); }
  }

  async function apiPost(body: any) {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      return data;
    } catch (err: any) { setError(err.message); return null; }
    finally { setLoading(false); }
  }

  async function loadWallets() {
    const data = await apiGet("credentials");
    if (data) {
      const creds = data.credentials || [];
      setCredentials(creds);
      if (creds.length > 0 && !selectedCred) setSelectedCred(creds[0].credential_id);
    }
  }

  async function loadPortfolio() {
    if (!selectedCred) { setError("Select a wallet first"); return; }
    const data = await apiGet("portfolio", `credentialId=${selectedCred}`);
    if (data) setPortfolio(data);
  }

  async function loadServices() {
    const data = await apiGet("services");
    if (data) setServices(data.services || data || []);
  }

  async function loadPolicies() {
    const data = await apiGet("policies");
    if (data) setPolicies(data.policies || data || []);
  }

  async function doTransfer() {
    if (!transfer.to || !transfer.amount) { setError("Fill recipient and amount"); return; }
    const smallestAmt = toSmallestUnit(transfer.amount, transfer.token);
    const txToken = TOKEN_MAP[transfer.token] || transfer.token;
    const body: any = { action: "transfer", credentialId: selectedCred, to: transfer.to, amount: smallestAmt };
    if (txToken && txToken !== "native") body.token = txToken;
    await apiPost(body);
  }

  async function doSwap() {
    if (!swap.amount) { setError("Fill amount"); return; }
    const smallestAmt = toSmallestUnit(swap.amount, swap.src);
    await apiPost({ action: "swap", credentialId: selectedCred, srcChain: "solana:mainnet", srcToken: TOKEN_MAP[swap.src] || swap.src, dstToken: TOKEN_MAP[swap.dst] || swap.dst, amount: smallestAmt });
  }

  async function createAnsemPolicy() {
    await apiPost({ action: "createAnsemPolicy" });
    loadPolicies();
  }

  async function copyAddr(addr: string) {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">PayBox Agent</h1>
        <p className="text-sm text-zinc-400">Your non-custodial wallet for agents — trade, swap, transfer across chains. Connect your PayBox API key in Settings → Accounts.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/20 p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      <Tabs defaultValue="wallet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="wallet" className="flex items-center gap-1"><Wallet className="h-4 w-4" /> Wallet</TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-1"><Send className="h-4 w-4" /> Transfer</TabsTrigger>
          <TabsTrigger value="swap" className="flex items-center gap-1"><ArrowRightLeft className="h-4 w-4" /> Swap</TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-1"><Store className="h-4 w-4" /> Services</TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-1"><Shield className="h-4 w-4" /> Policies</TabsTrigger>
        </TabsList>

        {/* WALLET */}
        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-amber-500" /> My Wallets</CardTitle>
              <CardDescription>Load your PayBox credentials and view balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" onClick={loadWallets} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}Load Wallets
                </Button>
                {selectedCred && (
                  <Button size="sm" variant="outline" onClick={loadPortfolio} disabled={loading}>Refresh Balance</Button>
                )}
              </div>

              {credentials.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">Select Wallet</Label>
                  <select className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={selectedCred} onChange={e => { setSelectedCred(e.target.value); setPortfolio(null); }}>
                    {credentials.map((c: any) => (
                      <option key={c.credential_id} value={c.credential_id}>
                        {c.name || c.kind} — {shortAddr(c.metadata?.address, 8)} ({c.metadata?.chains?.join(", ") || "solana"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCred && (() => {
                const cred = credentials.find((c: any) => c.credential_id === selectedCred);
                if (!cred) return null;
                return (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-200">{cred.name || cred.kind}</p>
                      <Badge variant="outline">{cred.approval_mode}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-zinc-500">Address:</p>
                      <p className="text-xs font-mono text-zinc-300">{cred.metadata?.address}</p>
                      <button onClick={() => copyAddr(cred.metadata?.address)} className="text-zinc-500 hover:text-zinc-300">
                        {copied ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">Chains: {cred.metadata?.chains?.join(", ")}</p>
                  </div>
                );
              })()}

              {portfolio && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                  <p className="text-sm font-medium text-zinc-200">Portfolio — ${portfolio.total_usd?.toFixed(2) || "0.00"} USD</p>
                  {(portfolio.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300">{item.symbol || shortAddr(item.token, 6)}</span>
                      <span className="font-mono text-zinc-400">{Number(item.amount).toFixed(4)}</span>
                      <span className="text-zinc-500">${item.usd_value?.toFixed(2) || "0"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRANSFER */}
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-amber-500" /> Transfer Tokens</CardTitle>
              <CardDescription>Send tokens from your PayBox wallet to any address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCred && <p className="text-xs text-zinc-500">Load wallets in the Wallet tab first.</p>}
              <div className="space-y-2">
                <Label className="text-xs text-zinc-400">Recipient Address</Label>
                <Input placeholder="Solana address (e.g. 4exzw...TaNdxRJ)" value={transfer.to} onChange={e => setTransfer({ ...transfer, to: e.target.value })} className="font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">Amount</Label>
                  <Input placeholder="0.1" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">Token</Label>
                  <select className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={transfer.token} onChange={e => setTransfer({ ...transfer, token: e.target.value })}>
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="ANSEM">$ANSEM</option>
                    <option value="CLAW">$CLAW</option>
                  </select>
                </div>
              </div>
              <Button onClick={doTransfer} disabled={loading || !selectedCred} className="bg-amber-600 hover:bg-amber-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send Transfer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SWAP */}
        <TabsContent value="swap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-amber-500" /> Swap Tokens</CardTitle>
              <CardDescription>Swap tokens via PayBox MCP across chains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCred && <p className="text-xs text-zinc-500">Load wallets in the Wallet tab first.</p>}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">From</Label>
                  <select className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={swap.src} onChange={e => setSwap({ ...swap, src: e.target.value })}>
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="ANSEM">$ANSEM</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">Amount</Label>
                  <Input placeholder="0.1" value={swap.amount} onChange={e => setSwap({ ...swap, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">To</Label>
                  <select className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={swap.dst} onChange={e => setSwap({ ...swap, dst: e.target.value })}>
                    <option value="USDC">USDC</option>
                    <option value="SOL">SOL</option>
                    <option value="ANSEM">$ANSEM</option>
                    <option value="CLAW">$CLAW</option>
                  </select>
                </div>
              </div>
              <Button onClick={doSwap} disabled={loading || !selectedCred} className="bg-amber-600 hover:bg-amber-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}Execute Swap
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SERVICES */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4 text-amber-500" /> PayBox Services</CardTitle>
              <CardDescription>Discover available x402 services and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button size="sm" onClick={loadServices} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}Discover Services
              </Button>
              {services.length > 0 && services.map((s: any, i: number) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">{s.name || s.id}</p>
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300"><ExternalLink className="h-4 w-4" /></a>}
                  </div>
                  <p className="text-xs text-zinc-500">{s.description}</p>
                  {s.pricing && <p className="text-xs text-amber-400">{s.pricing}</p>}
                </div>
              ))}
              {services.length === 0 && !loading && <p className="text-xs text-zinc-500">Click "Discover Services" to load.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POLICIES */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-amber-500" /> Spending Policies</CardTitle>
              <CardDescription>Create and manage spending limits and token restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" onClick={loadPolicies} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}Load Policies
                </Button>
                <Button size="sm" variant="outline" onClick={createAnsemPolicy} disabled={loading}>Create ANSEM-Only Policy</Button>
              </div>
              {policies.length > 0 && policies.map((p: any, i: number) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
                  <p className="text-sm font-medium text-zinc-200">{p.name || p.id}</p>
                  <p className="text-xs text-zinc-500">Action: {p.action || "allow"} · Priority: {p.priority || "default"}</p>
                  {(p.rules || []).map((r: any, j: number) => (
                    <p key={j} className="text-xs text-zinc-400 font-mono">{r.type}: {JSON.stringify(r)}</p>
                  ))}
                </div>
              ))}
              {policies.length === 0 && !loading && <p className="text-xs text-zinc-500">No policies yet. Create one to restrict spending.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result */}
      {result && (
        <Card className="border-green-800/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-300 font-medium mb-2">Result</p>
            <pre className="text-xs text-zinc-400 overflow-auto max-h-64 bg-zinc-900 rounded-md p-3">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
