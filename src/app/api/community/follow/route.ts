import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { communityFollows, users } from "@/db/schema";
import { getRequestUser } from "@/lib/auth-session";
import { ensureCommunityTables } from "@/lib/community";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await ensureCommunityTables();
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const followingUserId = String(body.followingUserId || "");
    if (!followingUserId) return NextResponse.json({ error: "followingUserId is required" }, { status: 400 });
    if (followingUserId === user.id) {
      return NextResponse.json({ error: "You cannot follow your own account" }, { status: 400 });
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, followingUserId)).limit(1);
    if (!target) return NextResponse.json({ error: "AnsemRail agent not found" }, { status: 404 });

    const [existing] = await db
      .select()
      .from(communityFollows)
      .where(and(eq(communityFollows.followerUserId, user.id), eq(communityFollows.followingUserId, followingUserId)))
      .limit(1);

    if (existing) {
      await db.delete(communityFollows).where(
        and(eq(communityFollows.followerUserId, user.id), eq(communityFollows.followingUserId, followingUserId))
      );
    } else {
      await db.insert(communityFollows).values({ followerUserId: user.id, followingUserId });
    }

    const [followers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityFollows)
      .where(eq(communityFollows.followingUserId, followingUserId));
    const [following] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityFollows)
      .where(eq(communityFollows.followerUserId, followingUserId));

    return NextResponse.json({
      following: !existing,
      followerCount: followers.count,
      followingCount: following.count,
      message: !existing ? "Followed AnsemRail agent." : "Unfollowed AnsemRail agent.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to toggle follow" }, { status: 500 });
  }
}
