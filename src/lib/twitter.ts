import { db } from "@/db/client";
import { platformConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PROJECT_HANDLE = "CLAWRENAi";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function bearerToken(): string | null {
  return process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN || null;
}

async function xApi<T>(path: string): Promise<T | null> {
  const token = bearerToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.twitter.com/2/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export interface ProfileInfo {
  ok: boolean;
  handle: string | null;
  note: string;
}

export async function fetchProfileInfo(username: string): Promise<ProfileInfo> {
  const clean = username.replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(clean)) {
    return { ok: false, handle: null, note: "Invalid X username." };
  }
  const html = await fetchPageHtml(`https://x.com/${clean}`);
  if (!html) {
    return { ok: false, handle: null, note: "Could not fetch the X profile (X may be blocking). Manual review required." };
  }
  const canon =
    html.match(/<link rel="canonical" href="https:\/\/x\.com\/([A-Za-z0-9_]+)"\/?>/i) ||
    html.match(/<meta property="og:url" content="https:\/\/x\.com\/([A-Za-z0-9_]+)"\/?>/i);
  const found = canon ? canon[1] : null;
  if (found && found.toLowerCase() === clean.toLowerCase()) {
    return { ok: true, handle: found, note: "Profile exists and matches the submitted username." };
  }
  if (!found && html.toLowerCase().includes(`x.com/${clean.toLowerCase()}`)) {
    return { ok: true, handle: clean, note: "Profile page loaded — account exists." };
  }
  return { ok: false, handle: null, note: "Profile not found on X — check the username and try again." };
}

export async function fetchPinnedPost(handle: string): Promise<{ url: string; id: string; source: string } | null> {
  const html = await fetchPageHtml(`https://x.com/${handle}`);
  if (!html) return null;
  const ids = Array.from(html.matchAll(/https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/(\d+)/g)).map((m) => m[1]);
  if (!ids.length) return null;
  return { url: `https://x.com/${handle}/status/${ids[0]}`, id: ids[0], source: "live" };
}

export async function getPinnedPostCached(): Promise<{ url: string; id: string; source: string } | null> {
  const override = process.env.PINNED_POST_URL;
  if (override) {
    const id = override.match(/status\/(\d+)/)?.[1] || "";
    return { url: override, id, source: "env" };
  }
  try {
    const [row] = await db.select().from(platformConfig).where(eq(platformConfig.key, "pinned_post")).limit(1);
    const v = (row?.value as any) || {};
    if (v.url && v.updatedAt && Date.now() - new Date(v.updatedAt).getTime() < 6 * 3600 * 1000) {
      return { url: v.url, id: v.id || "", source: "cache" };
    }
  } catch {
    // ignore
  }
  const live = await fetchPinnedPost(PROJECT_HANDLE);
  if (live) {
    try {
      await db
        .insert(platformConfig)
        .values({ key: "pinned_post", value: { url: live.url, id: live.id, updatedAt: new Date().toISOString() } })
        .onConflictDoUpdate({
          target: platformConfig.key,
          set: { value: { url: live.url, id: live.id, updatedAt: new Date().toISOString() } },
        });
    } catch {
      // ignore
    }
  }
  return live;
}

export interface PostInfo {
  ok: boolean;
  id: string | null;
  author: string | null;
  text: string | null;
  mentions: string[];
  note: string;
}

export async function fetchPostInfo(url: string): Promise<PostInfo> {
  const m = url.match(/https?:\/\/(x\.com|twitter\.com)\/([A-Za-z0-9_]+)\/status\/(\d+)/i);
  if (!m) {
    return { ok: false, id: null, author: null, text: null, mentions: [], note: "Invalid X post link — must be a x.com/twitter.com status URL." };
  }
  const author = m[2];
  const id = m[3];
  const html = await fetchPageHtml(url);
  if (!html) {
    return { ok: false, id, author, text: null, mentions: [], note: "Could not fetch the post (X may be blocking). Manual review required." };
  }
  const desc = html.match(/<meta name="description" content="([^"]{0,500})"/i)?.[1] || "";
  const text = desc.replace(/<[^>]+>/g, "").trim();
  const mentions = Array.from(new Set(Array.from(text.matchAll(/@([A-Za-z0-9_]+)/g)).map((x) => x[1])));
  return {
    ok: desc.length > 0,
    id,
    author,
    text: text.slice(0, 500),
    mentions,
    note: desc.length > 0 ? "Post found on X." : "Post page loaded but the text could not be read — manual review required.",
  };
}

