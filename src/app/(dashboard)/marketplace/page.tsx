import { getTokens } from "@/lib/clawpump";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatUsd, shortAddress } from "@/lib/utils";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  let tokens: any[] = [];
  let error: string | null = null;

  try {
    tokens = await getTokens("hot", 50, 0);
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Marketplace</h1>
        <p className="text-sm text-zinc-400">Browse ClawPump tokens — hot, new, and trending on Solana</p>
      </div>

      {error && (
        <Card className="border-red-800 bg-red-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {tokens.length === 0 && !error ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Flame className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">No tokens found in marketplace.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tokens.slice(0, 8).map((token) => (
              <Card key={token.mintAddress} className="overflow-hidden">
                {token.imageUrl && (
                  <div className="aspect-square w-full overflow-hidden bg-zinc-800">
                    <img
                      src={token.imageUrl}
                      alt={token.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-100">${token.symbol}</p>
                      <p className="text-xs text-zinc-500">{token.name}</p>
                    </div>
                    {token.isGraduated && <Badge variant="success">Graduated</Badge>}
                    {token.verified && <Badge variant="ansem">Verified</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-500">Market Cap</p>
                      <p className="text-zinc-200">{formatUsd(token.marketCap)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Liquidity</p>
                      <p className="text-zinc-200">{formatUsd(token.liquidity)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Vol 24h</p>
                      <p className="text-zinc-200">{formatUsd(token.volume24h)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Price</p>
                      <p className="text-zinc-200">${token.price?.toFixed(8)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                      Agent: <span className="text-zinc-300">{token.agentName}</span>
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">{shortAddress(token.mintAddress)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Market Cap</TableHead>
                    <TableHead>Volume 24h</TableHead>
                    <TableHead>Liquidity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.mintAddress}>
                      <TableCell className="font-bold text-amber-400">${token.symbol}</TableCell>
                      <TableCell className="text-zinc-300">{token.name}</TableCell>
                      <TableCell className="text-zinc-400">{formatUsd(token.marketCap)}</TableCell>
                      <TableCell className="text-zinc-400">{formatUsd(token.volume24h)}</TableCell>
                      <TableCell className="text-zinc-400">{formatUsd(token.liquidity)}</TableCell>
                      <TableCell>
                        {token.isGraduated ? (
                          <Badge variant="success">Graduated</Badge>
                        ) : (
                          <Badge variant="warning">Bonding</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
