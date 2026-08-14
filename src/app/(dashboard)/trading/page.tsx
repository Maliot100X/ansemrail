"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ANSEM_MINT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
const CLAW_MINT = "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump";

const TOKENS = [
  { label: "SOL", mint: SOL_MINT },
  { label: "USDC", mint: USDC_MINT },
  { label: "$ANSEM", mint: ANSEM_MINT },
  { label: "$CLAW", mint: CLAW_MINT },
];

export default function TradingPage() {
  const [inputMint, setInputMint] = useState(SOL_MINT);
  const [outputMint, setOutputMint] = useState(USDC_MINT);
  const [amount, setAmount] = useState("100000000");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getQuote() {
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputMint, outputMint, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quote failed");
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Trading Terminal</h1>
        <p className="text-sm text-zinc-400">Real Jupiter swap quotes — SOL, USDC, $ANSEM, $CLAW</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Swap</CardTitle>
          <CardDescription>Get a live quote, then execute from your connected wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <select
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                value={inputMint}
                onChange={(e) => setInputMint(e.target.value)}
              >
                {TOKENS.map((t) => (
                  <option key={t.mint} value={t.mint}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <select
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                value={outputMint}
                onChange={(e) => setOutputMint(e.target.value)}
              >
                {TOKENS.map((t) => (
                  <option key={t.mint} value={t.mint}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Amount (raw units)</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100000000 = 0.1 SOL"
              className="font-mono"
            />
          </div>
          <Button variant="ansem" onClick={getQuote} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Get Quote</>}
          </Button>

          {error && (
            <div className="rounded-md border border-red-800 bg-red-950/30 p-3">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            </div>
          )}

          {quote && (
            <div className="rounded-md border border-green-800 bg-green-950/30 p-4 space-y-2">
              <p className="text-sm font-medium text-green-400">Quote Ready</p>
              <p className="text-sm text-zinc-300">
                {quote.input?.amount} {quote.input?.token} → {quote.output?.amount} {quote.output?.token}
              </p>
              <p className="text-xs text-zinc-500">
                Route: {(quote.route || []).join(" → ") || "N/A"} | Slippage: {quote.slippageBps / 100}% | Impact: {quote.priceImpactPct}%
              </p>
              <Badge variant="success">Venue: {quote.venue}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
