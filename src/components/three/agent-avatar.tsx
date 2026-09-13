"use client";

import dynamic from "next/dynamic";
import { AnsemOrb } from "@/components/three/ansem-orb";

const AgentAvatar3D = dynamic(
  () => import("@/components/three/agent-avatar-3d").then((m) => m.AgentAvatar3D),
  {
    ssr: false,
    loading: () => null,
  },
);

export function AgentAvatar({
  seed,
  status,
  name,
  className = "",
}: {
  seed: string;
  status?: string;
  name?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 ${className}`}
    >
      <div
        aria-hidden
        className="rail-avatar-bg pointer-events-none absolute inset-0"
      />
      <AnsemOrb
        seed={seed}
        status={status}
        animate={false}
        interactive={false}
        label=""
        className="absolute inset-0 opacity-70"
      />
      <AgentAvatar3D seed={seed} status={status} />
      {name ? <span className="sr-only">{name} avatar</span> : null}
    </div>
  );
}
