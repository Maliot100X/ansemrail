"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Wallet, Shield, Bot, Save, Loader2, CheckCircle, AlertCircle, Link2 } from "lucide-react";

const ALL_CHAINS = ["Solana", "Ethereum", "Base", "Arbitrum", "Polygon", "Optimism", "BNB", "Avalanche"];

export default function SettingsPage() {
  const [ansemPreference, setAnsemPreference] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    clawpumpApiKey: "",
    payboxApiKey: "",
    moonpayEmail: "",
    payoutWallet: "",
    telegramChatId: "",
    owsWalletName: "",
  });
  const [hasClawpumpKey, setHasClawpumpKey] = useState(false);
  const [clawpumpProfile, setClawpumpProfile] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<string | null>(null);
  const [hasPayboxKey, setHasPayboxKey] = useState(false);
  const [payboxConnecting, setPayboxConnecting] = useState(false);
  const [payboxConnectResult, setPayboxConnectResult] = useState<string | null>(null);
  const [payboxPolicies, setPayboxPolicies] = useState<any[]>([]);
  const [deletingPolicy, setDeletingPolicy] = useState<string | null>(null);

  // OWS / PayBox state
  const [enabledChains, setEnabledChains] = useState<Set<string>>(new Set(["Solana"]));
  const [spendLimit, setSpendLimit] = useState({ maxPerTx: "100", maxPerDay: "1000" });
  const [payboxLoading, setPayboxLoading] = useState(false);
  const [payboxResult, setPayboxResult] = useState<any>(null);
  const [payboxError, setPayboxError] = useState<string | null>(null);
  const [payboxInfo, setPayboxInfo] = useState<any>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.payoutWallet) setSettings((prev) => ({ ...prev, payoutWallet: data.payoutWallet }));
        if (data.moonpayEmail) setSettings((prev) => ({ ...prev, moonpayEmail: data.moonpayEmail }));
        if (data.telegramChatId) setSettings((prev) => ({ ...prev, telegramChatId: data.telegramChatId }));
        if (data.owsWalletName) setSettings((prev) => ({ ...prev, owsWalletName: data.owsWalletName }));
        if (data.ansemPreference !== undefined) setAnsemPreference(data.ansemPreference);
        if (data.hasClawpumpKey !== undefined) setHasClawpumpKey(!!data.hasClawpumpKey);
        if (data.hasPayboxKey !== undefined) setHasPayboxKey(!!data.hasPayboxKey);
        if (Array.isArray(data.payboxPolicies)) setPayboxPolicies(data.payboxPolicies);
        if (data.clawpumpProfile) setClawpumpProfile(data.clawpumpProfile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/paybox?action=tools")
      .then((r) => r.json())
      .then((data) => {
        if (data.tools) setPayboxInfo({ tools: data.tools, available: true });
        else setPayboxInfo({ available: false });
      })
      .catch(() => setPayboxInfo({ available: false }));
  }, []);

  async function handleGenerateLinkCode() {
    setLinkLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-telegram-code" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate code");
      setLinkCode(data.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clawpumpApiKey: settings.clawpumpApiKey || undefined,
          payboxApiKey: settings.payboxApiKey || undefined,
          moonpayEmail: settings.moonpayEmail || undefined,
          payoutWallet: settings.payoutWallet || undefined,
          telegramChatId: settings.telegramChatId || undefined,
          owsWalletName: settings.owsWalletName || undefined,
          ansemPreference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (settings.clawpumpApiKey) {
        setHasClawpumpKey(true);
        setClawpumpProfile(data.clawpump || null);
      }
      if (settings.payboxApiKey) setHasPayboxKey(true);
      setSettings((prev) => ({
        ...prev,
        clawpumpApiKey: "",
        payboxApiKey: "",
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleChain(chain: string) {
    setEnabledChains((prev) => {
      const next = new Set(prev);
      if (next.has(chain)) next.delete(chain);
      else next.add(chain);
      return next;
    });
  }

  async function handleConnectClawpump() {
    if (!settings.clawpumpApiKey) {
      setConnectResult("Please enter a ClawPump API key first");
      return;
    }
    setConnecting(true);
    setConnectResult(null);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clawpumpApiKey: settings.clawpumpApiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      setHasClawpumpKey(true);
      setClawpumpProfile(data.clawpump || null);
      const agentCount = data.clawpump?.agents?.length ?? 0;
      setConnectResult(
        `ClawPump connected successfully — ${agentCount} agent${agentCount === 1 ? "" : "s"} on your key`
      );
      setSettings((prev) => ({ ...prev, clawpumpApiKey: "" }));
    } catch (err: any) {
      setConnectResult(err.message);
    } finally {
      setConnecting(false);
    }
  }

  async function handleConnectPaybox() {
    if (!settings.payboxApiKey) {
      setPayboxConnectResult("Please enter a PayBox API key first");
      return;
    }
    setPayboxConnecting(true);
    setPayboxConnectResult(null);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payboxApiKey: settings.payboxApiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      const toolsRes = await fetch("/api/paybox?action=tools");
      const toolsData = await toolsRes.json();
      if (!toolsRes.ok) throw new Error(toolsData.error || "PayBox unreachable");
      setHasPayboxKey(true);
      setPayboxConnectResult(
        `PayBox connected — ${toolsData.tools?.length ?? 0} tools available`
      );
      setSettings((prev) => ({ ...prev, payboxApiKey: "" }));
    } catch (err: any) {
      setPayboxConnectResult(err.message);
    } finally {
      setPayboxConnecting(false);
    }
  }

  async function refreshPolicies() {
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (res.ok && Array.isArray(data.policies)) setPayboxPolicies(data.policies);
    } catch {}
  }

  async function handleDeletePolicy(policyId: string) {
    setDeletingPolicy(policyId);
    try {
      const res = await fetch("/api/paybox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deletePolicy", policyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete policy");
      if (Array.isArray(data.remaining)) setPayboxPolicies(data.remaining);
      else await refreshPolicies();
    } catch (err: any) {
      setPayboxError(err.message);
    } finally {
      setDeletingPolicy(null);
    }
  }

  async function handleCreateAnsemPolicy() {
    setPayboxLoading(true);
    setPayboxError(null);
    setPayboxResult(null);
    try {
      const res = await fetch("/api/paybox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createAnsemPolicy" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create policy");
      setPayboxResult({ type: "ansem", data });
      await refreshPolicies();
    } catch (err: any) {
      setPayboxError(err.message);
    } finally {
      setPayboxLoading(false);
    }
  }

  async function handleCreateSpendLimit() {
    setPayboxLoading(true);
    setPayboxError(null);
    setPayboxResult(null);
    try {
      const res = await fetch("/api/paybox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSpendLimit",
          maxPerTx: parseFloat(spendLimit.maxPerTx) || 100,
          maxPerDay: parseFloat(spendLimit.maxPerDay) || 1000,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create spend limit");
      setPayboxResult({ type: "spend", data });
      await refreshPolicies();
    } catch (err: any) {
      setPayboxError(err.message);
    } finally {
      setPayboxLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-400">Manage API keys, OWS policies, payout wallets, and preferences</p>
      </div>

      <Tabs defaultValue="apikeys">
        <TabsList>
          <TabsTrigger value="apikeys" className="flex items-center gap-1 text-xs">
            <Key className="h-3 w-3" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-1 text-xs">
            <Link2 className="h-3 w-3" /> Accounts
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex items-center gap-1 text-xs">
            <Wallet className="h-3 w-3" /> Wallets
          </TabsTrigger>
          <TabsTrigger value="ows" className="flex items-center gap-1 text-xs">
            <Shield className="h-3 w-3" /> OWS Policies
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-1 text-xs">
            <Bot className="h-3 w-3" /> Telegram
          </TabsTrigger>
        </TabsList>

        {error && (
          <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {saved && (
          <div className="mt-4 rounded-md border border-green-800 bg-green-950/30 p-3">
            <p className="text-sm text-green-400 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Settings saved successfully!
            </p>
          </div>
        )}

        {/* API KEYS */}
        <TabsContent value="apikeys" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Keys are encrypted at rest with AES-256-GCM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpk">ClawPump API Key</Label>
                <Input
                  id="cpk"
                  type="password"
                  placeholder="cpk_..."
                  value={settings.clawpumpApiKey}
                  onChange={(e) => setSettings({ ...settings, clawpumpApiKey: e.target.value })}
                />
                <p className="text-xs text-zinc-500">Get yours at clawpump.tech/dashboard/api</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paybox">PayBox API Key</Label>
                <Input
                  id="paybox"
                  type="password"
                  placeholder="pbx_..."
                  value={settings.payboxApiKey}
                  onChange={(e) => setSettings({ ...settings, payboxApiKey: e.target.value })}
                />
                <p className="text-xs text-zinc-500">Get yours at app.paybox.sh — powers OWS policies and signing</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moonpay">MoonPay Email</Label>
                <Input
                  id="moonpay"
                  type="email"
                  placeholder="you@example.com"
                  value={settings.moonpayEmail}
                  onChange={(e) => setSettings({ ...settings, moonpayEmail: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-zinc-500">Status:</span>
                {hasClawpumpKey ? (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" /> ClawPump Connected
                    {clawpumpProfile?.agents
                      ? ` · ${clawpumpProfile.agents.length} agents on key`
                      : ""}
                  </Badge>
                ) : (
                  <Badge variant="secondary">ClawPump Not Connected</Badge>
                )}
                {hasPayboxKey ? (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" /> PayBox Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">PayBox Not Connected</Badge>
                )}
              </div>
              <Button variant="ansem" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Keys</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONNECTED ACCOUNTS */}
        <TabsContent value="accounts" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Link external accounts for unlimited agent chat and trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">ClawPump</p>
                    <p className="text-xs text-zinc-500">Connect your own API key for unlimited agent chat (bypasses shared quota)</p>
                  </div>
                  {hasClawpumpKey ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
                {hasClawpumpKey ? (
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">
                      Your ClawPump API key is encrypted at rest. Agent chat will use your key automatically.
                    </p>
                    {clawpumpProfile?.agents && (
                      <p className="text-xs text-green-400">
                        Connected to clawpump.tech — {clawpumpProfile.agents.length} agents on your key
                        ({(clawpumpProfile.agents.filter((a: any) => a.status === "running").length)} running)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="cpk_..."
                      value={settings.clawpumpApiKey}
                      onChange={(e) => setSettings({ ...settings, clawpumpApiKey: e.target.value })}
                    />
                    <Button variant="ansem" size="sm" onClick={handleConnectClawpump} disabled={connecting}>
                      {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                      Connect ClawPump
                    </Button>
                  </div>
                )}
                {connectResult && (
                  <p className={`text-xs ${connectResult.includes("success") ? "text-green-400" : "text-red-400"}`}>
                    {connectResult}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">PayBox</p>
                    <p className="text-xs text-zinc-500">Connect your own PayBox key for OWS policies, signing, and swaps</p>
                  </div>
                  {hasPayboxKey ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
                {hasPayboxKey ? (
                  <p className="text-xs text-zinc-500">
                    Your PayBox API key is encrypted at rest. OWS policy creation and PayBox actions use it automatically.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="pbx_..."
                      value={settings.payboxApiKey}
                      onChange={(e) => setSettings({ ...settings, payboxApiKey: e.target.value })}
                    />
                    <Button variant="ansem" size="sm" onClick={handleConnectPaybox} disabled={payboxConnecting}>
                      {payboxConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                      Connect PayBox
                    </Button>
                  </div>
                )}
                {payboxConnectResult && (
                  <p className={`text-xs ${payboxConnectResult.includes("connected") ? "text-green-400" : "text-red-400"}`}>
                    {payboxConnectResult}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WALLETS */}
        <TabsContent value="wallets" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>Payout wallet and OWS treasury configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payout">Payout Wallet Address</Label>
                <Input
                  id="payout"
                  placeholder="Solana wallet address for receiving earnings"
                  value={settings.payoutWallet}
                  onChange={(e) => setSettings({ ...settings, payoutWallet: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ows">OWS Wallet Name</Label>
                <Input
                  id="ows"
                  placeholder="ansemrail-treasury"
                  value={settings.owsWalletName}
                  onChange={(e) => setSettings({ ...settings, owsWalletName: e.target.value })}
                />
                <p className="text-xs text-zinc-500">Open Wallet Standard local encrypted vault</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">$ANSEM Preference</p>
                  <p className="text-xs text-zinc-500">Use $ANSEM as preferred payment for inference</p>
                </div>
                <Switch checked={ansemPreference} onCheckedChange={setAnsemPreference} />
              </div>
              {ansemPreference && (
                <Badge variant="ansem">
                  <span className="mr-1">🐂</span> Ansem-Only Mode Active
                </Badge>
              )}
              <Button variant="ansem" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Wallet Settings</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OWS POLICIES */}
        <TabsContent value="ows" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>OWS Policies</CardTitle>
              <CardDescription>Open Wallet Standard policy engine — keys never touch the LLM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* PayBox status */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-200">PayBox MCP Status</p>
                  {payboxInfo?.available ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Not Available</Badge>
                  )}
                </div>
                {payboxInfo?.available && payboxInfo.tools && (
                  <p className="text-xs text-zinc-500">
                    {payboxInfo.tools.length} tools available · using your connected key
                  </p>
                )}
                {!payboxInfo?.available && (
                  <p className="text-xs text-zinc-500">
                    PayBox MCP endpoint at app.paybox.sh may not be live yet. Policy creation will attempt to connect.
                  </p>
                )}
              </div>

              {/* Ansem-Only Policy */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Ansem-Only Mode</p>
                    <p className="text-xs text-zinc-500">Restrict agent to Solana chain with $ANSEM, $CLAW, SOL, USDC only</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="text-xs text-zinc-500">
                  <p>Rules: allowed_chains: [solana], allowed_tokens: [$ANSEM, $CLAW, SOL, USDC]</p>
                  <p>Action: deny if outside allowed chains/tokens</p>
                  <p>Max spend: 100 USDC</p>
                </div>
                <Button
                  variant="ansem"
                  size="sm"
                  onClick={handleCreateAnsemPolicy}
                  disabled={payboxLoading}
                >
                  {payboxLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                  Create Ansem-Only Policy via PayBox
                </Button>
              </div>

              {/* Spend Limit Policy */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Spend Limit</p>
                    <p className="text-xs text-zinc-500">Max USDC per transaction and per day</p>
                  </div>
                  <Badge variant="secondary">Configurable</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Max per tx (USDC)</Label>
                    <Input
                      placeholder="100"
                      className="h-8"
                      value={spendLimit.maxPerTx}
                      onChange={(e) => setSpendLimit({ ...spendLimit, maxPerTx: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max per day (USDC)</Label>
                    <Input
                      placeholder="1000"
                      className="h-8"
                      value={spendLimit.maxPerDay}
                      onChange={(e) => setSpendLimit({ ...spendLimit, maxPerDay: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  variant="ansem"
                  size="sm"
                  onClick={handleCreateSpendLimit}
                  disabled={payboxLoading}
                >
                  {payboxLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                  Create Spend Limit Policy via PayBox
                </Button>
              </div>

              {/* Chain Allowlist */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Chain Allowlist</p>
                    <p className="text-xs text-zinc-500">Click to toggle — restrict operations to specific chains</p>
                  </div>
                  <Badge variant={enabledChains.size > 0 ? "success" : "secondary"}>
                    {enabledChains.size} enabled
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_CHAINS.map((chain) => (
                    <button
                      key={chain}
                      type="button"
                      onClick={() => toggleChain(chain)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        enabledChains.has(chain)
                          ? "bg-amber-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {enabledChains.has(chain) && <CheckCircle className="h-3 w-3 inline mr-1" />}
                      {chain}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  Enabled: {Array.from(enabledChains).join(", ") || "None"}
                </p>
              </div>

              {/* Saved policies */}
              {payboxPolicies.length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                  <p className="text-sm font-medium text-zinc-200">Your Saved Policies ({payboxPolicies.length})</p>
                  {payboxPolicies.map((pol: any) => (
                    <div
                      key={pol.id}
                      className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{pol.name}</p>
                        <p className="text-xs text-zinc-500">
                          {pol.rules?.length ?? 0} rules · action: {pol.action} · priority: {pol.priority}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePolicy(pol.id)}
                        disabled={deletingPolicy === pol.id}
                      >
                        {deletingPolicy === pol.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* PayBox results */}
              {payboxError && (
                <div className="rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{payboxError}</span>
                  </p>
                </div>
              )}

              {payboxResult && (
                <div className="rounded-md border border-green-800 bg-green-950/30 p-3 space-y-2">
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Policy Created
                  </p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-32">
                    {JSON.stringify(payboxResult.data, null, 2)}
                  </pre>
                </div>
              )}

              <Button variant="ansem" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save All Settings</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TELEGRAM */}
        <TabsContent value="telegram" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Integration</CardTitle>
              <CardDescription>Link your Telegram account for bot notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tgchat">Telegram Chat ID</Label>
                <Input
                  id="tgchat"
                  placeholder="Your Telegram chat ID"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                />
                <p className="text-xs text-zinc-500">
                  Message @userinfobot on Telegram to get your chat ID
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <p className="text-sm text-zinc-300 mb-2">Bot Commands:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-zinc-500">
                  <span>/start — Welcome</span>
                  <span>/link &lt;code&gt; — Connect account</span>
                  <span>/myagents — Your agents</span>
                  <span>/balance — Wallet balance</span>
                  <span>/ansem — $ANSEM info</span>
                  <span>/signals — Trending</span>
                  <span>/marketplace — Hot tokens</span>
                  <span>/help — All commands</span>
                </div>
              </div>

              {settings.telegramChatId ? (
                <div className="rounded-lg border border-green-800 bg-green-950/30 p-4 space-y-2">
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Telegram Linked
                  </p>
                  <p className="text-xs text-zinc-400">
                    Chat ID: <code>{settings.telegramChatId}</code>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Bot: <a href="https://t.me/AnsemClawBot" target="_blank" className="text-amber-400 underline">@AnsemClawBot</a>
                  </p>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    await fetch("/api/settings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({action:"unlink-telegram"}) });
                    setSettings(prev => ({...prev, telegramChatId: ""}));
                  }}>Unlink Telegram</Button>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-amber-300">Link Your Telegram</p>
                  <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
                    <li>Open <a href="https://t.me/AnsemClawBot" target="_blank" className="text-amber-400 underline">@AnsemClawBot</a> on Telegram</li>
                    <li>Send <code>/start</code> to the bot</li>
                    <li>Click the button below to get a link code</li>
                    <li>Send <code>/link &lt;code&gt;</code> to the bot</li>
                  </ol>
                  {linkCode ? (
                    <div className="rounded-md bg-zinc-900 border border-amber-700 p-3 space-y-2">
                      <p className="text-xs text-amber-400">Your link code (expires in 10 minutes):</p>
                      <code className="text-xl font-bold text-amber-300 block tracking-wider">{linkCode}</code>
                      <p className="text-xs text-zinc-500">Send to bot: <code>/link {linkCode}</code></p>
                    </div>
                  ) : (
                    <Button variant="ansem" size="sm" onClick={handleGenerateLinkCode} disabled={linkLoading}>
                      {linkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Link2 className="h-3 w-3" /> Generate Link Code</>}
                    </Button>
                  )}
                </div>
              )}

              <Button variant="ansem" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Telegram Settings</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
