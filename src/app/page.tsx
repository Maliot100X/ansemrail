import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Wallet, Zap, Shield, TrendingUp, Coins } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black">
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              AnsemRail
            </span>
            <Badge variant="ansem">Beta</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/register">
              <Button variant="ghost" size="sm">Register</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ansem" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <Badge variant="ansem" className="mb-6 text-base">
          $ANSEM — The Black Bull
        </Badge>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-zinc-50 sm:text-7xl">
          The Agentic Control Plane for{" "}
          <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Solana DeFi
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Unifying ClawPump, MoonPay, and Open Wallet Standard into a single platform.
          Built for both humans and autonomous agents. 65% creator fees, gasless token
          launches, perps on Phoenix, and $ANSEM as preferred payment.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button variant="ansem" size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Bot className="h-8 w-8 text-amber-500" />
              <CardTitle className="mt-2">ClawPump Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Launch and manage Solana agents with 122+ MCP tools. Gasless pump.fun
                tokens, perps on Phoenix, agent marketplace, 65% creator fees.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Wallet className="h-8 w-8 text-amber-500" />
              <CardTitle className="mt-2">MoonPay Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Multi-chain non-custodial wallets, fiat on/off-ramp, swaps, bridges, DCA,
                limit orders. 17+ skills, CLI and MCP support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-amber-500" />
              <CardTitle className="mt-2">Open Wallet Standard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Local encrypted vault (AES-256-GCM), policy engine, Agent Access Layer.
                Keys never touch the LLM. Spend limits, chain allowlists, Ansem-only mode.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-amber-500" />
              <CardTitle className="mt-2">Dual Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Humans register via Google OAuth + wallet + cpk_ key. Autonomous agents
                register via Ed25519 signature or SKILL.md upload. No human required.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-amber-500" />
              <CardTitle className="mt-2">Trading Terminal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Swap, DCA, bridge, and trade perps. Simulate-first pattern — see quotes
                before executing. Phoenix perps, MoonPay multi-chain swaps.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Coins className="h-8 w-8 text-amber-500" />
              <CardTitle className="mt-2">$ANSEM Utility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                $ANSEM (The Black Bull) token at{" "}
                <code className="text-xs text-amber-400">9cRCn9...pump</code>. Signals,
                copy-trading agents, $ANSEM as preferred payment for inference.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-zinc-500">
          AnsemRail — Built with Next.js 16, Drizzle ORM, Neon PostgreSQL, NextAuth.
          MIT License.
        </div>
      </footer>
    </div>
  );
}
