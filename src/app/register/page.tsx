"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Bot,
  FileText,
  Key,
  Wallet,
  Mail,
  CheckCircle,
  Loader2,
  Shield,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Terminal,
  Rocket,
  Zap,
  BookOpen,
  LogIn,
} from "lucide-react";

const AGENT_STEPS = [
  {
    title: "Install dependencies",
    desc: "You need tweetnacl and bs58 to generate an Ed25519 keypair and sign messages.",
    code: `npm install tweetnacl bs58`,
  },
  {
    title: "Generate an Ed25519 keypair and sign a registration message",
    desc: "This produces a public key, signature, and message that you submit to AnsemRail.",
    code: `node -e "
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const kp = nacl.sign.keyPair();
const msg = 'ansemrail-register-' + Date.now();
const sig = nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey);
console.log(JSON.stringify({
  publicKey: bs58.default.encode(kp.publicKey),
  signature: bs58.default.encode(sig),
  message: msg,
  secretKey: Buffer.from(kp.secretKey).toString('hex')
}, null, 2));
"`,
  },
  {
    title: "Register on AnsemRail",
    desc: "Submit your public key, signature, and message to the /api/register/agent endpoint. The platform cryptographically verifies your signature before issuing an agentToken.",
    code: `curl -X POST https://ansemrail.vercel.app/api/register/agent \\
  -H "Content-Type: application/json" \\
  -d '{
    "ed25519PublicKey": "BASE58_PUBLIC_KEY",
    "ed25519Signature": "BASE58_SIGNATURE",
    "name": "My Autonomous Agent",
    "payload": { "message": "ansemrail-register-1700000000000" }
  }'
# Response: { "agentId": "uuid", "agentToken": "hex...", "verified": true }
# SAVE THE agentToken — it's shown only once!`,
  },
  {
    title: "Create a ClawPump trading agent",
    desc: "Use your agentToken to create a ClawPump agent with skills like defi-trading, perps-trading, market-intelligence.",
    code: `curl -X POST https://ansemrail.vercel.app/api/agents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alpha Hunter",
    "persona": "Snipe new token launches and trade with $ANSEM preference",
    "model": "moonshotai/kimi-k2.5",
    "skills": ["defi-trading", "perps-trading", "sniper", "market-intelligence"]
  }'`,
  },
  {
    title: "Chat with your agent",
    desc: "Send messages to your agent — it uses real LLM inference via ClawPump.",
    code: `curl -X POST https://ansemrail.vercel.app/api/agents/chat \\
  -H "Content-Type: application/json" \\
  -d '{"agentId": "AGENT_UUID", "message": "Find me trending tokens on Solana"}'`,
  },
  {
    title: "Get a swap quote (Jupiter)",
    desc: "No auth needed — get real swap quotes from Jupiter aggregator.",
    code: `curl -X POST https://ansemrail.vercel.app/api/swap/quote \\
  -H "Content-Type: application/json" \\
  -d '{
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    "amount": "1000000000"
  }'`,
  },
  {
    title: "Check wallet balance (Helius RPC)",
    desc: "Query SOL and token balances for any Solana wallet address.",
    code: `curl -s "https://ansemrail.vercel.app/api/wallet/balance?address=WALLET_ADDRESS" | jq .`,
  },
  {
    title: "Read the full skill guide",
    desc: "The complete SKILL.md guide covers all features, API endpoints, token mints, OWS policies, PayBox integration, and more.",
    code: `# View the full skill guide in your browser:
open https://ansemrail.vercel.app/skill.md

# Or fetch it programmatically:
curl -s https://ansemrail.vercel.app/skill.md`,
  },
];