export interface VerificationResult {
  ok: boolean;
  auto: boolean;
  method: string;
  note: string;
  detail?: any;
}

// Follow verification: real follower-list check via X API when a bearer token is
// configured; without one we confirm the account exists and leave follow approval to admin.
export async function verifyFollow(username: string, handle: string): Promise<VerificationResult> {
  const clean = username.replace(/^@/, "").trim();
  if (bearerToken()) {
    const user = await xApi<{ data?: { id: string; username: string } }>(
      `users/by/username/${encodeURIComponent(clean)}`
    );
    if (!user?.data) {
      return { ok: false, auto: false, method: "x-api", note: "X API: username not found." };
    }
    const project = await xApi<{ data?: { id: string; username: string } }>(
      `users/by/username/${encodeURIComponent(handle)}`
    );
    if (!project?.data) {
      return { ok: false, auto: false, method: "x-api", note: "X API: project account not found." };
    }
    let token: string | undefined;
    for (let i = 0; i < 20; i++) {
      const q = `users/${project.data.id}/followers?max_results=1000${token ? `&pagination_token=${token}` : ""}`;
      const page = await xApi<{ data?: { id: string }[]; meta?: { next_token?: string } }>(q);
      const ids = (page?.data || []).map((f) => f.id);
      if (ids.includes(user.data.id)) {
        return { ok: true, auto: true, method: "x-api", note: `@${clean} is a confirmed follower of @${handle}.` };
      }
      token = page?.meta?.next_token;
      if (!token) break;
    }
    return { ok: false, auto: false, method: "x-api", note: `X API checked followers of @${handle} — @${clean} was not found following.` };
  }
  const profile = await fetchProfileInfo(clean);
  if (!profile.ok) return { ok: false, auto: false, method: "public", note: profile.note };
  return {
    ok: true,
    auto: false,
    method: "public",
    note: `Profile @${profile.handle} confirmed. Follow relation needs admin review (add X_BEARER_TOKEN for auto-verify).`,
    detail: { handle: profile.handle },
  };
}

// Post verification for like/comment/post tasks.
export async function verifyPost(
  url: string,
  opts: { requireMention?: boolean; mention?: string; authorMustBe?: string }
): Promise<VerificationResult> {
  const post = await fetchPostInfo(url);
  if (!post.ok) return { ok: false, auto: false, method: "public", note: post.note };
  const mentionNeedle = (opts.mention || PROJECT_HANDLE).toLowerCase();
  const hasMention = post.mentions.some((mh) => mh.toLowerCase() === mentionNeedle) ||
    (post.text || "").toLowerCase().includes(`@${mentionNeedle}`);
  if (opts.requireMention && !hasMention) {
    return {
      ok: false,
      auto: false,
      method: "public",
      note: `Post exists but does not mention @${opts.mention || PROJECT_HANDLE}.`,
      detail: post,
    };
  }
  if (opts.authorMustBe && post.author && post.author.toLowerCase() !== opts.authorMustBe.toLowerCase()) {
    return {
      ok: false,
      auto: false,
      method: "public",
      note: `Post is by @${post.author}, not @${opts.authorMustBe}.`,
      detail: post,
    };
  }
  return {
    ok: true,
    auto: !opts.requireMention || hasMention,
    method: "public",
    note: hasMention
      ? "Post is live and references @CLAWRENAi."
      : "Post is live on X.",
    detail: post,
  };
}
