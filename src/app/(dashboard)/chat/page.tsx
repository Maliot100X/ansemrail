"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Send, Bot } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  model: string;
  status: string;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (res.ok && data.agents?.length) {
        setAgents(data.agents);
        setAgentId(data.agents[0].id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !agentId) return;
    const msg = input;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, message: msg }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "agent", content: data.response || data.message || "..." }]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "agent", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
          <Bot className="h-6 w-6 text-amber-500" /> Agent Chat
        </h1>
        <p className="text-sm text-zinc-400">Chat with your ClawPump agents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Agent</CardTitle>
          <CardDescription>
            {agents.length === 0 ? "No agents found. Create one in the Agents tab first." : `${agents.length} agents available`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length > 0 && (
            <div className="space-y-2">
              <Label>Agent</Label>
              <select
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model})
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 mb-4">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-16">Send a message to start chatting</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              </div>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading || !agentId}
            />
            <Button type="submit" variant="ansem" disabled={loading || !agentId || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
