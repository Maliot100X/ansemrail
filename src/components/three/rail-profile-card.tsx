import { Bot, Shield, Wallet, Zap } from "lucide-react";
import { AnsemOrb } from "@/components/three/ansem-orb";

const rails = [
  { label: "ClawPump", icon: Bot, detail: "Agents · Launches · Perps" },
  { label: "MoonPay", icon: Wallet, detail: "Wallets · Fiat · Swaps" },
  { label: "Open Wallet Std", icon: Shield, detail: "Vault · Policies · OWS" },
  { label: "Ansem Signals", icon: Zap, detail: "$ANSEM · Bull Feed" },
];

export function RailProfileCard() {
  return (
    <div className="rail-card group relative h-[480px] overflow-hidden rounded-[1.75rem] sm:h-[560px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/20 blur-[100px] transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="absolute inset-0 p-2 opacity-40">
        <div className="rail-pulse-ring absolute inset-10 rounded-full border border-amber-300/20" />
        <div className="rail-pulse-ring absolute inset-16 rounded-full border border-cyan-300/10 [animation-delay:1.2s]" />
      </div>

      <div className="absolute inset-0">
        <AnsemOrb />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">
            AnsemRail
          </div>
          <div className="mt-1 text-sm text-zinc-400">3D Agentic Control Plane</div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
          Live Rail
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
        <div className="grid grid-cols-2 gap-3">
          {rails.map((rail) => (
            <div
              key={rail.label}
              className="rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-md transition-colors duration-300 hover:border-amber-300/30"
            >
              <rail.icon className="h-4 w-4 text-amber-300" />
              <p className="mt-2 text-xs font-semibold text-zinc-100">{rail.label}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-zinc-400">{rail.detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Rail Status</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-100">
            Human + Agent dispatch ready
          </p>
        </div>
      </div>
    </div>
  );
}
