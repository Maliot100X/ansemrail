import { listAgents, getClawpumpTokens, getAgentPonsLaunches } from "@/lib/clawpump";
import { getAnsemTokenInfo, getClawTokenInfo, getTrendingTokens } from "@/lib/moonpay";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatUsd, shortAddress } from "@/lib/utils";
import { Bot, TrendingUp, Coins, Rocket } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  let userApiKey: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) userApiKey = await getUserClawpumpApiKey(userId);
  } catch {}

  const results = await Promise.allSettled([
    listAgents(userApiKey),
    getAnsemTokenInfo(),
    getClawTokenInfo(),
    getTrendingTokens("solana", 10, 1),
    getClawpumpTokens("hot", 6, 0, userApiKey),
  ]);

  const agents = results[0].status === "fulfilled" ? results[0].value : [];
  const clawpumpTokens = results[4].status === "fulfilled" ? results[4].value : [];

  const ponsResults = await Promise.allSettled(
    agents.slice(0, 5).map((a) => getAgentPonsLaunches(a.id, userApiKey))
  );
  const allPonsLaunches = ponsResults
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  return {
    agents,
    ansem: results[1].status === "fulfilled" ? results[1].value : null,
    claw: results[2].status === "fulfilled" ? results[2].value : null,
    trending: results[3].status === "fulfilled" ? results[3].value : [],
    clawpumpTokens,
    ponsLaunches: allPonsLaunches,
  };
}

export default async function DashboardPage() {
  const { agents, ansem, claw, trending, clawpumpTokens, ponsLaunches } = await getDashboardData();

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

      {ponsLaunches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-amber-500" />
              Gasless PONS Launches (Robinhood Chain)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ponsLaunches.map((launch, i) => (
                  <TableRow key={launch.tokenAddress || i}>
                    <TableCell className="font-medium text-zinc-200">
                      {launch.symbol || launch.name || "--"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={launch.status === "confirmed" || launch.status === "soft_confirmed" ? "success" : "secondary"}>
                        {launch.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs font-mono">
                      {launch.tokenAddress ? (
                        <a href={`https://clawpump.tech/tokens/${launch.tokenAddress}`} target="_blank" rel="noopener noreferrer" className="text-amber-500 underline">
                          {shortAddress(launch.tokenAddress)}
                        </a>
                      ) : "--"}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs font-mono">
                      {launch.txHash ? shortAddress(launch.txHash) : "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {clawpumpTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Hot Tokens on ClawPump
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clawpumpTokens.map((token) => (
                <div key={token.mintAddress} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-center gap-3 mb-2">
                    {token.imageUrl && (
                      <img src={token.imageUrl} alt={token.symbol} className="h-8 w-8 rounded-full" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-200">${token.symbol}</p>
                      <p className="text-xs text-zinc-500">{token.name}</p>
                    </div>
                    {token.isGraduated && <Badge variant="success">Graduated</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">MCap: </span>
                      <span className="text-zinc-300">{formatUsd(token.marketCap)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Price: </span>
                      <span className="text-zinc-300">${token.price?.toFixed(8)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">24h Vol: </span>
                      <span className="text-zinc-300">{formatUsd(token.volume24h)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Liq: </span>
                      <span className="text-zinc-300">{formatUsd(token.liquidity)}</span>
                    </div>
                  </div>
                  <a href={`https://clawpump.tech/tokens/${token.mintAddress}`} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 underline mt-2 inline-block">
                    View on ClawPump →
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