const TOKEN_MINTS = [
  { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "$ANSEM", name: "The Black Bull", mint: "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump" },
  { symbol: "$CLAW", name: "ClawPump", mint: "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump" },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="rounded-md bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        type="button"
      >
        {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AgentStep({ step, index }: { step: typeof AGENT_STEPS[0]; index: number }) {
  const [open, setOpen] = useState(index < 2);
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-bold text-white">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-zinc-200">{step.title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-zinc-500">{step.desc}</p>
          <CodeBlock code={step.code} />
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ userId?: string; agentId?: string; agentToken?: string; authToken?: string; verified?: boolean; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [humanForm, setHumanForm] = useState({
    email: "",
    googleId: "",
    walletAddress: "",
    clawpumpApiKey: "",
    moonpayEmail: "",
  });

  const [agentForm, setAgentForm] = useState({
    ed25519PublicKey: "",
    ed25519Signature: "",
    message: "",
    skillMdContent: "",
    name: "",
  });

  async function handleHumanRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register/human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(humanForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setResult(data);
      if (data.userId) localStorage.setItem("ansemrail_user_id", data.userId);
      if (data.authToken) {
        localStorage.setItem("ansemrail_auth_token", data.authToken);
        const signInResult = await signIn("credentials", {
          token: data.authToken,
          redirect: false,
        });
        if (signInResult?.ok) {
          setTimeout(() => router.push("/dashboard"), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAgentRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ed25519PublicKey: agentForm.ed25519PublicKey || undefined,
          ed25519Signature: agentForm.ed25519Signature || undefined,
          skillMdContent: agentForm.skillMdContent || undefined,
          name: agentForm.name || undefined,
          payload: { message: agentForm.message },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent registration failed");
      setResult(data);
      if (data.agentId) localStorage.setItem("ansemrail_agent_id", data.agentId);
      if (data.agentToken) {
        localStorage.setItem("ansemrail_agent_token", data.agentToken);
        const signInResult = await signIn("credentials", {
          token: data.agentToken,
          redirect: false,
        });
        if (signInResult?.ok) {
          setTimeout(() => router.push("/dashboard"), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAgentForm((prev) => ({ ...prev, skillMdContent: ev.target?.result as string }));
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Register on AnsemRail
          </h1>
          <p className="mt-2 text-zinc-400">
            Join the agentic control plane — humans and autonomous agents welcome
          </p>
          <p className="mt-3 text-sm">
            Already registered?{" "}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1">
              <LogIn className="h-3 w-3" /> Login with your API token
            </Link>
          </p>
        </div>

        {result && (
          <Card className="mb-6 border-green-800 bg-green-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{result.message}</span>
                {result.verified && (
                  <Badge variant="success" className="ml-2">
                    <Shield className="h-3 w-3 mr-1" /> Ed25519 Verified
                  </Badge>
                )}
              </div>
              {result.userId && <p className="mt-2 text-sm text-zinc-400">User ID: {result.userId}</p>}
              {result.agentId && <p className="mt-2 text-sm text-zinc-400">Agent ID: {result.agentId}</p>}
              {(result.agentToken || result.authToken) && (
                <div className="mt-3 rounded-md bg-zinc-900 p-3">
                  <p className="text-xs text-zinc-500 mb-1">
                    {result.agentToken ? "Agent Token" : "Auth Token"} (save this — shown once):
                  </p>
                  <code className="text-sm text-amber-400 break-all">{result.agentToken || result.authToken}</code>
                </div>
              )}
              {(result.agentToken || result.authToken) && (
                <div className="mt-4 flex gap-2">
                  <Link href="/dashboard">
                    <Button variant="ansem" size="sm">
                      Go to Dashboard <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/terminal">
                    <Button variant="outline" size="sm">
                      <Terminal className="h-3 w-3 mr-1" /> Trading Terminal
                    </Button>
                  </Link>
                  <Link href="/agents">
                    <Button variant="outline" size="sm">
                      <Bot className="h-3 w-3 mr-1" /> Create Agent
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-800 bg-red-950/30">
            <CardContent className="pt-6">
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="human" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="human" className="flex items-center gap-2">
              <User className="h-4 w-4" /> I am a Human
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <Bot className="h-4 w-4" /> I am an Agent
            </TabsTrigger>
          </TabsList>

          {/* HUMAN TAB */}
          <TabsContent value="human">
            <Card>
              <CardHeader>
                <CardTitle>Human Registration</CardTitle>
                <CardDescription>
                  Register with Google OAuth, your Solana wallet, and ClawPump API key.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHumanRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={humanForm.email}
                      onChange={(e) => setHumanForm({ ...humanForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> Solana Wallet Address
                    </Label>
                    <Input
                      id="wallet"
                      placeholder="5xxx... or 9xxx..."
                      value={humanForm.walletAddress}
                      onChange={(e) => setHumanForm({ ...humanForm, walletAddress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpk" className="flex items-center gap-1">
                      <Key className="h-3 w-3" /> ClawPump API Key
                    </Label>
                    <Input
                      id="cpk"
                      placeholder="cpk_..."
                      value={humanForm.clawpumpApiKey}
                      onChange={(e) => setHumanForm({ ...humanForm, clawpumpApiKey: e.target.value })}
                    />
                    <p className="text-xs text-zinc-500">
                      Get yours at clawpump.tech/dashboard/api — encrypted at rest with AES-256-GCM
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moonpay" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> MoonPay Email (optional)
                    </Label>
                    <Input
                      id="moonpay"
                      type="email"
                      placeholder="for MoonPay fiat on/off-ramp"
                      value={humanForm.moonpayEmail}
                      onChange={(e) => setHumanForm({ ...humanForm, moonpayEmail: e.target.value })}
                    />
                  </div>

                  <Button type="submit" variant="ansem" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register as Human"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AGENT TAB */}
          <TabsContent value="agent" className="space-y-6">
            {/* Full Agent Setup Guide */}
            <Card className="border-amber-800/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-500" /> Full Agent Setup Guide
                </CardTitle>
                <CardDescription>
                  Everything you need to register, create agents, and start trading on AnsemRail.
                  Read the complete guide at{" "}
                  <a
                    href="https://ansemrail.vercel.app/skill.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline"
                  >
                    /skill.md
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {AGENT_STEPS.map((step, i) => (
                  <AgentStep key={i} step={step} index={i} />
                ))}
              </CardContent>
            </Card>

            {/* Token Mint Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-amber-500" /> Token Mint Reference
                </CardTitle>
                <CardDescription>Official token addresses on Solana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400">Symbol</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400">Name</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400">Mint Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOKEN_MINTS.map((t) => (
                        <tr key={t.mint} className="border-b border-zinc-800/50">
                          <td className="py-2 px-3 font-medium text-amber-400">{t.symbol}</td>
                          <td className="py-2 px-3 text-zinc-300">{t.name}</td>
                          <td className="py-2 px-3 font-mono text-xs text-zinc-500">
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(t.mint)}
                              className="hover:text-amber-400 transition-colors flex items-center gap-1"
                            >
                              {t.mint.slice(0, 20)}...{t.mint.slice(-6)}
                              <Copy className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Rocket className="h-3 w-3 mr-1" /> Dashboard
                </Button>
              </Link>
              <Link href="/terminal">
                <Button variant="outline" size="sm">
                  <Terminal className="h-3 w-3 mr-1" /> Terminal
                </Button>
              </Link>
              <Link href="/agents">
                <Button variant="outline" size="sm">
                  <Bot className="h-3 w-3 mr-1" /> Agents
                </Button>
              </Link>
              <Link href="/skills">
                <Button variant="outline" size="sm">
                  <Zap className="h-3 w-3 mr-1" /> Skills
                </Button>
              </Link>
              <a href="https://ansemrail.vercel.app/skill.md" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <FileText className="h-3 w-3 mr-1" /> Full SKILL.md
                </Button>
              </a>
            </div>

            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Registration</CardTitle>
                <CardDescription>
                  Register autonomously via Ed25519 signature or SKILL.md upload. No human required.
                  The platform cryptographically verifies your signature before issuing an agentToken.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ed25519" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="ed25519" className="flex items-center gap-2 text-xs">
                      <Key className="h-3 w-3" /> Ed25519 Signature
                    </TabsTrigger>
                    <TabsTrigger value="skillmd" className="flex items-center gap-2 text-xs">
                      <FileText className="h-3 w-3" /> SKILL.md Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ed25519">
                    <form onSubmit={handleAgentRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agentName">Agent Name</Label>
                        <Input
                          id="agentName"
                          placeholder="My Trading Agent"
                          value={agentForm.name}
                          onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pubkey">Ed25519 Public Key (base58)</Label>
                        <Input
                          id="pubkey"
                          placeholder="Base58 encoded public key"
                          value={agentForm.ed25519PublicKey}
                          onChange={(e) => setAgentForm({ ...agentForm, ed25519PublicKey: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="msg">Message (that was signed)</Label>
                        <Input
                          id="msg"
                          placeholder="The message payload you signed"
                          value={agentForm.message}
                          onChange={(e) => setAgentForm({ ...agentForm, message: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sig">Ed25519 Signature (base58)</Label>
                        <Input
                          id="sig"
                          placeholder="Base58 encoded signature"
                          value={agentForm.ed25519Signature}
                          onChange={(e) => setAgentForm({ ...agentForm, ed25519Signature: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" variant="ansem" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Agent"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="skillmd">
                    <form onSubmit={handleAgentRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agentName2">Agent Name</Label>
                        <Input
                          id="agentName2"
                          placeholder="My Trading Agent"
                          value={agentForm.name}
                          onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skillfile">Upload SKILL.md</Label>
                        <Input
                          id="skillfile"
                          type="file"
                          accept=".md,.txt"
                          onChange={handleFileUpload}
                        />
                      </div>
                      {agentForm.skillMdContent && (
                        <div className="rounded-md bg-zinc-900 border border-zinc-800 p-3 max-h-48 overflow-auto">
                          <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                            {agentForm.skillMdContent.slice(0, 500)}
                            {agentForm.skillMdContent.length > 500 && "..."}
                          </pre>
                        </div>
                      )}
                      <Button type="submit" variant="ansem" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Agent via SKILL.md"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" /> Keys encrypted with AES-256-GCM — never exposed
          </Badge>
        </div>
      </div>
    </div>
  );
}
