/**
 * Deterministic per-agent visual seeding for the rail profile/leaderboard UI.
 * Pure functions only — never touches data, APIs, or logic.
 */

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const RAIL_HUES = [41, 28, 188, 155, 4, 205] as const;

export function statusHue(status?: string): number {
  const s = (status || "").toLowerCase();
  if (s.includes("run") || s.includes("active") || s.includes("online")) return 155;
  if (s.includes("stop") || s.includes("error") || s.includes("offline") || s.includes("fail")) return 4;
  if (s.includes("start") || s.includes("pending") || s.includes("loading")) return 188;
  return 41;
}

export interface AgentPalette {
  primary: string;
  secondary: string;
  glow: string;
  speed: number;
  ringCount: number;
  accentHue: number;
  statusHue: number;
}

export function agentPalette(seed: string, status?: string): AgentPalette {
  const h = hashString(seed || "ansem");
  const accentHue = RAIL_HUES[Math.floor(h * RAIL_HUES.length) % RAIL_HUES.length];
  const hue = statusHue(status);
  const speed = 0.75 + h * 0.7;
  const ringCount = 3 + Math.floor(h * 3);
  return {
    primary: `hsl(${accentHue} 92% 62%)`,
    secondary: `hsl(${(accentHue + (h > 0.5 ? 42 : -36) + 360) % 360} 90% 68%)`,
    glow: `hsl(${hue} 95% 60%)`,
    speed,
    ringCount,
    accentHue,
    statusHue: hue,
  };
}

export function seededRandom(seed: string): () => number {
  return mulberry32(Math.floor(hashString(seed) * 4294967296));
}
