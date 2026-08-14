"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { shortAddress, timeAgo } from "@/lib/utils";
import { Plus, Send, Loader2, Bot, Trash2, Copy, Check } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  walletAddress: string;
  skills: string[];
  model: string;
  persona: string;
  createdAt: string;
}

const MODELS = [
  "moonshotai/kimi-k2.5",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "meta-llama/llama-3.3-70b",
  "deepseek/deepseek-chat",
];

const AVAILABLE_SKILLS = [
  "trading",
  "perps",
  "token-launch",
  "portfolio",
  "market-intelligence",
  "social",
  "sniper",
  "wallet",
  "image-generation",
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatQuota, setChatQuota] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    persona: "A skilled Solana DeFi trading agent.",
    model: MODELS[0],
    skills: ["trading", "perps"],
  });

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (res.ok) {
        setAgents(data.agents || []);
      } else {
        setError(data.error || "Failed to fetch agents");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      setCreateOpen(false);
      setForm({ name: "", persona: "A skilled Solana DeFi trading agent.", model: MODELS[0], skills: ["trading", "perps"] });
      fetchAgents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(agentId: string) {
    try {
      await fetch(`/api/agents?id=${agentId}`, { method: "DELETE" });
      fetchAgents();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function copyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openChat(agent: Agent) {
    setChatAgent(agent);
    setChatMessages([]);
    setChatQuota(null);
    fetch("/api/agents/quota")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) {
          setChatQuota("Using your own ClawPump key — chat is billed against your key, not the shared free pool.");
        } else if (data.message) {
          setChatQuota(data.message);
        }
      })
      .catch(() => setChatQuota(null));
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !chatAgent) return;
    setChatLoading(true);
    setChatMessages((prev) => [...prev, { role: "user", content: chatInput }]);
    const msg = chatInput;
    setChatInput("");
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: chatAgent.id, message: msg }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages((prev) => [...prev, { role: "agent", content: data.content || data.response || data.message || "..." }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "agent", content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "agent", content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  function toggleSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Agents</h1>
          <p className="text-sm text-zinc-400">Create, manage, and chat with your ClawPump agents</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ansem" size="sm">
              <Plus className="h-4 w-4" /> Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>Deploy a new ClawPump agent with custom skills and model</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Trading Agent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="persona">Persona</Label>
                <Input id="persona" value={form.persona} onChange={(e) => setForm({ ...form, persona: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <select
                  id="model"
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                >
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.skills.includes(skill)
                          ? "bg-amber-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" variant="ansem" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Agent"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-red-800 bg-red-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bot className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">No agents yet. Create your first agent to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <Badge variant={agent.status === "running" ? "success" : "secondary"}>
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{agent.model}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Agent ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-zinc-300 break-all">{agent.id}</p>
                    <button
                      type="button"
                      onClick={() => copyId(agent.id)}
                      className="text-zinc-500 hover:text-amber-400 transition-colors"
                      title="Copy agent ID"
                    >
                      {copiedId === agent.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Wallet</p>
                  <p className="text-sm font-mono text-zinc-300">{shortAddress(agent.walletAddress)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Skills ({agent.skills?.length || 0})</p>
                  <div className="flex flex-wrap gap-1">
                    {(agent.skills || []).slice(0, 5).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-500">Created {timeAgo(agent.createdAt)}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openChat(agent)}
                  >
                    <Send className="h-3 w-3" /> Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(agent.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!chatAgent} onOpenChange={(open) => !open && setChatAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat with {chatAgent?.name}</DialogTitle>
            <DialogDescription>{chatAgent?.model}</DialogDescription>
          </DialogHeader>
          {chatQuota && (
            <p className="text-xs text-zinc-400 rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2">
              {chatQuota}
            </p>
          )}
          <div className="h-80 overflow-y-auto space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            {chatMessages.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">Send a message to start chatting with your agent</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleChat} className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message..."
              disabled={chatLoading}
            />
            <Button type="submit" variant="ansem" size="icon" disabled={chatLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
