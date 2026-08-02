import { listAgents } from "@/lib/clawpump";
import { getAnsemTokenInfo, getClawTokenInfo, getTrendingTokens } from "@/lib/moonpay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatUsd, shortAddress } from "@/lib/utils";
import { Bot, TrendingUp, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const results = await Promise.allSettled([
    listAgents(),
    getAnsemTokenInfo(),
    getClawTokenInfo(),
    getTrendingTokens("solana", 10, 1),
  ]);

  return {
    agents: results[0].status === "fulfilled" ? results[0].value : [],
    ansem: results[1].status === "fulfilled" ? results[1].value : null,
    claw: results[2].status === "fulfilled" ? results[2].value : null,
    trending: results[3].status === "fulfilled" ? results[3].value : [],
  };
}

export default async function DashboardPage() {
  const { agents, ansem, claw, trending } = await getDashboardData();

  const ansemPrice = ansem?.marketData?.price ?? 0;
  const ansemMcap = ansem?.marketData?.marketCap ?? 0;
  const ansemLiq = ansem?.marketData?.liquidity ?? 0;

  const clawPrice = claw?.marketData?.price ?? 0;
  const clawMcap = claw?.marketData?.marketCap ?? 0;
  const clawLiq = claw?.marketData?.liquidity ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">Your agents, balances, and Ansem signals at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{agents.length}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {agents.filter((a) => a.status === "running").length} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">$ANSEM Price</CardTitle>
            <Coins className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">${ansemPrice.toFixed(6)}</div>
            <p className="text-xs text-zinc-500 mt-1">MCap: {formatUsd(ansemMcap)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">$CLAW Price</CardTitle>
            <Coins className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">${clawPrice.toFixed(6)}</div>
            <p className="text-xs text-zinc-500 mt-1">MCap: {formatUsd(clawMcap)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Trending Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-50">{trending.length}</div>
            <p className="text-xs text-zinc-500 mt-1">On Solana now</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                No agents yet. Create one at the Agents page.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Wallet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.slice(0, 10).map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium text-zinc-200">{agent.name}</TableCell>
                      <TableCell>
                        <Badge variant={agent.status === "running" ? "success" : "secondary"}>
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">{agent.model}</TableCell>
                      <TableCell className="text-zinc-400 text-xs font-mono">
                        {agent.walletAddress ? shortAddress(agent.walletAddress) : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending on Solana</CardTitle>
          </CardHeader>
          <CardContent>
            {trending.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">No trending data available.</p>
            ) : (
              <div className="space-y-3">
                {trending.slice(0, 6).map((token) => {
                  const change = token.marketData?.priceChangePercent?.["24h"] ?? 0;
                  return (
                    <div
                      key={token.address}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        {token.image && (
                          <img
                            src={token.image}
                            alt={token.symbol}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-200">${token.symbol}</p>
                          <p className="text-xs text-zinc-500">{formatUsd(token.marketData?.marketCap ?? 0)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-zinc-200">
                          ${token.marketData?.price?.toFixed(8)}
                        </p>
                        <p className={`text-xs ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {change >= 0 ? "+" : ""}{(change * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {ansem && (
        <Card className="border-amber-800/50 bg-gradient-to-r from-amber-950/20 to-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🐂</span> $ANSEM — The Black Bull
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-zinc-500">Price</p>
                <p className="text-lg font-bold text-amber-400">${ansemPrice.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Market Cap</p>
                <p className="text-lg font-bold text-zinc-200">{formatUsd(ansemMcap)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Liquidity</p>
                <p className="text-lg font-bold text-zinc-200">{formatUsd(ansemLiq)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Mint</p>
                <p className="text-sm font-mono text-zinc-400">{shortAddress(ansem.address)}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              65% of supply sent to Ansem&apos;s wallet. All fees redirected to him. $ANSEM is preferred payment for inference.
            </p>
          </CardContent>
        </Card>
      )}

      {claw && (
        <Card className="border-blue-800/50 bg-gradient-to-r from-blue-950/20 to-cyan-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🐾</span> $CLAW — ClawPump Official Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-zinc-500">Price</p>
                <p className="text-lg font-bold text-blue-400">${clawPrice.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Market Cap</p>
                <p className="text-lg font-bold text-zinc-200">{formatUsd(clawMcap)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Liquidity</p>
                <p className="text-lg font-bold text-zinc-200">{formatUsd(clawLiq)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Mint</p>
                <p className="text-sm font-mono text-zinc-400">{shortAddress(claw.address)}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              The official ClawPump token. Beware of impersonator sites and tokens. Mint:{" "}
              <code className="text-blue-400">739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump</code>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
