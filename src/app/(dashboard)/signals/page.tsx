import { getTrendingTokens, getAnsemTokenInfo } from "@/lib/moonpay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd, shortAddress } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  let trending: any[] = [];
  let ansem: any = null;
  let error: string | null = null;

  try {
    const [t, a] = await Promise.all([
      getTrendingTokens("solana", 20, 1),
      getAnsemTokenInfo(),
    ]);
    trending = t;
    ansem = a;
  } catch (err: any) {
    error = err.message;
  }

  const ansemChange = ansem?.marketData?.priceChangePercent?.["24h"] ?? 0;
  const ansemChange6h = ansem?.marketData?.priceChangePercent?.["6h"] ?? 0;
  const ansemChange1h = ansem?.marketData?.priceChangePercent?.["1h"] ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Signals</h1>
        <p className="text-sm text-zinc-400">Live trending tokens and $ANSEM price action on Solana</p>
      </div>

      {error && (
        <Card className="border-red-800 bg-red-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {ansem && (
        <Card className="border-amber-800/50 bg-gradient-to-r from-amber-950/20 to-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🐂</span> $ANSEM Signal
              <Badge variant={ansemChange >= 0 ? "success" : "destructive"}>
                {ansemChange >= 0 ? "BULLISH" : "BEARISH"}
              </Badge>
            </CardTitle>
            <CardDescription>The Black Bull — 65% of supply sent to Ansem&apos;s wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div>
                <p className="text-xs text-zinc-500">Price</p>
                <p className="text-xl font-bold text-amber-400">${ansem.marketData?.price?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">1h Change</p>
                <p className={`text-lg font-bold ${ansemChange1h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {ansemChange1h >= 0 ? "+" : ""}{(ansemChange1h * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">6h Change</p>
                <p className={`text-lg font-bold ${ansemChange6h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {ansemChange6h >= 0 ? "+" : ""}{(ansemChange6h * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">24h Change</p>
                <p className={`text-lg font-bold ${ansemChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {ansemChange >= 0 ? "+" : ""}{(ansemChange * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Market Cap</p>
                <p className="text-lg font-bold text-zinc-200">{formatUsd(ansem.marketData?.marketCap)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-zinc-900/50 p-3">
              <p className="text-xs text-zinc-500 mb-1">Mint Address</p>
              <code className="text-sm text-amber-400">{ansem.address}</code>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trending Tokens on Solana</CardTitle>
          <CardDescription>Top trending tokens from MoonPay market data</CardDescription>
        </CardHeader>
        <CardContent>
          {trending.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No trending data available.</p>
          ) : (
            <div className="space-y-3">
              {trending.map((token, i) => {
                const change = token.marketData?.priceChangePercent?.["24h"] ?? 0;
                const vol = token.marketData?.volume?.["24h"] ?? 0;
                return (
                  <div
                    key={token.address}
                    className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <span className="text-lg font-bold text-zinc-600 w-8">#{i + 1}</span>
                    {token.image && (
                      <img src={token.image} alt={token.symbol} className="h-10 w-10 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-100">${token.symbol}</p>
                      <p className="text-xs text-zinc-500 truncate">{token.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-zinc-200">
                        ${token.marketData?.price?.toFixed(8)}
                      </p>
                      <p className="text-xs text-zinc-500">{formatUsd(vol)} vol</p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="text-sm font-bold">
                          {change >= 0 ? "+" : ""}{(change * 100).toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{shortAddress(token.address)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
