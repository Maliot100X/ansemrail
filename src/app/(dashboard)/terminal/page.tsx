"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Zap, Repeat, TrendingUp, Network as BridgeIcon, Rocket } from "lucide-react";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ANSEM_MINT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
const CLAW_MINT = "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump";

const TOKEN_OPTIONS = [
  { label: "SOL", mint: SOL_MINT },
  { label: "USDC", mint: USDC_MINT },
  { label: "$ANSEM", mint: ANSEM_MINT },
  { label: "$CLAW", mint: CLAW_MINT },
];

function TokenSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {TOKEN_OPTIONS.map((t) => (
        <option key={t.mint} value={t.mint}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

export default function TerminalPage() {
  const [swapForm, setSwapForm] = useState({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: "1000000000",
  });
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DCA state
  const [dcaForm, setDcaForm] = useState({
    tokenMint: ANSEM_MINT,
    amountPerBuy: "50",
    frequency: "daily",
  });
  const [dcaResult, setDcaResult] = useState<any>(null);
  const [dcaLoading, setDcaLoading] = useState(false);
  const [dcaError, setDcaError] = useState<string | null>(null);

  // Perps state
  const [perpsForm, setPerpsForm] = useState({
    market: "SOL-PERP",
    side: "long" as "long" | "short",
    size: "1.0",
    leverage: "5x",
    margin: "100",
  });
  const [perpsResult, setPerpsResult] = useState<any>(null);
  const [perpsLoading, setPerpsLoading] = useState(false);
  const [perpsError, setPerpsError] = useState<string | null>(null);

  // Bridge state
  const [bridgeForm, setBridgeForm] = useState({
    fromChain: "solana",
    toChain: "ethereum",
    token: "USDC",
    amount: "100",
  });
  const [bridgeResult, setBridgeResult] = useState<any>(null);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  // PONS Launch state
  const [ponsForm, setPonsForm] = useState({
    agentId: "",
    name: "",
    symbol: "",
    description: "",
    logoUrl: "",
    payoutWallet: "",
  });
  const [ponsResult, setPonsResult] = useState<any>(null);
  const [ponsLoading, setPonsLoading] = useState(false);
  const [ponsError, setPonsError] = useState<string | null>(null);
  const [ponsLaunches, setPonsLaunches] = useState<any[]>([]);
  const [ponsLaunchesLoading, setPonsLaunchesLoading] = useState(false);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [executeAgentId, setExecuteAgentId] = useState("");
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<any>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);

  async function handleQuote(e: React.FormEvent) {
    e.preventDefault();
    setQuoteLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quote failed");
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault();
    if (!executeAgentId) {
      setExecuteError("Select a ClawPump agent to execute the swap with.");
      return;
    }
    setExecuting(true);
    setExecuteError(null);
    setExecuteResult(null);
    try {
      const res = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: executeAgentId,
          inputMint: swapForm.inputMint,
          outputMint: swapForm.outputMint,
          amount: swapForm.amount,
          slippageBps: 50,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap execution failed");
      setExecuteResult(data);
    } catch (err: any) {
      setExecuteError(err.message);
    } finally {
      setExecuting(false);
    }
  }

  async function handleDca(e: React.FormEvent) {
    e.preventDefault();
    setDcaLoading(true);
    setDcaError(null);
    setDcaResult(null);
    try {
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputMint: USDC_MINT,
          outputMint: dcaForm.tokenMint,
          amount: (parseFloat(dcaForm.amountPerBuy) * 1_000_000).toString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "DCA quote failed");
      const outSymbol = TOKEN_OPTIONS.find((t) => t.mint === dcaForm.tokenMint)?.label || "token";
      setDcaResult({
        schedule: dcaForm.frequency,
        amountUsd: dcaForm.amountPerBuy,
        token: outSymbol,
        quote: data,
        message: `DCA order simulated: Buy $${dcaForm.amountPerBuy} of ${outSymbol} ${dcaForm.frequency}. Quote generated from Jupiter.`,
      });
    } catch (err: any) {
      setDcaError(err.message);
    } finally {
      setDcaLoading(false);
    }
  }

  async function handlePerps(e: React.FormEvent) {
    e.preventDefault();
    setPerpsLoading(true);
    setPerpsError(null);
    setPerpsResult(null);
    try {
      const marginUsd = parseFloat(perpsForm.margin) || 0;
      const leverageNum = parseInt(perpsForm.leverage) || 1;
      const sizeNum = parseFloat(perpsForm.size) || 0;
      const notional = sizeNum * leverageNum;
      setPerpsResult({
        market: perpsForm.market,
        side: perpsForm.side,
        size: sizeNum,
        leverage: perpsForm.leverage,
        margin: marginUsd,
        notionalValue: notional,
        liquidationPrice: perpsForm.side === "long" ? marginUsd / notional : undefined,
        message: `Position preview: ${perpsForm.side.toUpperCase()} ${sizeNum} ${perpsForm.market} at ${perpsForm.leverage} leverage. Notional: $${notional.toFixed(2)}. Margin: $${marginUsd}. Execute via ClawPump agent with perps skill.`,
        warning: "Perps can result in total loss of margin. Ensure your agent has the perps skill enabled.",
      });
    } catch (err: any) {
      setPerpsError(err.message);
    } finally {
      setPerpsLoading(false);
    }
  }

  async function handleBridge(e: React.FormEvent) {
    e.preventDefault();
    setBridgeLoading(true);
    setBridgeError(null);
    setBridgeResult(null);
    try {
      const res = await fetch("https://agents.moonpay.com/api/tools/chain_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testnet: false, vmId: 0 }),
      });
      const chains = await res.json();
      const fromChainInfo = chains.items?.find((c: any) => c.id === bridgeForm.fromChain);
      const toChainInfo = chains.items?.find((c: any) => c.id === bridgeForm.toChain);
      setBridgeResult({
        fromChain: bridgeForm.fromChain,
        toChain: bridgeForm.toChain,
        token: bridgeForm.token,
        amount: bridgeForm.amount,
        fromChainInfo: fromChainInfo ? { name: fromChainInfo.name, id: fromChainInfo.id } : null,
        toChainInfo: toChainInfo ? { name: toChainInfo.name, id: toChainInfo.id } : null,
        message: `Bridge preview: ${bridgeForm.amount} ${bridgeForm.token} from ${bridgeForm.fromChain} to ${bridgeForm.toChain}. Chain data retrieved from MoonPay. Execute via MoonPay CLI (mp) with authenticated wallet.`,
      });
    } catch (err: any) {
      setBridgeError(err.message);
    } finally {
      setBridgeLoading(false);
    }
  }

  async function handlePonsLaunch(e: React.FormEvent) {
    e.preventDefault();
    setPonsLoading(true);
    setPonsError(null);
    setPonsResult(null);
    try {
      const res = await fetch("/api/launch/pons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ponsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PONS launch failed");
      setPonsResult(data);
      if (data.launch?.tokenAddress || data.launch?.predictedTokenAddress) {
        setTimeout(() => fetchPonsLaunches(ponsForm.agentId), 3000);
      }
    } catch (err: any) {
      setPonsError(err.message);
    } finally {
      setPonsLoading(false);
    }
  }

  async function fetchPonsLaunches(agentId: string) {
    if (!agentId) return;
    setPonsLaunchesLoading(true);
    try {
      const res = await fetch(`/api/launch/pons?agentId=${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setPonsLaunches(data?.launches || []);
      }
    } catch {}
    setPonsLaunchesLoading(false);
  }

  async function fetchMyAgents() {
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        const list = data.agents || [];
        setMyAgents(list);
        if (list.length > 0 && !ponsForm.agentId) {
          setPonsForm((prev) => ({ ...prev, agentId: list[0].id }));
        }
      }
    } catch {}
    setAgentsLoading(false);
  }

  useEffect(() => {
    fetchMyAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Trading Terminal</h1>
        <p className="text-sm text-zinc-400">Swap, DCA, perps, and multi-chain bridges via ClawPump + MoonPay</p>
      </div>

      <Tabs defaultValue="swap">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="swap" className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> Swap
          </TabsTrigger>
          <TabsTrigger value="dca" className="flex items-center gap-1">
            <Repeat className="h-3 w-3" /> DCA
          </TabsTrigger>
          <TabsTrigger value="perps" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Perps
          </TabsTrigger>
          <TabsTrigger value="bridge" className="flex items-center gap-1">
            <BridgeIcon className="h-3 w-3" /> Bridge
          </TabsTrigger>
          <TabsTrigger value="pons" className="flex items-center gap-1">
            <Rocket className="h-3 w-3" /> Launch
          </TabsTrigger>
        </TabsList>

        {/* SWAP */}
        <TabsContent value="swap" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Token Swap</CardTitle>
              <CardDescription>Get a real quote from Jupiter aggregator — simulate-first pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuote} className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Token</Label>
                  <TokenSelect
                    value={swapForm.inputMint}
                    onChange={(v) => setSwapForm({ ...swapForm, inputMint: v })}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-zinc-600" />
                </div>

                <div className="space-y-2">
                  <Label>Output Token</Label>
                  <TokenSelect
                    value={swapForm.outputMint}
                    onChange={(v) => setSwapForm({ ...swapForm, outputMint: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (in lamports/units)</Label>
                  <Input
                    id="amount"
                    value={swapForm.amount}
                    onChange={(e) => setSwapForm({ ...swapForm, amount: e.target.value })}
                    placeholder="1000000000 (1 SOL)"
                  />
                  <p className="text-xs text-zinc-500">1 SOL = 1,000,000,000 lamports · 1 USDC = 1,000,000 units</p>
                </div>

                <Button type="submit" variant="ansem" className="w-full" disabled={quoteLoading}>
                  {quoteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get Quote <Zap className="h-4 w-4" /></>}
                </Button>
              </form>

              {error && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {quote && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Zap className="h-4 w-4" /> Quote Received
                  </p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                    {JSON.stringify(quote, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(quote, null, 2))}
                    >
                      Copy Quote JSON
                    </Button>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-green-900">
                    <Label htmlFor="exec-agent">Execute with agent</Label>
                    {agentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading your agents...
                      </div>
                    ) : myAgents.length === 0 ? (
                      <p className="text-xs text-amber-400">
                        No agents found for your connected key. Create one on the{" "}
                        <a href="/agents" className="underline">Agents page</a> first.
                      </p>
                    ) : (
                      <select
                        id="exec-agent"
                        className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                        value={executeAgentId}
                        onChange={(e) => setExecuteAgentId(e.target.value)}
                      >
                        <option value="">Select an agent...</option>
                        {myAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} — {a.id} ({a.status})
                          </option>
                        ))}
                      </select>
                    )}
                    <Button
                      type="button"
                      variant="ansem"
                      size="sm"
                      className="w-full"
                      disabled={executing || !executeAgentId}
                      onClick={handleExecute}
                    >
                      {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      Execute Swap via Agent Wallet
                    </Button>
                    <p className="text-xs text-zinc-500">
                      Executes through the selected ClawPump agent&apos;s own wallet with your connected key. The agent must own SOL/SPL balance for the swap.
                    </p>
                  </div>
                </div>
              )}

              {executeError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{executeError}</p>
                </div>
              )}

              {executeResult && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Zap className="h-4 w-4" /> Swap Executed
                  </p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                    {JSON.stringify(executeResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DCA */}
        <TabsContent value="dca" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Dollar-Cost Averaging</CardTitle>
              <CardDescription>Set up recurring buys — get a real quote per buy from Jupiter</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDca} className="space-y-4">
                <div className="space-y-2">
                  <Label>Token to DCA</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={dcaForm.tokenMint}
                    onChange={(e) => setDcaForm({ ...dcaForm, tokenMint: e.target.value })}
                  >
                    <option value={ANSEM_MINT}>$ANSEM</option>
                    <option value={SOL_MINT}>SOL</option>
                    <option value={CLAW_MINT}>$CLAW</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount per buy (USDC)</Label>
                    <Input
                      placeholder="50"
                      value={dcaForm.amountPerBuy}
                      onChange={(e) => setDcaForm({ ...dcaForm, amountPerBuy: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={dcaForm.frequency}
                      onChange={(e) => setDcaForm({ ...dcaForm, frequency: e.target.value })}
                    >
                      <option value="hourly">Every hour</option>
                      <option value="daily">Every day</option>
                      <option value="weekly">Every week</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={dcaLoading}>
                  {dcaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generate DCA Quote <Repeat className="h-4 w-4" /></>}
                </Button>
              </form>

              {dcaError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{dcaError}</p>
                </div>
              )}

              {dcaResult && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Repeat className="h-4 w-4" /> DCA Preview
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Schedule</p>
                      <p className="text-zinc-200 capitalize">{dcaResult.schedule}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Amount</p>
                      <p className="text-zinc-200">${dcaResult.amountUsd}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Token</p>
                      <p className="text-zinc-200">{dcaResult.token}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">{dcaResult.message}</p>
                  {dcaResult.quote && (
                    <pre className="text-xs text-zinc-300 overflow-auto max-h-32">
                      {JSON.stringify(dcaResult.quote, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERPS */}
        <TabsContent value="perps" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Phoenix Perps</CardTitle>
              <CardDescription>Preview perpetual futures positions on Phoenix DEX</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePerps} className="space-y-4">
                <div className="space-y-2">
                  <Label>Market</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={perpsForm.market}
                    onChange={(e) => setPerpsForm({ ...perpsForm, market: e.target.value })}
                  >
                    <option>SOL-PERP</option>
                    <option>BTC-PERP</option>
                    <option>ETH-PERP</option>
                    <option>$ANSEM-PERP</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Side</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${perpsForm.side === "long" ? "border-green-600 text-green-400 bg-green-950/30" : "border-zinc-700 text-zinc-400"}`}
                        onClick={() => setPerpsForm({ ...perpsForm, side: "long" })}
                      >
                        Long
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${perpsForm.side === "short" ? "border-red-600 text-red-400 bg-red-950/30" : "border-zinc-700 text-zinc-400"}`}
                        onClick={() => setPerpsForm({ ...perpsForm, side: "short" })}
                      >
                        Short
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Size (SOL)</Label>
                    <Input
                      placeholder="1.0"
                      value={perpsForm.size}
                      onChange={(e) => setPerpsForm({ ...perpsForm, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leverage</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={perpsForm.leverage}
                      onChange={(e) => setPerpsForm({ ...perpsForm, leverage: e.target.value })}
                    >
                      <option value="1x">1x</option>
                      <option value="2x">2x</option>
                      <option value="5x">5x</option>
                      <option value="10x">10x</option>
                      <option value="20x">20x</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Margin (USDC)</Label>
                    <Input
                      placeholder="100"
                      value={perpsForm.margin}
                      onChange={(e) => setPerpsForm({ ...perpsForm, margin: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={perpsLoading}>
                  {perpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Preview Position <TrendingUp className="h-4 w-4" /></>}
                </Button>
              </form>

              {perpsError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{perpsError}</p>
                </div>
              )}

              {perpsResult && (
                <div className="mt-4 space-y-3 rounded-md border border-amber-800 bg-amber-950/20 p-4">
                  <p className="text-sm font-medium text-amber-400 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Position Preview
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">Market</p>
                      <p className="text-zinc-200">{perpsResult.market}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Side</p>
                      <p className={perpsResult.side === "long" ? "text-green-400" : "text-red-400"}>
                        {perpsResult.side.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Leverage</p>
                      <p className="text-zinc-200">{perpsResult.leverage}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Notional</p>
                      <p className="text-zinc-200">${perpsResult.notionalValue.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">{perpsResult.message}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">High Risk</Badge>
                    <span className="text-xs text-zinc-500">{perpsResult.warning}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRIDGE */}
        <TabsContent value="bridge" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Chain Bridge</CardTitle>
              <CardDescription>Bridge assets across chains — chain data from MoonPay</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBridge} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Chain</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={bridgeForm.fromChain}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, fromChain: e.target.value })}
                    >
                      <option value="solana">Solana</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="base">Base</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="polygon">Polygon</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Chain</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={bridgeForm.toChain}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, toChain: e.target.value })}
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="solana">Solana</option>
                      <option value="base">Base</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="polygon">Polygon</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={bridgeForm.token}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, token: e.target.value })}
                    >
                      <option>USDC</option>
                      <option>SOL</option>
                      <option>ETH</option>
                      <option>USDT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      placeholder="100"
                      value={bridgeForm.amount}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, amount: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={bridgeLoading}>
                  {bridgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get Bridge Preview <BridgeIcon className="h-4 w-4" /></>}
                </Button>
              </form>

              {bridgeError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{bridgeError}</p>
                </div>
              )}

              {bridgeResult && (
                <div className="mt-4 space-y-3 rounded-md border border-blue-800 bg-blue-950/20 p-4">
                  <p className="text-sm font-medium text-blue-400 flex items-center gap-1">
                    <BridgeIcon className="h-4 w-4" /> Bridge Preview
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">From</p>
                      <p className="text-zinc-200 capitalize">{bridgeResult.fromChain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">To</p>
                      <p className="text-zinc-200 capitalize">{bridgeResult.toChain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Token</p>
                      <p className="text-zinc-200">{bridgeResult.token}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Amount</p>
                      <p className="text-zinc-200">{bridgeResult.amount}</p>
                    </div>
                  </div>
                  {bridgeResult.fromChainInfo && bridgeResult.toChainInfo && (
                    <div className="text-xs text-zinc-500">
                      <p>From: {bridgeResult.fromChainInfo.name} (ID: {bridgeResult.fromChainInfo.id})</p>
                      <p>To: {bridgeResult.toChainInfo.name} (ID: {bridgeResult.toChainInfo.id})</p>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400">{bridgeResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PONS LAUNCH */}
        <TabsContent value="pons" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-amber-500" />
                Gasless Token Launch (Robinhood Chain)
              </CardTitle>
              <CardDescription>
                Launch a token on Robinhood Chain — ClawPump fronts gas & fees. Creator fees route to your payout wallet.
                Requires a sponsored PONS allowance on the agent (contact ClawPump). If ClawPump is temporarily
                unavailable, the API returns 503 and the launch should be retried later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePonsLaunch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pons-agent">ClawPump Agent</Label>
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
                      id="pons-agent"
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={ponsForm.agentId}
                      onChange={(e) => setPonsForm({ ...ponsForm, agentId: e.target.value })}
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
                    <Label htmlFor="pons-name">Token Name</Label>
                    <Input
                      id="pons-name"
                      placeholder="My Token"
                      value={ponsForm.name}
                      onChange={(e) => setPonsForm({ ...ponsForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pons-symbol">Ticker (max 12)</Label>
                    <Input
                      id="pons-symbol"
                      placeholder="CLAW"
                      value={ponsForm.symbol}
                      onChange={(e) => setPonsForm({ ...ponsForm, symbol: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pons-desc">Description (optional)</Label>
                  <Input
                    id="pons-desc"
                    placeholder="Token description"
                    value={ponsForm.description}
                    onChange={(e) => setPonsForm({ ...ponsForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pons-payout">Payout Address (0x... EVM)</Label>
                  <Input
                    id="pons-payout"
                    placeholder="0x... where creator fees land"
                    value={ponsForm.payoutWallet}
                    onChange={(e) => setPonsForm({ ...ponsForm, payoutWallet: e.target.value })}
                  />
                  <p className="text-xs text-zinc-500">Your Robinhood Chain payout address — where ETH/WETH creator fees land</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pons-logo">Logo URL (optional, https)</Label>
                  <Input
                    id="pons-logo"
                    placeholder="https://..."
                    value={ponsForm.logoUrl}
                    onChange={(e) => setPonsForm({ ...ponsForm, logoUrl: e.target.value })}
                  />
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={ponsLoading}>
                  {ponsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Launch Gasless Token <Rocket className="h-4 w-4" /></>}
                </Button>
              </form>

              {ponsError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{ponsError}</p>
                </div>
              )}

              {ponsResult && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Rocket className="h-4 w-4" /> Launch Initiated
                  </p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                    {JSON.stringify(ponsResult, null, 2)}
                  </pre>
                  {ponsResult.launch?.tokenAddress && (
                    <a
                      href={`https://clawpump.tech/tokens/${ponsResult.launch.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ansem" size="sm" className="w-full">
                        View Token on ClawPump
                      </Button>
                    </a>
                  )}
                  {ponsResult.launch?.status === "reserved" && (
                    <p className="text-xs text-amber-400">
                      Token is being minted on Robinhood Chain. Check back shortly — do NOT re-submit or you will mint a second token.
                    </p>
                  )}
                </div>
              )}

              {ponsLaunches.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-zinc-300">Your PONS Launches</p>
                  {ponsLaunches.map((launch, i) => (
                    <div key={i} className="rounded-md border border-zinc-700 bg-zinc-900/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">{launch.symbol || launch.name}</span>
                        <Badge variant={launch.status === "confirmed" || launch.status === "soft_confirmed" ? "default" : "secondary"}>
                          {launch.status}
                        </Badge>
                      </div>
                      {launch.tokenAddress && (
                        <a
                          href={`https://clawpump.tech/tokens/${launch.tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-500 underline"
                        >
                          {launch.tokenAddress.slice(0, 12)}...{launch.tokenAddress.slice(-8)}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
