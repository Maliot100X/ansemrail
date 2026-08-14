"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Wallet as WalletIcon } from "lucide-react";

export default function WalletPage() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function checkBalance(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const res = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setBalance(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copy(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Wallet</h1>
        <p className="text-sm text-zinc-400">Check SOL, EVM, and token balances for any address</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-amber-500" /> Balance Checker
          </CardTitle>
          <CardDescription>Enter a Solana or EVM address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={checkBalance} className="space-y-3">
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Solana address or 0x EVM address"
                className="font-mono"
                required
              />
            </div>
            <Button variant="ansem" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check Balance"}
            </Button>
          </form>

          {error && (
            <div className="rounded-md border border-red-800 bg-red-950/30 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {balance && (
            <div className="space-y-3">
              <div className="rounded-md border border-green-800 bg-green-950/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Chain: {balance.chain}</p>
                    <p className="font-mono text-sm text-zinc-300 break-all">{balance.address}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copy(balance.address)}>
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {balance.chain === "solana" ? (
                    <>
                      <div>
                        <p className="text-xs text-zinc-500">SOL Balance</p>
                        <p className="text-lg font-bold text-amber-400">{balance.solBalance?.toFixed(4)} SOL</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Tokens</p>
                        <p className="text-lg font-bold text-zinc-200">{balance.tokens?.length || 0}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-zinc-500">ETH Balance</p>
                        <p className="text-lg font-bold text-amber-400">{balance.ethBalance?.toFixed(4)} ETH</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Tokens</p>
                        <p className="text-lg font-bold text-zinc-200">{balance.tokens?.length || 0}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {balance.tokens && balance.tokens.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">Token Holdings</p>
                  {balance.tokens.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                      <span className="text-xs font-mono text-zinc-400">{t.mint?.slice(0, 8)}...{t.mint?.slice(-6)}</span>
                      <Badge variant="secondary">{t.amount?.toFixed ? t.amount.toFixed(4) : t.amount}</Badge>
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
