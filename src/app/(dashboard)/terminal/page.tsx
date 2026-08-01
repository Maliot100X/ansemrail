"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Zap } from "lucide-react";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ANSEM_MINT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

export default function TerminalPage() {
  const [swapForm, setSwapForm] = useState({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: "1000000000",
  });
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Trading Terminal</h1>
        <p className="text-sm text-zinc-400">Swap, DCA, perps, and multi-chain bridges via ClawPump + MoonPay</p>
      </div>

      <Tabs defaultValue="swap">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="dca">DCA</TabsTrigger>
          <TabsTrigger value="perps">Perps</TabsTrigger>
          <TabsTrigger value="bridge">Bridge</TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Token Swap</CardTitle>
              <CardDescription>Get a quote before executing — simulate-first pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuote} className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Token Mint</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={swapForm.inputMint}
                    onChange={(e) => setSwapForm({ ...swapForm, inputMint: e.target.value })}
                  >
                    <option value={SOL_MINT}>SOL</option>
                    <option value={USDC_MINT}>USDC</option>
                    <option value={ANSEM_MINT}>$ANSEM</option>
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-zinc-600" />
                </div>

                <div className="space-y-2">
                  <Label>Output Token Mint</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={swapForm.outputMint}
                    onChange={(e) => setSwapForm({ ...swapForm, outputMint: e.target.value })}
                  >
                    <option value={SOL_MINT}>SOL</option>
                    <option value={USDC_MINT}>USDC</option>
                    <option value={ANSEM_MINT}>$ANSEM</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (in lamports/units)</Label>
                  <Input
                    id="amount"
                    value={swapForm.amount}
                    onChange={(e) => setSwapForm({ ...swapForm, amount: e.target.value })}
                    placeholder="1000000000 (1 SOL)"
                  />
                  <p className="text-xs text-zinc-500">1 SOL = 1,000,000,000 lamports</p>
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
                <div className="mt-4 space-y-2 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400">Quote Received</p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                    {JSON.stringify(quote, null, 2)}
                  </pre>
                  <Button variant="outline" size="sm" className="w-full mt-2" disabled>
                    Execute Swap (requires wallet signing)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dca" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Dollar-Cost Averaging</CardTitle>
              <CardDescription>Set up recurring buys on Solana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token to DCA</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                  <option value={ANSEM_MINT}>$ANSEM</option>
                  <option value={SOL_MINT}>SOL</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount per buy (USDC)</Label>
                  <Input placeholder="50" />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                    <option>Every hour</option>
                    <option>Every day</option>
                    <option>Every week</option>
                  </select>
                </div>
              </div>
              <Button variant="ansem" className="w-full" disabled>
                Create DCA Order (requires wallet)
              </Button>
              <p className="text-xs text-zinc-500 text-center">
                DCA orders require MoonPay authenticated wallet
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perps" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Phoenix Perps</CardTitle>
              <CardDescription>Trade perpetual futures on Phoenix DEX</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Market</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
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
                    <Button variant="outline" size="sm" className="flex-1 border-green-700 text-green-400">Long</Button>
                    <Button variant="outline" size="sm" className="flex-1 border-red-700 text-red-400">Short</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Size (SOL)</Label>
                  <Input placeholder="1.0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Leverage</Label>
                  <Input placeholder="5x" />
                </div>
                <div className="space-y-2">
                  <Label>Margin (USDC)</Label>
                  <Input placeholder="100" />
                </div>
              </div>
              <Button variant="ansem" className="w-full" disabled>
                Preview Position (requires wallet)
              </Button>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="warning">High Risk</Badge>
                <span className="text-xs text-zinc-500">Perps can result in total loss of margin</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bridge" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Chain Bridge</CardTitle>
              <CardDescription>Bridge assets across chains via MoonPay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Chain</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                    <option>Solana</option>
                    <option>Ethereum</option>
                    <option>Base</option>
                    <option>Arbitrum</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>To Chain</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                    <option>Ethereum</option>
                    <option>Solana</option>
                    <option>Base</option>
                    <option>Arbitrum</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Token</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                  <option>USDC</option>
                  <option>SOL</option>
                  <option>ETH</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input placeholder="100" />
              </div>
              <Button variant="ansem" className="w-full" disabled>
                Get Bridge Quote (requires MoonPay auth)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
