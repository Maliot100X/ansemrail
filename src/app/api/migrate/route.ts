import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_code text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_expiry timestamp`);

    // Reward system tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reward_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        title text NOT NULL,
        description text NOT NULL,
        type text NOT NULL,
        reward_token text NOT NULL DEFAULT 'ANSEM',
        reward_amount text NOT NULL,
        proof_json jsonb,
        active boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reward_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id),
        task_id uuid REFERENCES reward_tasks(id),
        proof_url text,
        proof_wallet text,
        proof_hash text NOT NULL UNIQUE,
        status text NOT NULL DEFAULT 'pending',
        verified_by text,
        verified_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`ALTER TABLE reward_submissions ADD COLUMN IF NOT EXISTS proof_username text`);
    await db.execute(sql`ALTER TABLE reward_submissions ADD COLUMN IF NOT EXISTS proof_agent_id text`);
    await db.execute(sql`ALTER TABLE reward_submissions ADD COLUMN IF NOT EXISTS admin_note text`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reward_payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id uuid REFERENCES reward_submissions(id) NOT NULL UNIQUE,
        user_id uuid REFERENCES users(id),
        task_id uuid REFERENCES reward_tasks(id),
        token text NOT NULL,
        amount text NOT NULL,
        tx_signature text,
        status text NOT NULL DEFAULT 'paid',
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_config (
        key text PRIMARY KEY,
        value jsonb,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `);

    // Seed tasks (idempotent)
    const tasks = [
      {
        slug: "x-follow-clawrenai",
        title: "Follow @CLAWRENAi on X",
        description: "Follow our project account https://x.com/CLAWRENAi and submit your profile/post link as proof.",
        type: "twitter_follow",
        rewardToken: "ANSEM",
        rewardAmount: "10",
        proofJson: JSON.stringify({ handle: "CLAWRENAi" }),
        sortOrder: 1,
      },
      {
        slug: "x-like-pinned",
        title: "Like the pinned post on @CLAWRENAi",
        description: "Like our latest pinned post on https://x.com/CLAWRENAi and submit the post link as proof.",
        type: "twitter_like",
        rewardToken: "ANSEM",
        rewardAmount: "10",
        proofJson: JSON.stringify({ handle: "CLAWRENAi", pinned: true }),
        sortOrder: 2,
      },
      {
        slug: "x-comment-pinned",
        title: "Comment on @CLAWRENAi pinned post",
        description: "Comment on the pinned post and tag @clawpumptech and @blknoiz06. Submit the post link as proof.",
        type: "twitter_comment",
        rewardToken: "ANSEM",
        rewardAmount: "20",
        proofJson: JSON.stringify({ handle: "CLAWRENAi", mention: "clawpumptech blknoiz06" }),
        sortOrder: 3,
      },
      {
        slug: "x-post-ansemrail",
        title: "Post about AnsemRail",
        description:
          "Post about AnsemRail on X (example: buy our coin, tag @CLAWRENAi) and submit the post link as proof. Reward goes to @blknoiz06 / @clawpumptech ecosystem posts.",
        type: "twitter_post",
        rewardToken: "ANSEM",
        rewardAmount: "50",
        proofJson: JSON.stringify({ handle: "CLAWRENAi" }),
        sortOrder: 4,
      },
      {
        slug: "buy-coin-1",
        title: "Buy $1 of the AnsemRail coin",
        description:
          "Buy $1+ of CLAWRENA (7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene). Submit the Solana wallet you used as proof of holding — verified on-chain automatically.",
        type: "buy_coin",
        rewardToken: "ANSEM",
        rewardAmount: "100",
        proofJson: JSON.stringify({
          mint: "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene",
          minUsd: 1,
          minBalance: "230000000000",
          refPrice: 0.000004332,
        }),
        sortOrder: 5,
      },
      {
        slug: "buy-coin-5",
        title: "Buy $5 of the AnsemRail coin",
        description:
          "Buy $5+ of CLAWRENA (7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene). Submit the Solana wallet you used as proof of holding — verified on-chain automatically.",
        type: "buy_coin",
        rewardToken: "ANSEM",
        rewardAmount: "500",
        proofJson: JSON.stringify({
          mint: "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene",
          minUsd: 5,
          minBalance: "1150000000000",
          refPrice: 0.000004332,
        }),
        sortOrder: 6,
      },
      {
        slug: "buy-coin-10",
        title: "Buy $10 of the AnsemRail coin",
        description:
          "Buy $10+ of CLAWRENA (7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene). Submit the Solana wallet you used as proof of holding — verified on-chain automatically.",
        type: "buy_coin",
        rewardToken: "ANSEM",
        rewardAmount: "1000",
        proofJson: JSON.stringify({
          mint: "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene",
          minUsd: 10,
          minBalance: "2300000000000",
          refPrice: 0.000004332,
        }),
        sortOrder: 7,
      },
      {
        slug: "teach-clawpump",
        title: "ClawPump teach / help task",
        description:
          "Complete a ClawPump teach/help task (help a new user launch or trade via ClawPump). Submit proof link. Rewarded in $CLAW from the treasury.",
        type: "teach",
        rewardToken: "CLAW",
        rewardAmount: "25",
        proofJson: JSON.stringify({}),
        sortOrder: 8,
      },
      {
        slug: "project-token-double",
        title: "Double reward — CLAWRENA task",
        description:
          "Extra task rewarded directly in our project token CLAWRENA. Hold, trade, or share the coin and submit proof — paid from the treasury in project tokens.",
        type: "custom",
        rewardToken: "PROJECT",
        rewardAmount: "500000",
        proofJson: JSON.stringify({ mint: "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene" }),
        sortOrder: 9,
      },
    ];

    for (const t of tasks) {
      await db.execute(sql`
        INSERT INTO reward_tasks (slug, title, description, type, reward_token, reward_amount, proof_json, sort_order)
        VALUES (${t.slug}, ${t.title}, ${t.description}, ${t.type}, ${t.rewardToken}, ${t.rewardAmount}, ${t.proofJson}::jsonb, ${t.sortOrder})
        ON CONFLICT (slug) DO NOTHING
      `);
    }

    // Support create-new-tables action via GET for easy migration
    const action = request.nextUrl.searchParams.get("action");
    if (action === "create-new-tables") {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS x402_payments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id),
          payer_address text NOT NULL,
          payee_address text,
          amount text NOT NULL,
          token text NOT NULL DEFAULT 'SOL',
          endpoint text NOT NULL,
          tx_signature text,
          status text NOT NULL DEFAULT 'pending',
          metadata jsonb,
          created_at timestamp DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS bounties (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_user_id uuid REFERENCES users(id),
          creator_agent_id text,
          title text NOT NULL,
          description text NOT NULL,
          reward_token text NOT NULL DEFAULT 'ANSEM',
          reward_amount text NOT NULL,
          escrow_wallet text,
          status text NOT NULL DEFAULT 'open',
          assignee_user_id uuid REFERENCES users(id),
          deliverable text,
          proof_url text,
          deadline timestamp,
          created_at timestamp DEFAULT NOW() NOT NULL,
          updated_at timestamp DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS agent_reputation (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id) NOT NULL,
          trust_tier text NOT NULL DEFAULT 'unrated',
          reputation_score integer NOT NULL DEFAULT 0,
          total_trades integer NOT NULL DEFAULT 0,
          successful_trades integer NOT NULL DEFAULT 0,
          total_launches integer NOT NULL DEFAULT 0,
          total_bounties integer NOT NULL DEFAULT 0,
          completed_bounties integer NOT NULL DEFAULT 0,
          twitter_verified boolean NOT NULL DEFAULT false,
          agent_8004_id text,
          last_activity_at timestamp,
          created_at timestamp DEFAULT NOW() NOT NULL,
          updated_at timestamp DEFAULT NOW() NOT NULL
        )
      `);
      return NextResponse.json({ ok: true, message: "Created x402_payments, bounties, agent_reputation tables" });
    }

    return NextResponse.json({
      ok: true,
      message: "Migration complete — reward tables created and tasks seeded.",
      tasks: tasks.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "fix-twitter-handles") {
      await db.execute(sql`
        UPDATE users SET encrypted_keys = jsonb_set(
          encrypted_keys,
          '{twitterHandle}',
          '"@CLAWRENAi"'
        )
        WHERE (encrypted_keys->>'twitterHandle') = '@i'
        OR (encrypted_keys->>'twitterHandle') = 'i'
      `);
      return NextResponse.json({ fixed: true, message: "Fixed handles set to @CLAWRENAi" });
    }


    if (action === "create-new-tables") {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS x402_payments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id),
          payer_address text NOT NULL,
          payee_address text,
          amount text NOT NULL,
          token text NOT NULL DEFAULT 'SOL',
          endpoint text NOT NULL,
          tx_signature text,
          status text NOT NULL DEFAULT 'pending',
          metadata jsonb,
          created_at timestamp DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS bounties (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_user_id uuid REFERENCES users(id),
          creator_agent_id text,
          title text NOT NULL,
          description text NOT NULL,
          reward_token text NOT NULL DEFAULT 'ANSEM',
          reward_amount text NOT NULL,
          escrow_wallet text,
          status text NOT NULL DEFAULT 'open',
          assignee_user_id uuid REFERENCES users(id),
          deliverable text,
          proof_url text,
          deadline timestamp,
          created_at timestamp DEFAULT NOW() NOT NULL,
          updated_at timestamp DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS agent_reputation (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id) NOT NULL,
          trust_tier text NOT NULL DEFAULT 'unrated',
          reputation_score integer NOT NULL DEFAULT 0,
          total_trades integer NOT NULL DEFAULT 0,
          successful_trades integer NOT NULL DEFAULT 0,
          total_launches integer NOT NULL DEFAULT 0,
          total_bounties integer NOT NULL DEFAULT 0,
          completed_bounties integer NOT NULL DEFAULT 0,
          twitter_verified boolean NOT NULL DEFAULT false,
          agent_8004_id text,
          last_activity_at timestamp,
          created_at timestamp DEFAULT NOW() NOT NULL,
          updated_at timestamp DEFAULT NOW() NOT NULL
        )
      `);
      return NextResponse.json({ fixed: true, message: "Created x402_payments, bounties, agent_reputation tables" });
    }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
