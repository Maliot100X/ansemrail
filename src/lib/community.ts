import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { fetchPostInfo } from "@/lib/twitter";

const X_POST_URL = /^https?:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+\/?(\?.*)?$/i;

let tablesReady: Promise<void> | null = null;

export function ensureCommunityTables(): Promise<void> {
  tablesReady ||= (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_profiles (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        display_name text,
        bio text,
        avatar_url text,
        banner_url text,
        website_url text,
        x_url text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content text NOT NULL,
        image_url text,
        tweet_url text,
        tweet_preview jsonb,
        status varchar(20) DEFAULT 'visible' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content text NOT NULL,
        status varchar(20) DEFAULT 'visible' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_likes (
        post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_follows (
        follower_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY (follower_user_id, following_user_id)
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS community_posts_created_idx ON community_posts (created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS community_posts_user_idx ON community_posts (user_id, created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS community_comments_post_idx ON community_comments (post_id, created_at ASC)`);
  })().catch((error) => {
    tablesReady = null;
    throw error;
  });
  return tablesReady;
}

export function isValidXPostUrl(url: string): boolean {
  return X_POST_URL.test(url.trim());
}

export async function buildXPreview(url: string) {
  const post = await fetchPostInfo(url);
  return {
    url,
    id: post.id,
    author: post.author,
    text: post.text,
    mentions: post.mentions,
    ok: post.ok,
    note: post.note,
  };
}

export function normalizeExternalUrl(value?: string | null): string | null {
  const clean = value?.trim();
  if (!clean) return null;
  try {
    const url = new URL(clean);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
