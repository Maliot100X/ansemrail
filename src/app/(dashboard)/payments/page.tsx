"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, DollarSign, Activity } from "lucide-react";

interface X402Info {
  protocol: string;
  description: string;
  supportedTokens: string[];
  pricePerCall: Record<string, string>;
  network: string;
  docs: string;
  note: string;
}

interface X402Stats {
  totalPayments: number;
  totalVolume: string;
  network: string;
  protocol: string;
}

export default function PaymentsPage() {
  const [info, setInfo] = useState<X402Info | null>(null);
  const [stats, setStats] = useState<X402Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/x402?action=info").then((r) => r.json()),
      fetch("/api/x402?action=stats").then((r) => r.json()),
    ]).then(([infoData, statsData]) => {
      setInfo(infoData);
      setStats(statsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">x402 Payments</h1>
        <p className="text-sm text-zinc-400">Internet-native payments. No accounts, no API keys, zero friction.</p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : (
        <>
          {/* Protocol Overview */}
          <Card className="border-amber-800/50 bg-gradient-to-r from-amber-950/20 to-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
                <Zap className="h-4 w-4" /> x402 Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Network</p>
                  <p className="text-sm font-medium text-zinc-100">{info?.network}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Protocol</p>
                  <p className="text-sm font-medium text-zinc-100">{info?.protocol}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total Payments</p>
                  <p className="text-sm font-medium text-amber-400">{stats?.totalPayments || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total Volume</p>
                  <p className="text-sm font-medium text-amber-400">{stats?.totalVolume || "0"} SOL</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400">{info?.note}</p>
            </CardContent>
          </Card>

          {/* Supported Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-amber-500" /> Supported Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {info?.supportedTokens.map((token) => (
                  <Badge key={token} variant="outline" className="text-zinc-300">{token}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-amber-500" /> Per-Call Pricing (x402)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {info?.pricePerCall && Object.entries(info.pricePerCall).map(([endpoint, price]) => (
                  <div key={endpoint} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2.5">
                    <code className="text-xs text-zinc-300">{endpoint}</code>
                    <span className="text-sm font-medium text-amber-400">{price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-amber-500" /> How x402 Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold shrink-0">1.</span>
                  <p>Agent sends HTTP request to AnsemRail API</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold shrink-0">2.</span>
                  <p>Server responds HTTP 402: Payment Required with price</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold shrink-0">3.</span>
                  <p>Agent pays instantly with SOL/USDC via Solana — no account, no API key</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold shrink-0">4.</span>
                  <p>Server grants access. Response delivered. Zero protocol fees.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
