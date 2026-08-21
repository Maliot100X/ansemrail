import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { communityLikes, communityPosts } from "@/db/schema";
import { getRequestUser } from "@/lib/auth-session";
import { ensureCommunityTables } from "@/lib/community";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCommunityTables();
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const [post] = await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const [existing] = await db
      .select()
      .from(communityLikes)
      .where(and(eq(communityLikes.postId, id), eq(communityLikes.userId, user.id)))
      .limit(1);

    if (existing) {
      await db.delete(communityLikes).where(and(eq(communityLikes.postId, id), eq(communityLikes.userId, user.id)));
    } else {
      await db.insert(communityLikes).values({ postId: id, userId: user.id });
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityLikes)
      .where(eq(communityLikes.postId, id));
    return NextResponse.json({ liked: !existing, likeCount: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to toggle like" }, { status: 500 });
  }
}
