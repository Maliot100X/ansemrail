"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Zap, Repeat, TrendingUp, Network as BridgeIcon, Rocket, ExternalLink, Copy, CheckCircle2, Circle, XCircle, Wand2 } from "lucide-react";
import ClawLaunchTab from "@/components/terminal/claw-launch-tab";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ANSEM_MINT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
const CLAW_MINT = "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump";

function shortAddr(addr?: string | null, len = 6) {
  if (!addr) return "—";
  return addr.length > len * 2 + 3
    ? `${addr.slice(0, len)}...${addr.slice(-len)}`
    : addr;
}

function weiToEth(wei?: string | number | null): string {
  if (!wei) return "0";
  const n = Number(wei);
  if (!isFinite(n) || n <= 0) return "0";

  async function pbFetchCredentials() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=credentials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load wallets");
      const creds = data.credentials || [];
      setPbCredentials(creds);
      if (creds.length > 0 && !pbSelectedCred) setPbSelectedCred(creds[0].credential_id);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPortfolio() {
    if (!pbSelectedCred) { setPbError("Select a wallet first"); return; }
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch(`/api/paybox?action=portfolio&credentialId=${pbSelectedCred}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      setPbPortfolio(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchServices() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load services");
      setPbServices(data.services || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPolicies() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      setPbPolicies(data.policies || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbTransfer() {
    if (!pbSelectedCred || !pbTransfer.to || !pbTransfer.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer", credentialId: pbSelectedCred, to: pbTransfer.to, amount: pbTransfer.amount, tokenMint: pbTransfer.tokenMint }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbSwap() {
    if (!pbSelectedCred || !pbSwap.srcToken || !pbSwap.dstToken || !pbSwap.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "swap", credentialId: pbSelectedCred, srcChain: "solana:mainnet", srcToken: pbSwap.srcToken, dstToken: pbSwap.dstToken, amount: pbSwap.amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  return (n / 1e18).toFixed(6);
}

function LaunchStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    reserved: { label: "Reserved", cls: "bg-amber-950 text-amber-300 border-amber-700" },
    submitted: { label: "Submitted", cls: "bg-blue-950 text-blue-300 border-blue-700" },
    soft_confirmed: { label: "Soft Confirmed", cls: "bg-green-950 text-green-300 border-green-700" },
    confirmed: { label: "Confirmed", cls: "bg-green-950 text-green-300 border-green-700" },
    finalized: { label: "Finalized", cls: "bg-green-950 text-green-300 border-green-700" },
    failed: { label: "Failed", cls: "bg-red-950 text-red-300 border-red-700" },
    error: { label: "Error", cls: "bg-red-950 text-red-300 border-red-700" },
  };
  const s = map[status] || { label: status, cls: "bg-zinc-900 text-zinc-300 border-zinc-700" };

  async function pbFetchCredentials() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=credentials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load wallets");
      const creds = data.credentials || [];
      setPbCredentials(creds);
      if (creds.length > 0 && !pbSelectedCred) setPbSelectedCred(creds[0].credential_id);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPortfolio() {
    if (!pbSelectedCred) { setPbError("Select a wallet first"); return; }
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch(`/api/paybox?action=portfolio&credentialId=${pbSelectedCred}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      setPbPortfolio(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchServices() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load services");
      setPbServices(data.services || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPolicies() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      setPbPolicies(data.policies || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbTransfer() {
    if (!pbSelectedCred || !pbTransfer.to || !pbTransfer.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer", credentialId: pbSelectedCred, to: pbTransfer.to, amount: pbTransfer.amount, tokenMint: pbTransfer.tokenMint }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbSwap() {
    if (!pbSelectedCred || !pbSwap.srcToken || !pbSwap.dstToken || !pbSwap.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "swap", credentialId: pbSelectedCred, srcChain: "solana:mainnet", srcToken: pbSwap.srcToken, dstToken: pbSwap.dstToken, amount: pbSwap.amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {status === "failed" || status === "error" ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      {s.label}
    </span>
  );
}

const LAUNCH_STEPS = ["submitted", "soft_confirmed", "finalized"];

const TOKEN_OPTIONS = [
  { label: "SOL", mint: SOL_MINT },
  { label: "USDC", mint: USDC_MINT },
  { label: "$ANSEM", mint: ANSEM_MINT },
  { label: "$CLAW", mint: CLAW_MINT },
];

function TokenSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {

  async function pbFetchCredentials() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=credentials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load wallets");
      const creds = data.credentials || [];
      setPbCredentials(creds);
      if (creds.length > 0 && !pbSelectedCred) setPbSelectedCred(creds[0].credential_id);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPortfolio() {
    if (!pbSelectedCred) { setPbError("Select a wallet first"); return; }
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch(`/api/paybox?action=portfolio&credentialId=${pbSelectedCred}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      setPbPortfolio(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchServices() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load services");
      setPbServices(data.services || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPolicies() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      setPbPolicies(data.policies || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbTransfer() {
    if (!pbSelectedCred || !pbTransfer.to || !pbTransfer.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer", credentialId: pbSelectedCred, to: pbTransfer.to, amount: pbTransfer.amount, tokenMint: pbTransfer.tokenMint }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbSwap() {
    if (!pbSelectedCred || !pbSwap.srcToken || !pbSwap.dstToken || !pbSwap.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "swap", credentialId: pbSelectedCred, srcChain: "solana:mainnet", srcToken: pbSwap.srcToken, dstToken: pbSwap.dstToken, amount: pbSwap.amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  return (
    <select
      id={id}
      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {TOKEN_OPTIONS.map((t) => (
        <option key={t.mint} value={t.mint}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

export default function TerminalPage() {
  const [swapForm, setSwapForm] = useState({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: "1000000000",
  });
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DCA state
  const [dcaForm, setDcaForm] = useState({
    tokenMint: ANSEM_MINT,
    amountPerBuy: "50",
    frequency: "daily",
  });
  const [dcaResult, setDcaResult] = useState<any>(null);
  const [dcaLoading, setDcaLoading] = useState(false);
  const [dcaError, setDcaError] = useState<string | null>(null);

  // Perps state
  const [perpsForm, setPerpsForm] = useState({
    market: "SOL-PERP",
    side: "long" as "long" | "short",
    size: "1.0",
    leverage: "5x",
    margin: "100",
  });
  const [perpsResult, setPerpsResult] = useState<any>(null);
  const [perpsLoading, setPerpsLoading] = useState(false);
  const [perpsError, setPerpsError] = useState<string | null>(null);

  // Bridge state
  const [bridgeForm, setBridgeForm] = useState({
    fromChain: "solana",
    toChain: "ethereum",
    token: "USDC",
    amount: "100",
  });
  const [bridgeResult, setBridgeResult] = useState<any>(null);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  // PONS Launch state
  const [ponsForm, setPonsForm] = useState({
    agentId: "",
    name: "",
    symbol: "",
    description: "",
    logoUrl: "",
    payoutWallet: "",
  });
  const [ponsResult, setPonsResult] = useState<any>(null);
  const [ponsLoading, setPonsLoading] = useState(false);
  const [ponsError, setPonsError] = useState<string | null>(null);
  const [ponsLaunches, setPonsLaunches] = useState<any[]>([]);
  const [ponsLaunchesLoading, setPonsLaunchesLoading] = useState(false);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [executeAgentId, setExecuteAgentId] = useState("");
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<any>(null);  // PayBox state
  const [pbCredentials, setPbCredentials] = useState<any[]>([]);
  const [pbSelectedCred, setPbSelectedCred] = useState("");
  const [pbPortfolio, setPbPortfolio] = useState<any>(null);
  const [pbLoading, setPbLoading] = useState(false);
  const [pbError, setPbError] = useState<string | null>(null);
  const [pbTransfer, setPbTransfer] = useState({ to: "", amount: "", tokenMint: "So11111111111111111111111111111111111111112" });
  const [pbSwap, setPbSwap] = useState({ srcToken: "So11111111111111111111111111111111111111112", dstToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", amount: "" });
  const [pbServices, setPbServices] = useState<any[]>([]);
  const [pbPolicies, setPbPolicies] = useState<any[]>([]);
  const [pbResult, setPbResult] = useState<any>(null);
  const [pbActiveView, setPbActiveView] = useState<"wallet"|"transfer"|"swap"|"services"|"policies">("wallet");
  const [executeError, setExecuteError] = useState<string | null>(null);

  async function handleQuote(e: React.FormEvent) {
    e.preventDefault();
    setQuoteLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quote failed");
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault();
    if (!executeAgentId) {
      setExecuteError("Select a ClawPump agent to execute the swap with.");
      return;
    }
    setExecuting(true);
    setExecuteError(null);
    setExecuteResult(null);
    try {
      const res = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: executeAgentId,
          inputMint: swapForm.inputMint,
          outputMint: swapForm.outputMint,
          amount: swapForm.amount,
          slippageBps: 50,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap execution failed");
      setExecuteResult(data);
    } catch (err: any) {
      setExecuteError(err.message);
    } finally {
      setExecuting(false);
    }
  }

  async function handleDca(e: React.FormEvent) {
    e.preventDefault();
    setDcaLoading(true);
    setDcaError(null);
    setDcaResult(null);
    try {
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputMint: USDC_MINT,
          outputMint: dcaForm.tokenMint,
          amount: (parseFloat(dcaForm.amountPerBuy) * 1_000_000).toString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "DCA quote failed");
      const outSymbol = TOKEN_OPTIONS.find((t) => t.mint === dcaForm.tokenMint)?.label || "token";
      setDcaResult({
        schedule: dcaForm.frequency,
        amountUsd: dcaForm.amountPerBuy,
        token: outSymbol,
        quote: data,
        message: `DCA order simulated: Buy $${dcaForm.amountPerBuy} of ${outSymbol} ${dcaForm.frequency}. Quote generated from Jupiter.`,
      });
    } catch (err: any) {
      setDcaError(err.message);
    } finally {
      setDcaLoading(false);
    }
  }

  async function handlePerps(e: React.FormEvent) {
    e.preventDefault();
    setPerpsLoading(true);
    setPerpsError(null);
    setPerpsResult(null);
    try {
      const marginUsd = parseFloat(perpsForm.margin) || 0;
      const leverageNum = parseInt(perpsForm.leverage) || 1;
      const sizeNum = parseFloat(perpsForm.size) || 0;
      const notional = sizeNum * leverageNum;
      setPerpsResult({
        market: perpsForm.market,
        side: perpsForm.side,
        size: sizeNum,
        leverage: perpsForm.leverage,
        margin: marginUsd,
        notionalValue: notional,
        liquidationPrice: perpsForm.side === "long" ? marginUsd / notional : undefined,
        message: `Position preview: ${perpsForm.side.toUpperCase()} ${sizeNum} ${perpsForm.market} at ${perpsForm.leverage} leverage. Notional: $${notional.toFixed(2)}. Margin: $${marginUsd}. Execute via ClawPump agent with perps skill.`,
        warning: "Perps can result in total loss of margin. Ensure your agent has the perps skill enabled.",
      });
    } catch (err: any) {
      setPerpsError(err.message);
    } finally {
      setPerpsLoading(false);
    }
  }

  async function handleBridge(e: React.FormEvent) {
    e.preventDefault();
    setBridgeLoading(true);
    setBridgeError(null);
    setBridgeResult(null);
    try {
      const res = await fetch("https://agents.moonpay.com/api/tools/chain_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testnet: false, vmId: 0 }),
      });
      const chains = await res.json();
      const fromChainInfo = chains.items?.find((c: any) => c.id === bridgeForm.fromChain);
      const toChainInfo = chains.items?.find((c: any) => c.id === bridgeForm.toChain);
      setBridgeResult({
        fromChain: bridgeForm.fromChain,
        toChain: bridgeForm.toChain,
        token: bridgeForm.token,
        amount: bridgeForm.amount,
        fromChainInfo: fromChainInfo ? { name: fromChainInfo.name, id: fromChainInfo.id } : null,
        toChainInfo: toChainInfo ? { name: toChainInfo.name, id: toChainInfo.id } : null,
        message: `Bridge preview: ${bridgeForm.amount} ${bridgeForm.token} from ${bridgeForm.fromChain} to ${bridgeForm.toChain}. Chain data retrieved from MoonPay. Execute via MoonPay CLI (mp) with authenticated wallet.`,
      });
    } catch (err: any) {
      setBridgeError(err.message);
    } finally {
      setBridgeLoading(false);
    }
  }

  async function handlePonsLaunch(e: React.FormEvent) {
    e.preventDefault();
    setPonsLoading(true);
    setPonsError(null);
    setPonsResult(null);
    try {
      const res = await fetch("/api/launch/pons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ponsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PONS launch failed");
      setPonsResult(data);
      if (data.launch?.tokenAddress || data.launch?.predictedTokenAddress) {
        setTimeout(() => fetchPonsLaunches(ponsForm.agentId), 3000);
      }
    } catch (err: any) {
      setPonsError(err.message);
    } finally {
      setPonsLoading(false);
    }
  }

  async function fetchPonsLaunches(agentId: string) {
    if (!agentId) return;
    setPonsLaunchesLoading(true);
    try {
      const res = await fetch(`/api/launch/pons?agentId=${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setPonsLaunches(data?.launches || []);
      }
    } catch {}
    setPonsLaunchesLoading(false);
  }

  async function fetchMyAgents() {
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        const list = data.agents || [];
        setMyAgents(list);
        if (list.length > 0 && !ponsForm.agentId) {
          setPonsForm((prev) => ({ ...prev, agentId: list[0].id }));
        }
      }
    } catch {}
    setAgentsLoading(false);
  }

  useEffect(() => {
    fetchMyAgents();
  }, []);

  useEffect(() => {
    if (!ponsForm.agentId) return;
    fetchPonsLaunches(ponsForm.agentId);
    const timer = setInterval(() => fetchPonsLaunches(ponsForm.agentId), 8000);
  
  async function pbFetchCredentials() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=credentials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load wallets");
      const creds = data.credentials || [];
      setPbCredentials(creds);
      if (creds.length > 0 && !pbSelectedCred) setPbSelectedCred(creds[0].credential_id);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPortfolio() {
    if (!pbSelectedCred) { setPbError("Select a wallet first"); return; }
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch(`/api/paybox?action=portfolio&credentialId=${pbSelectedCred}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      setPbPortfolio(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchServices() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load services");
      setPbServices(data.services || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPolicies() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      setPbPolicies(data.policies || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbTransfer() {
    if (!pbSelectedCred || !pbTransfer.to || !pbTransfer.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer", credentialId: pbSelectedCred, to: pbTransfer.to, amount: pbTransfer.amount, tokenMint: pbTransfer.tokenMint }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbSwap() {
    if (!pbSelectedCred || !pbSwap.srcToken || !pbSwap.dstToken || !pbSwap.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "swap", credentialId: pbSelectedCred, srcChain: "solana:mainnet", srcToken: pbSwap.srcToken, dstToken: pbSwap.dstToken, amount: pbSwap.amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ponsForm.agentId]);


  async function pbFetchCredentials() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=credentials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load wallets");
      const creds = data.credentials || [];
      setPbCredentials(creds);
      if (creds.length > 0 && !pbSelectedCred) setPbSelectedCred(creds[0].credential_id);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPortfolio() {
    if (!pbSelectedCred) { setPbError("Select a wallet first"); return; }
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch(`/api/paybox?action=portfolio&credentialId=${pbSelectedCred}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      setPbPortfolio(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchServices() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load services");
      setPbServices(data.services || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPolicies() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      setPbPolicies(data.policies || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbTransfer() {
    if (!pbSelectedCred || !pbTransfer.to || !pbTransfer.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer", credentialId: pbSelectedCred, to: pbTransfer.to, amount: pbTransfer.amount, tokenMint: pbTransfer.tokenMint }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbSwap() {
    if (!pbSelectedCred || !pbSwap.srcToken || !pbSwap.dstToken || !pbSwap.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "swap", credentialId: pbSelectedCred, srcChain: "solana:mainnet", srcToken: pbSwap.srcToken, dstToken: pbSwap.dstToken, amount: pbSwap.amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Trading Terminal</h1>
        <p className="text-sm text-zinc-400">Swap, DCA, perps, and multi-chain bridges via ClawPump + MoonPay</p>
      </div>

      <Tabs defaultValue="swap">
        <TabsList className="grid w-full grid-cols-7 max-w-4xl">
          <TabsTrigger value="swap" className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> Swap
          </TabsTrigger>
          <TabsTrigger value="dca" className="flex items-center gap-1">
            <Repeat className="h-3 w-3" /> DCA
          </TabsTrigger>
          <TabsTrigger value="perps" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Perps
          </TabsTrigger>
          <TabsTrigger value="bridge" className="flex items-center gap-1">
            <BridgeIcon className="h-3 w-3" /> Bridge
          </TabsTrigger>
          <TabsTrigger value="pons" className="flex items-center gap-1">
            <Rocket className="h-3 w-3" /> Launch
          </TabsTrigger>
          <TabsTrigger value="claw" className="flex items-center gap-1">
            <Wand2 className="h-3 w-3" /> ClawLaunch
          </TabsTrigger>
        </TabsList>

        {/* SWAP */}
        <TabsContent value="swap" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Token Swap</CardTitle>
              <CardDescription>Get a real quote from Jupiter aggregator — simulate-first pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuote} className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Token</Label>
                  <TokenSelect
                    value={swapForm.inputMint}
                    onChange={(v) => setSwapForm({ ...swapForm, inputMint: v })}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-zinc-600" />
                </div>

                <div className="space-y-2">
                  <Label>Output Token</Label>
                  <TokenSelect
                    value={swapForm.outputMint}
                    onChange={(v) => setSwapForm({ ...swapForm, outputMint: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (in lamports/units)</Label>
                  <Input
                    id="amount"
                    value={swapForm.amount}
                    onChange={(e) => setSwapForm({ ...swapForm, amount: e.target.value })}
                    placeholder="1000000000 (1 SOL)"
                  />
                  <p className="text-xs text-zinc-500">1 SOL = 1,000,000,000 lamports · 1 USDC = 1,000,000 units</p>
                </div>

                <Button type="submit" variant="ansem" className="w-full" disabled={quoteLoading}>
                  {quoteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get Quote <Zap className="h-4 w-4" /></>}
                </Button>
              </form>

              {error && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {quote && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Zap className="h-4 w-4" /> Quote Received
                  </p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                    {JSON.stringify(quote, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(quote, null, 2))}
                    >
                      Copy Quote JSON
                    </Button>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-green-900">
                    <Label htmlFor="exec-agent">Execute with agent</Label>
                    {agentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading your agents...
                      </div>
                    ) : myAgents.length === 0 ? (
                      <p className="text-xs text-amber-400">
                        No agents found for your connected key. Create one on the{" "}
                        <a href="/agents" className="underline">Agents page</a> first.
                      </p>
                    ) : (
                      <select
                        id="exec-agent"
                        className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                        value={executeAgentId}
                        onChange={(e) => setExecuteAgentId(e.target.value)}
                      >
                        <option value="">Select an agent...</option>
                        {myAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} — {a.id} ({a.status})
                          </option>
                        ))}
                      </select>
                    )}
                    <Button
                      type="button"
                      variant="ansem"
                      size="sm"
                      className="w-full"
                      disabled={executing || !executeAgentId}
                      onClick={handleExecute}
                    >
                      {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      Execute Swap via Agent Wallet
                    </Button>
                    <p className="text-xs text-zinc-500">
                      Executes through the selected ClawPump agent&apos;s own wallet with your connected key. The agent must own SOL/SPL balance for the swap.
                    </p>
                  </div>
                </div>
              )}

              {executeError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{executeError}</p>
                </div>
              )}

              {executeResult && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Zap className="h-4 w-4" /> Swap Executed
                  </p>
                  <pre className="text-xs text-zinc-300 overflow-auto max-h-48">
                    {JSON.stringify(executeResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DCA */}
        <TabsContent value="dca" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Dollar-Cost Averaging</CardTitle>
              <CardDescription>Set up recurring buys — get a real quote per buy from Jupiter</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDca} className="space-y-4">
                <div className="space-y-2">
                  <Label>Token to DCA</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={dcaForm.tokenMint}
                    onChange={(e) => setDcaForm({ ...dcaForm, tokenMint: e.target.value })}
                  >
                    <option value={ANSEM_MINT}>$ANSEM</option>
                    <option value={SOL_MINT}>SOL</option>
                    <option value={CLAW_MINT}>$CLAW</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount per buy (USDC)</Label>
                    <Input
                      placeholder="50"
                      value={dcaForm.amountPerBuy}
                      onChange={(e) => setDcaForm({ ...dcaForm, amountPerBuy: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={dcaForm.frequency}
                      onChange={(e) => setDcaForm({ ...dcaForm, frequency: e.target.value })}
                    >
                      <option value="hourly">Every hour</option>
                      <option value="daily">Every day</option>
                      <option value="weekly">Every week</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={dcaLoading}>
                  {dcaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generate DCA Quote <Repeat className="h-4 w-4" /></>}
                </Button>
              </form>

              {dcaError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{dcaError}</p>
                </div>
              )}

              {dcaResult && (
                <div className="mt-4 space-y-3 rounded-md border border-green-800 bg-green-950/30 p-4">
                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                    <Repeat className="h-4 w-4" /> DCA Preview
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Schedule</p>
                      <p className="text-zinc-200 capitalize">{dcaResult.schedule}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Amount</p>
                      <p className="text-zinc-200">${dcaResult.amountUsd}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Token</p>
                      <p className="text-zinc-200">{dcaResult.token}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">{dcaResult.message}</p>
                  {dcaResult.quote && (
                    <pre className="text-xs text-zinc-300 overflow-auto max-h-32">
                      {JSON.stringify(dcaResult.quote, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERPS */}
        <TabsContent value="perps" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Phoenix Perps</CardTitle>
              <CardDescription>Preview perpetual futures positions on Phoenix DEX</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePerps} className="space-y-4">
                <div className="space-y-2">
                  <Label>Market</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={perpsForm.market}
                    onChange={(e) => setPerpsForm({ ...perpsForm, market: e.target.value })}
                  >
                    <option>SOL-PERP</option>
                    <option>BTC-PERP</option>
                    <option>ETH-PERP</option>
                    <option>$ANSEM-PERP</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Side</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${perpsForm.side === "long" ? "border-green-600 text-green-400 bg-green-950/30" : "border-zinc-700 text-zinc-400"}`}
                        onClick={() => setPerpsForm({ ...perpsForm, side: "long" })}
                      >
                        Long
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${perpsForm.side === "short" ? "border-red-600 text-red-400 bg-red-950/30" : "border-zinc-700 text-zinc-400"}`}
                        onClick={() => setPerpsForm({ ...perpsForm, side: "short" })}
                      >
                        Short
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Size (SOL)</Label>
                    <Input
                      placeholder="1.0"
                      value={perpsForm.size}
                      onChange={(e) => setPerpsForm({ ...perpsForm, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leverage</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={perpsForm.leverage}
                      onChange={(e) => setPerpsForm({ ...perpsForm, leverage: e.target.value })}
                    >
                      <option value="1x">1x</option>
                      <option value="2x">2x</option>
                      <option value="5x">5x</option>
                      <option value="10x">10x</option>
                      <option value="20x">20x</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Margin (USDC)</Label>
                    <Input
                      placeholder="100"
                      value={perpsForm.margin}
                      onChange={(e) => setPerpsForm({ ...perpsForm, margin: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={perpsLoading}>
                  {perpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Preview Position <TrendingUp className="h-4 w-4" /></>}
                </Button>
              </form>

              {perpsError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{perpsError}</p>
                </div>
              )}

              {perpsResult && (
                <div className="mt-4 space-y-3 rounded-md border border-amber-800 bg-amber-950/20 p-4">
                  <p className="text-sm font-medium text-amber-400 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Position Preview
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">Market</p>
                      <p className="text-zinc-200">{perpsResult.market}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Side</p>
                      <p className={perpsResult.side === "long" ? "text-green-400" : "text-red-400"}>
                        {perpsResult.side.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Leverage</p>
                      <p className="text-zinc-200">{perpsResult.leverage}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Notional</p>
                      <p className="text-zinc-200">${perpsResult.notionalValue.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">{perpsResult.message}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">High Risk</Badge>
                    <span className="text-xs text-zinc-500">{perpsResult.warning}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRIDGE */}
        <TabsContent value="bridge" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Chain Bridge</CardTitle>
              <CardDescription>Bridge assets across chains — chain data from MoonPay</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBridge} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Chain</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={bridgeForm.fromChain}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, fromChain: e.target.value })}
                    >
                      <option value="solana">Solana</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="base">Base</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="polygon">Polygon</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Chain</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={bridgeForm.toChain}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, toChain: e.target.value })}
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="solana">Solana</option>
                      <option value="base">Base</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="polygon">Polygon</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={bridgeForm.token}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, token: e.target.value })}
                    >
                      <option>USDC</option>
                      <option>SOL</option>
                      <option>ETH</option>
                      <option>USDT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      placeholder="100"
                      value={bridgeForm.amount}
                      onChange={(e) => setBridgeForm({ ...bridgeForm, amount: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={bridgeLoading}>
                  {bridgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get Bridge Preview <BridgeIcon className="h-4 w-4" /></>}
                </Button>
              </form>

              {bridgeError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{bridgeError}</p>
                </div>
              )}

              {bridgeResult && (
                <div className="mt-4 space-y-3 rounded-md border border-blue-800 bg-blue-950/20 p-4">
                  <p className="text-sm font-medium text-blue-400 flex items-center gap-1">
                    <BridgeIcon className="h-4 w-4" /> Bridge Preview
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">From</p>
                      <p className="text-zinc-200 capitalize">{bridgeResult.fromChain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">To</p>
                      <p className="text-zinc-200 capitalize">{bridgeResult.toChain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Token</p>
                      <p className="text-zinc-200">{bridgeResult.token}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Amount</p>
                      <p className="text-zinc-200">{bridgeResult.amount}</p>
                    </div>
                  </div>
                  {bridgeResult.fromChainInfo && bridgeResult.toChainInfo && (
                    <div className="text-xs text-zinc-500">
                      <p>From: {bridgeResult.fromChainInfo.name} (ID: {bridgeResult.fromChainInfo.id})</p>
                      <p>To: {bridgeResult.toChainInfo.name} (ID: {bridgeResult.toChainInfo.id})</p>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400">{bridgeResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PONS LAUNCH */}
        <TabsContent value="pons" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-amber-500" />
                Gasless Token Launch (Robinhood Chain)
              </CardTitle>
              <CardDescription>
                Launch a token on Robinhood Chain — ClawPump fronts gas & fees. Creator fees route to your payout wallet.
                Requires a sponsored PONS allowance on the agent (contact ClawPump). If ClawPump is temporarily
                unavailable, the API returns 503 and the launch should be retried later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePonsLaunch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pons-agent">ClawPump Agent</Label>
                  {agentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading your agents...
                    </div>
                  ) : myAgents.length === 0 ? (
                    <p className="text-xs text-amber-400">
                      No agents found for your connected key. Create one on the{" "}
                      <a href="/agents" className="underline">Agents page</a> first, then refresh.
                    </p>
                  ) : (
                    <select
                      id="pons-agent"
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={ponsForm.agentId}
                      onChange={(e) => setPonsForm({ ...ponsForm, agentId: e.target.value })}
                    >
                      {myAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} — {a.id} ({a.status})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-zinc-500">
                    Launches only work with agents owned by your connected ClawPump key
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pons-name">Token Name</Label>
                    <Input
                      id="pons-name"
                      placeholder="My Token"
                      value={ponsForm.name}
                      onChange={(e) => setPonsForm({ ...ponsForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pons-symbol">Ticker (max 12)</Label>
                    <Input
                      id="pons-symbol"
                      placeholder="CLAW"
                      value={ponsForm.symbol}
                      onChange={(e) => setPonsForm({ ...ponsForm, symbol: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pons-desc">Description (optional)</Label>
                  <Input
                    id="pons-desc"
                    placeholder="Token description"
                    value={ponsForm.description}
                    onChange={(e) => setPonsForm({ ...ponsForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pons-payout">Payout Address (0x... EVM)</Label>
                  <Input
                    id="pons-payout"
                    placeholder="0x... where creator fees land"
                    value={ponsForm.payoutWallet}
                    onChange={(e) => setPonsForm({ ...ponsForm, payoutWallet: e.target.value })}
                  />
                  <p className="text-xs text-zinc-500">Your Robinhood Chain payout address — where ETH/WETH creator fees land</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pons-logo">Logo URL (optional, https)</Label>
                  <Input
                    id="pons-logo"
                    placeholder="https://..."
                    value={ponsForm.logoUrl}
                    onChange={(e) => setPonsForm({ ...ponsForm, logoUrl: e.target.value })}
                  />
                </div>
                <Button type="submit" variant="ansem" className="w-full" disabled={ponsLoading}>
                  {ponsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Launch Gasless Token <Rocket className="h-4 w-4" /></>}
                </Button>
              </form>

              {ponsError && (
                <div className="mt-4 rounded-md border border-red-800 bg-red-950/30 p-3">
                  <p className="text-sm text-red-400">{ponsError}</p>
                </div>
              )}

              {ponsResult?.launch && (
                <div className="mt-4 space-y-4 rounded-xl border border-amber-700/50 bg-zinc-950 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-zinc-50">{ponsResult.launch.name || ponsForm.name}</p>
                      <p className="text-sm text-zinc-400">
                        {ponsResult.launch.symbol || ponsForm.symbol} · Robinhood Chain (4663)
                      </p>
                    </div>
                    <LaunchStatusBadge status={ponsResult.launch.status} />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {LAUNCH_STEPS.map((step, i) => {
                      const cur = LAUNCH_STEPS.indexOf(ponsResult.launch.status);
                      const done = cur >= i;
                      const isErr = ponsResult.launch.status === "failed" || ponsResult.launch.status === "error";
                    
  async function pbFetchCredentials() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=credentials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load wallets");
      const creds = data.credentials || [];
      setPbCredentials(creds);
      if (creds.length > 0 && !pbSelectedCred) setPbSelectedCred(creds[0].credential_id);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPortfolio() {
    if (!pbSelectedCred) { setPbError("Select a wallet first"); return; }
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch(`/api/paybox?action=portfolio&credentialId=${pbSelectedCred}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load portfolio");
      setPbPortfolio(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchServices() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load services");
      setPbServices(data.services || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbFetchPolicies() {
    setPbLoading(true); setPbError(null);
    try {
      const res = await fetch("/api/paybox?action=policies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      setPbPolicies(data.policies || data || []);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbTransfer() {
    if (!pbSelectedCred || !pbTransfer.to || !pbTransfer.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer", credentialId: pbSelectedCred, to: pbTransfer.to, amount: pbTransfer.amount, tokenMint: pbTransfer.tokenMint }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  async function pbSwap() {
    if (!pbSelectedCred || !pbSwap.srcToken || !pbSwap.dstToken || !pbSwap.amount) { setPbError("Fill all fields"); return; }
    setPbLoading(true); setPbError(null); setPbResult(null);
    try {
      const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "swap", credentialId: pbSelectedCred, srcChain: "solana:mainnet", srcToken: pbSwap.srcToken, dstToken: pbSwap.dstToken, amount: pbSwap.amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Swap failed");
      setPbResult(data);
    } catch (err: any) { setPbError(err.message); }
    setPbLoading(false);
  }

  return (
                        <div key={step} className="flex items-center gap-2">
                          {i > 0 && <span className={`h-px w-6 ${done ? "bg-green-600" : "bg-zinc-700"}`} />}
                          <span className={`flex items-center gap-1 ${isErr ? "text-red-400" : done ? "text-green-400" : "text-zinc-500"}`}>
                            {isErr ? <XCircle className="h-3 w-3" /> : done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                            {step === "soft_confirmed" ? "Soft Confirmed" : step[0].toUpperCase() + step.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500">Launch ID</span>
                      <span className="font-mono text-zinc-300">{shortAddr(ponsResult.launch.id, 10)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500">Transaction</span>
                      <a
                        href={`https://robinhoodchain.blockscout.com/tx/${ponsResult.launch.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-amber-400 underline hover:text-amber-300 flex items-center gap-1"
                      >
                        {shortAddr(ponsResult.launch.txHash, 8)} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500">Token Address</span>
                      {ponsResult.launch.tokenAddress ? (
                        <span className="flex items-center gap-1">
                          <a
                            href={`https://clawpump.tech/tokens/${ponsResult.launch.tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-amber-400 underline hover:text-amber-300"
                          >
                            {shortAddr(ponsResult.launch.tokenAddress, 8)}
                          </a>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(ponsResult.launch.tokenAddress)}
                            className="text-zinc-500 hover:text-amber-400"
                            title="Copy token address"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Minting… check back shortly</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500">Payout Wallet</span>
                      <span className="font-mono text-zinc-300">{shortAddr(ponsResult.launch.payoutWallet, 8)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                      <p className="text-zinc-500">Launch Fee</p>
                      <p className="text-sm font-medium text-zinc-200">{weiToEth(ponsResult.launch.launchFeeWei)} ETH</p>
                    </div>
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                      <p className="text-zinc-500">Sponsorship Cost</p>
                      <p className="text-sm font-medium text-zinc-200">{weiToEth(ponsResult.launch.sponsorshipCostWei)} ETH</p>
                    </div>
                  </div>

                  {ponsResult.launch.splitPolicy && (
                    <div className="text-xs text-zinc-400">
                      Fee split:{" "}
                      <span className="text-green-400">
                        {((ponsResult.launch.splitPolicy.agentGrossBps ?? 0) / 100).toFixed(0)}% to you
                      </span>{" "}
                      · {(ponsResult.launch.splitPolicy.platformGrossBps ?? 0) / 100}% platform ·{" "}
                      {(ponsResult.launch.splitPolicy.ponsGrossBps ?? 0) / 100}% PONS
                    </div>
                  )}

                  {(ponsResult.launch.status === "reserved" || ponsResult.launch.status === "submitted") && (
                    <p className="rounded-md border border-amber-800 bg-amber-950/40 p-2 text-xs text-amber-300">
                      Token is being minted on Robinhood Chain — do NOT re-submit or you will mint a second token.
                      Status updates automatically below.
                    </p>
                  )}
                  {ponsResult.launch.tokenAddress && (
                    <a
                      href={`https://clawpump.tech/tokens/${ponsResult.launch.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ansem" size="sm" className="w-full">
                        View Token on ClawPump <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  )}
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-300">Your PONS Launches</p>
                  {ponsLaunchesLoading && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
                </div>
                {ponsLaunches.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-600">
                    {ponsForm.agentId
                      ? "No launches yet for this agent. Submit the form above to launch your first token."
                      : "Select an agent to see its launch history."}
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {ponsLaunches.map((launch, i) => (
                      <div key={launch.id || i} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200">
                              {launch.symbol || launch.name || "Untitled"}
                              <span className="ml-2 text-xs font-mono text-zinc-500">{shortAddr(launch.id, 8)}</span>
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              {launch.txHash && (
                                <a
                                  href={`https://robinhoodchain.blockscout.com/tx/${launch.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-zinc-400 underline hover:text-amber-400"
                                >
                                  tx {shortAddr(launch.txHash, 6)}
                                </a>
                              )}
                              {launch.tokenAddress ? (
                                <a
                                  href={`https://clawpump.tech/tokens/${launch.tokenAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-amber-400 underline hover:text-amber-300"
                                >
                                  token {shortAddr(launch.tokenAddress, 6)}
                                </a>
                              ) : (
                                <span className="text-zinc-600">token pending</span>
                              )}
                              <span className="text-zinc-600">
                                {launch.createdAt ? new Date(launch.createdAt).toLocaleString() : ""}
                              </span>
                            </div>
                          </div>
                          <LaunchStatusBadge status={launch.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLAW LAUNCH — real ClawPump token launch (gasless / self-funded), mirrors clawpump.tech/dashboard/launch-token */}
        <TabsContent value="claw" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-amber-500" /> ClawLaunch
              </CardTitle>
              <CardDescription>
                Tokenize one of your ClawPump agents on Solana — gasless (sponsored) or self-funded, via your connected ClawPump key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClawLaunchTab />
            </CardContent>
          </Card>

        <TabsContent value="paybox" className="max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-500" /> PayBox Agent
              </CardTitle>
              <CardDescription>
                Connect your PayBox API key in Settings → Accounts, then manage wallets, transfer, swap, and discover services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* PayBox Sub-navigation */}
              <div className="flex gap-2 flex-wrap">
                {(["wallet","transfer","swap","services","policies"] as const).map(v => (
                  <Button key={v} size="sm" variant={pbActiveView === v ? "default" : "outline"} onClick={() => setPbActiveView(v)}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Button>
                ))}
              </div>

              {pbError && (
                <div className="rounded-md border border-red-800 bg-red-950/30 p-3 text-sm text-red-400">{pbError}</div>
              )}

              {/* Wallet View */}
              {pbActiveView === "wallet" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={pbFetchCredentials} disabled={pbLoading}>Load Wallets</Button>
                    {pbSelectedCred && <Button size="sm" variant="outline" onClick={pbFetchPortfolio} disabled={pbLoading}>Refresh Balance</Button>}
                  </div>
                  {pbCredentials.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">Select Wallet</Label>
                      <select className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={pbSelectedCred} onChange={e => { setPbSelectedCred(e.target.value); setPbPortfolio(null); }}>
                        {pbCredentials.map((c: any) => (
                          <option key={c.credential_id} value={c.credential_id}>{c.name || c.kind} — {c.metadata?.address?.slice(0,8)}...</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {pbPortfolio && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                      <p className="text-sm font-medium text-zinc-200">Portfolio — ${pbPortfolio.total_usd?.toFixed(2) || "0.00"} USD</p>
                      {(pbPortfolio.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-zinc-400">
                          <span>{item.symbol || item.token?.slice(0,8)}</span>
                          <span className="font-mono">{Number(item.amount).toFixed(4)} (${item.usd_value?.toFixed(2) || "0"})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Transfer View */}
              {pbActiveView === "transfer" && (
                <div className="space-y-3">
                  <Label className="text-xs text-zinc-400">Send tokens from your PayBox wallet</Label>
                  <Input placeholder="Recipient address" value={pbTransfer.to} onChange={e => setPbTransfer({...pbTransfer, to: e.target.value})} className="font-mono text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Amount" value={pbTransfer.amount} onChange={e => setPbTransfer({...pbTransfer, amount: e.target.value})} />
                    <select className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={pbTransfer.tokenMint} onChange={e => setPbTransfer({...pbTransfer, tokenMint: e.target.value})}>
                      <option value="So11111111111111111111111111111111111111112">SOL</option>
                      <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                      <option value="9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump">$ANSEM</option>
                      <option value="739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump">$CLAW</option>
                    </select>
                  </div>
                  <Button onClick={pbTransfer} disabled={pbLoading || !pbSelectedCred} className="bg-amber-600 hover:bg-amber-700">
                    {pbLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Send Transfer
                  </Button>
                </div>
              )}

              {/* Swap View */}
              {pbActiveView === "swap" && (
                <div className="space-y-3">
                  <Label className="text-xs text-zinc-400">Swap tokens via PayBox</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <select className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={pbSwap.srcToken} onChange={e => setPbSwap({...pbSwap, srcToken: e.target.value})}>
                      <option value="So11111111111111111111111111111111111111112">SOL</option>
                      <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                      <option value="9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump">$ANSEM</option>
                    </select>
                    <Input placeholder="Amount" value={pbSwap.amount} onChange={e => setPbSwap({...pbSwap, amount: e.target.value})} />
                    <select className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={pbSwap.dstToken} onChange={e => setPbSwap({...pbSwap, dstToken: e.target.value})}>
                      <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                      <option value="So11111111111111111111111111111111111111112">SOL</option>
                      <option value="9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump">$ANSEM</option>
                      <option value="739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump">$CLAW</option>
                    </select>
                  </div>
                  <Button onClick={pbSwap} disabled={pbLoading || !pbSelectedCred} className="bg-amber-600 hover:bg-amber-700">
                    {pbLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Execute Swap
                  </Button>
                </div>
              )}

              {/* Services View */}
              {pbActiveView === "services" && (
                <div className="space-y-3">
                  <Button size="sm" onClick={pbFetchServices} disabled={pbLoading}>Discover Services</Button>
                  {pbServices.length > 0 && pbServices.map((s: any, i: number) => (
                    <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <p className="text-sm font-medium text-zinc-200">{s.name || s.id}</p>
                      <p className="text-xs text-zinc-500">{s.description}</p>
                      {s.pricing && <p className="text-xs text-amber-400 mt-1">{s.pricing}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Policies View */}
              {pbActiveView === "policies" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={pbFetchPolicies} disabled={pbLoading}>Load Policies</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      setPbLoading(true); setPbError(null);
                      try {
                        const res = await fetch("/api/paybox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "createAnsemPolicy" }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setPbResult(data); pbFetchPolicies();
                      } catch (err: any) { setPbError(err.message); }
                      setPbLoading(false);
                    }}>Create ANSEM-Only Policy</Button>
                  </div>
                  {pbPolicies.length > 0 && pbPolicies.map((p: any, i: number) => (
                    <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <p className="text-sm font-medium text-zinc-200">{p.name || p.id}</p>
                      <p className="text-xs text-zinc-500">Rules: {JSON.stringify(p.rules || [])}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Result */}
              {pbResult && (
                <div className="rounded-lg border border-green-800 bg-green-950/20 p-4">
                  <p className="text-sm text-green-300 font-medium">Result</p>
                  <pre className="mt-2 text-xs text-zinc-400 overflow-auto max-h-48">{JSON.stringify(pbResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}
