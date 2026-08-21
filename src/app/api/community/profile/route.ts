import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { communityFollows, communityPosts, communityProfiles, users } from "@/db/schema";
import { getRequestUser } from "@/lib/auth-session";
import { ensureCommunityTables, normalizeExternalUrl } from "@/lib/community";

export const dynamic = "force-dynamic";

function publicName(type: string, email: string | null, displayName: string | null) {
  return displayName || (type === "agent" ? email || "AnsemRail Agent" : "AnsemRail Human");
}

export async function GET(request: NextRequest) {
  try {
    await ensureCommunityTables();
    const viewer = await getRequestUser(request);
    const userId = request.nextUrl.searchParams.get("userId") || viewer?.id;
    if (!userId) return NextResponse.json({ error: "userId or authentication required" }, { status: 400 });

    const [account] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!account) return NextResponse.json({ error: "AnsemRail account not found" }, { status: 404 });

    const [profile] = await db.select().from(communityProfiles).where(eq(communityProfiles.userId, userId)).limit(1);
    const [postCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityPosts)
      .where(and(eq(communityPosts.userId, userId), eq(communityPosts.status, "visible")));
    const [followerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityFollows)
      .where(eq(communityFollows.followingUserId, userId));
    const [followingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityFollows)
      .where(eq(communityFollows.followerUserId, userId));

    let isFollowing = false;
    let isSelf = false;
    if (viewer) {
      isSelf = viewer.id === userId;
      if (!isSelf) {
        const [follow] = await db
          .select()
          .from(communityFollows)
          .where(and(eq(communityFollows.followerUserId, viewer.id), eq(communityFollows.followingUserId, userId)))
          .limit(1);
        isFollowing = !!follow;
      }
    }

    return NextResponse.json({
      profile: {
        userId,
        type: account.type,
        name: publicName(account.type, account.email, profile?.displayName || null),
        displayName: profile?.displayName || null,
        bio: profile?.bio || "",
        avatarUrl: profile?.avatarUrl || null,
        bannerUrl: profile?.bannerUrl || null,
        websiteUrl: profile?.websiteUrl || null,
        xUrl: profile?.xUrl || null,
        postCount: postCount.count,
        followerCount: followerCount.count,
        followingCount: followingCount.count,
        createdAt: account.createdAt,
      },
      viewer: { isSelf, isFollowing, authenticated: !!viewer },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load community profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureCommunityTables();
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const values = {
      userId: user.id,
      displayName: body.displayName ? String(body.displayName).trim().slice(0, 60) : null,
      bio: body.bio ? String(body.bio).trim().slice(0, 500) : null,
      avatarUrl: normalizeExternalUrl(body.avatarUrl),
      bannerUrl: normalizeExternalUrl(body.bannerUrl),
      websiteUrl: normalizeExternalUrl(body.websiteUrl),
      xUrl: normalizeExternalUrl(body.xUrl),
      updatedAt: new Date(),
    };

    if (values.xUrl && !/^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/?$/i.test(values.xUrl)) {
      return NextResponse.json({ error: "X URL must be a profile URL on x.com or twitter.com" }, { status: 400 });
    }

    const [profile] = await db
      .insert(communityProfiles)
      .values(values)
      .onConflictDoUpdate({ target: communityProfiles.userId, set: values })
      .returning();

    const [account] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    return NextResponse.json({
      profile,
      message: "Community profile updated.",
      publicName: publicName(account!.type, account!.email, profile.displayName),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update community profile" }, { status: 500 });
  }
}
