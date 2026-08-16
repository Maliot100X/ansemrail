"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Star, TrendingUp, CheckCircle, Users } from "lucide-react";

interface Reputation {
  id: string;
  userId: string;
  trustTier: string;
  reputationScore: number;
  totalTrades: number;
  successfulTrades: number;
  totalLaunches: number;
  totalBounties: number;
  completedBounties: number;
  twitterVerified: boolean;
  email: string | null;
  createdAt: string;
}

const TIER_COLORS: Record<string, string> = {
  unrated: "text-zinc-400",
  bronze: "text-amber-600",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-purple-400",
};

const TIER_BG: Record<string, string> = {
  unrated: "bg-zinc-800",
  bronze: "bg-amber-900/30 border-amber-800/50",
  silver: "bg-gray-800/30 border-gray-700/50",
  gold: "bg-yellow-900/30 border-yellow-700/50",
  platinum: "bg-purple-900/30 border-purple-700/50",
};

export default function RegistryPage() {
  const [agents, setAgents] = useState<Reputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetch("/api/registry")
      .then((r) => r.json())
      .then((d) => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function registerAgent() {
    setRegistering(true);
    await fetch("/api/registry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register" }),
    });
    // Reload
    const res = await fetch("/api/registry");
    const d = await res.json();
    setAgents(d.agents || []);
    setRegistering(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Agent Registry</h1>
          <p className="text-sm text-zinc-400">On-chain reputation system. Trust tiers earned through verified activity.</p>
        </div>
        <Button onClick={registerAgent} disabled={registering} className="bg-amber-600 hover:bg-amber-700">
          <Shield className="h-4 w-4 mr-2" /> {registering ? "Registering..." : "Register Agent"}
        </Button>
      </div>

      {/* Trust Tier Guide */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { tier: "unrated", min: "0", icon: "—" },
          { tier: "bronze", min: "10", icon: "🥉" },
          { tier: "silver", min: "100", icon: "🥈" },
          { tier: "gold", min: "500", icon: "🥇" },
          { tier: "platinum", min: "1000", icon: "💎" },
        ].map((t) => (
          <Card key={t.tier} className={`border ${TIER_BG[t.tier]}`}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl">{t.icon}</p>
              <p className={`text-sm font-semibold capitalize ${TIER_COLORS[t.tier]}`}>{t.tier}</p>
              <p className="text-xs text-zinc-500">{t.min}+ pts</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registry Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-amber-500" /> Registered Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-zinc-500">No agents registered yet. Be the first!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2 pr-4">Trust Tier</th>
                    <th className="pb-2 pr-4">Score</th>
                    <th className="pb-2 pr-4">Trades</th>
                    <th className="pb-2 pr-4">Launches</th>
                    <th className="pb-2 pr-4">Bounties</th>
                    <th className="pb-2 pr-4">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a, i) => (
                    <tr key={a.id} className="border-b border-zinc-800/60 text-zinc-300">
                      <td className="py-2.5 pr-4 text-zinc-500">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                      <td className="py-2.5 pr-4 font-medium text-zinc-100">{a.email || a.userId.slice(0, 8)}</td>
                      <td className="py-2.5 pr-4"><Badge className={TIER_COLORS[a.trustTier]}>{a.trustTier}</Badge></td>
                      <td className="py-2.5 pr-4 font-mono text-amber-400">{a.reputationScore}</td>
                      <td className="py-2.5 pr-4">{a.successfulTrades}/{a.totalTrades}</td>
                      <td className="py-2.5 pr-4">{a.totalLaunches}</td>
                      <td className="py-2.5 pr-4">{a.completedBounties}/{a.totalBounties}</td>
                      <td className="py-2.5 pr-4">{a.twitterVerified ? <CheckCircle className="h-4 w-4 text-green-400" /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
