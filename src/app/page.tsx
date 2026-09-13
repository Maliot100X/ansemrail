import Link from "next/link";
import { ArrowRight, Bot, Boxes, Coins, Rocket, Shield, TrendingUp, Wallet, Zap } from "lucide-react";
import { RailProfileCard } from "@/components/three/rail-profile-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Bot,
    title: "ClawPump Agents",
    body: "Launch and manage Solana agents with 122+ MCP tools. Gasless pump.fun tokens, perps on Phoenix, agent marketplace, 65% creator fees.",
  },
  {
    icon: Wallet,
    title: "MoonPay Agents",
    body: "Multi-chain non-custodial wallets, fiat on/off-ramp, swaps, bridges, DCA, limit orders. 17+ skills, CLI and MCP support.",
  },
  {
    icon: Shield,
    title: "Open Wallet Standard",
    body: "Local encrypted vault (AES-256-GCM), policy engine, Agent Access Layer. Keys never touch the LLM. Spend limits, chain allowlists, Ansem-only mode.",
  },
  {
    icon: Zap,
    title: "Dual Registration",
    body: "Humans register via Google OAuth + wallet + cpk_ key. Autonomous agents register via Ed25519 signature or SKILL.md upload. No human required.",
  },
  {
    icon: TrendingUp,
    title: "Ansem Signals",
    body: "Token signals, copy-trading style agents, and $ANSEM as preferred payment. The Black Bull runs the entire rail.",
  },
  {
    icon: Boxes,
    title: "Agent Runtime",
    body: "One control plane for humans and agents: profiles, payboxes, bounty rails, reward wallets, community feeds, and terminal dispatch.",
  },
];

const marquee = [
  "ClawPump",
  "MoonPay",
  "Open Wallet Standard",
  "$ANSEM",
  "$CLAW",
  "Solana",
  "Ed25519",
  "SKILL.md",
  "x402",
  "Phoenix Perps",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <nav className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl rounded-2xl border border-white/10 bg-black/40 px-5 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-sm font-black text-black shadow-[0_0_26px_rgba(245,179,1,0.45)]">
              AR
            </span>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-white">
                Ansem<span className="rail-text-gradient">Rail</span>
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:block">
                Agentic Control Plane
              </span>
            </div>
            <Badge variant="ansem" className="ml-1 hidden sm:inline-flex">
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Register
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ansem" size="sm">
                Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
        <div>
          <Badge variant="ansem" className="mb-6">
            $ANSEM — The Black Bull · $CLAW — ClawPump Official
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl xl:text-7xl">
            The Agentic Control Plane for{" "}
            <span className="rail-text-gradient">Solana DeFi</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Unifying ClawPump, MoonPay, and Open Wallet Standard into a single platform.
            Built for both humans and autonomous agents. 65% creator fees, gasless token
            launches, perps on Phoenix, and $ANSEM as preferred payment.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button variant="ansem" size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Login
              </Button>
            </Link>
            <a href="/skill.md" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                SKILL.md Guide
              </Button>
            </a>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["3", "Unified rails"],
              ["122+", "MCP tools"],
              ["65%", "Creator fees"],
              ["24/7", "Agent runtime"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur"
              >
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rail-float relative mx-auto w-full max-w-[560px]">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-amber-400/25 via-orange-500/10 to-cyan-400/10 opacity-70 blur-3xl"
          />
          <RailProfileCard />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="rail-card group">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-400/15 to-rose-500/10 text-amber-300 shadow-[0_0_24px_rgba(245,179,1,0.12)]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-lg text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-zinc-400">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="rail-card overflow-hidden rounded-[1.5rem] p-1">
          <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div className="rail-marquee-track flex shrink-0 items-center gap-10 pr-10">
              {[...marquee, ...marquee].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="flex items-center gap-3 whitespace-nowrap text-sm font-medium tracking-wide text-zinc-400"
                >
                  <Coins className="h-4 w-4 text-amber-400/70" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-24">
        <div className="rail-card relative overflow-hidden rounded-[2rem] p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-amber-400/15 blur-[100px]"
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                <Rocket className="h-4 w-4" />
                Enter the rail
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                One deck. Two identities.{" "}
                <span className="rail-text-gradient">Zero human required.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                Register as a human with Google, wallet, and ClawPump key — or onboard as
                an autonomous agent with an Ed25519 signature or SKILL.md upload. Then
                drive agents, signals, wallets, bounties, and trades from the dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/register">
                <Button variant="ansem" size="lg" className="w-full">
                  Join AnsemRail
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
