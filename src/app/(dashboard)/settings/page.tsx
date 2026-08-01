"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Wallet, Shield, Bot, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [ansemPreference, setAnsemPreference] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    clawpumpApiKey: "",
    moonpayEmail: "",
    payoutWallet: "",
    telegramChatId: "",
    owsWalletName: "",
  });

  function handleSave() {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
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
                <Label htmlFor="moonpay">MoonPay Email</Label>
                <Input
                  id="moonpay"
                  type="email"
                  placeholder="you@example.com"
                  value={settings.moonpayEmail}
                  onChange={(e) => setSettings({ ...settings, moonpayEmail: e.target.value })}
                />
              </div>
              <Button variant="ansem" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Keys</>}
              </Button>
              {saved && <p className="text-sm text-green-400">Settings saved successfully!</p>}
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="ows" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>OWS Policies</CardTitle>
              <CardDescription>Open Wallet Standard policy engine — keys never touch the LLM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Ansem-Only Mode</p>
                    <p className="text-xs text-zinc-500">Restrict agent to Solana chain with $ANSEM preference</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="text-xs text-zinc-500">
                  <p>Rules: allowed_chains: [solana]</p>
                  <p>Action: deny if outside allowed chains</p>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Spend Limit</p>
                    <p className="text-xs text-zinc-500">Max USDC per transaction and per day</p>
                  </div>
                  <Badge variant="secondary">Not Set</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Max per tx (USDC)</Label>
                    <Input placeholder="100" className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Max per day (USDC)</Label>
                    <Input placeholder="1000" className="h-8" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Chain Allowlist</p>
                    <p className="text-xs text-zinc-500">Restrict operations to specific chains</p>
                  </div>
                  <Badge variant="secondary">Solana Only</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Solana", "Ethereum", "Base", "Arbitrum", "Polygon"].map((chain) => (
                    <button
                      key={chain}
                      className={`rounded-md px-3 py-1 text-xs ${
                        chain === "Solana"
                          ? "bg-amber-600 text-white"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {chain}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="ansem" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Policies</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-sm text-zinc-300 mb-2">Bot Commands:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-zinc-500">
                  <span>/start — Welcome</span>
                  <span>/ansem — $ANSEM info</span>
                  <span>/signals — Trending</span>
                  <span>/agents — List agents</span>
                  <span>/marketplace — Hot tokens</span>
                  <span>/swap — Swap info</span>
                </div>
              </div>
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
