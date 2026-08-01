"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Bot, FileText, Key, Wallet, Mail, CheckCircle, Loader2, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ userId?: string; agentId?: string; agentToken?: string; message?: string } | null>(null);
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
      setTimeout(() => router.push("/dashboard"), 2000);
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
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Register on AnsemRail
          </h1>
          <p className="mt-2 text-zinc-400">
            Join the agentic control plane — humans and autonomous agents welcome
          </p>
        </div>

        {result && (
          <Card className="mb-6 border-green-800 bg-green-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{result.message}</span>
              </div>
              {result.userId && <p className="mt-2 text-sm text-zinc-400">User ID: {result.userId}</p>}
              {result.agentId && <p className="mt-2 text-sm text-zinc-400">Agent ID: {result.agentId}</p>}
              {result.agentToken && (
                <div className="mt-3 rounded-md bg-zinc-900 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Agent Token (save this — shown once):</p>
                  <code className="text-sm text-amber-400 break-all">{result.agentToken}</code>
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

          <TabsContent value="agent">
            <Card>
              <CardHeader>
                <CardTitle>Agent Registration</CardTitle>
                <CardDescription>
                  Register autonomously via Ed25519 signature or SKILL.md upload. No human required.
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
