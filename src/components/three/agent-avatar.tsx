"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { AnsemOrb } from "@/components/three/ansem-orb";
import { agentPalette } from "@/lib/agent-seed";

const AgentAvatar3D = dynamic(
  () => import("@/components/three/agent-avatar-3d").then((m) => m.AgentAvatar3D),
  {
    ssr: false,
    loading: () => null,
  },
);

const LIVE_KEYS = ["running", "active", "online", "live"];
const BOOT_KEYS = ["starting", "pending", "booting", "loading"];
const OFF_KEYS = ["stopped", "stop", "offline", "error", "failed", "fail"];

function statusLabel(status?: string): string | null {
  const s = (status || "").toLowerCase();
  if (LIVE_KEYS.some((key) => s.includes(key))) return "Live";
  if (BOOT_KEYS.some((key) => s.includes(key))) return "Booting";
  if (OFF_KEYS.some((key) => s.includes(key))) return "Offline";
  return status || null;
}

export function AgentAvatar({
  seed,
  status,
  name,
  className = "",
  showStatus = true,
  bare = false,
}: {
  seed: string;
  status?: string;
  name?: string;
  className?: string;
  showStatus?: boolean;
  bare?: boolean;
}) {
  const palette = agentPalette(seed || "ansem", status);
  const label = showStatus ? statusLabel(status) : null;
  const frame = bare
    ? "relative overflow-hidden"
    : "relative overflow-hidden rounded-2xl border border-white/10 bg-black/30";

  return (
    <div className={`${frame} ${className}`}>
      <div aria-hidden className="rail-avatar-bg pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="rail-avatar-glow pointer-events-none absolute inset-[10%]"
        style={{ "--avatar-glow": palette.glow } as CSSProperties}
      />
      <AnsemOrb
        seed={seed}
        status={status}
        animate={false}
        interactive={false}
        label=""
        className="absolute inset-0 opacity-60"
      />
      <AgentAvatar3D seed={seed} status={status} />
      {label ? (
        <span
          className="rail-avatar-status"
          style={{ "--avatar-glow": palette.glow } as CSSProperties}
        >
          <span className="dot" />
          {label}
        </span>
      ) : null}
      {name ? <span className="sr-only">{name} avatar</span> : null}
    </div>
  );
}
