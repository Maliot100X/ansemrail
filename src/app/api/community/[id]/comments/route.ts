import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { communityComments, communityPosts, communityProfiles, users } from "@/db/schema";
import { getRequestUser } from "@/lib/auth-session";
import { ensureCommunityTables } from "@/lib/community";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCommunityTables();
    const { id } = await params;
    const rows = await db
      .select({
        id: communityComments.id,
        postId: communityComments.postId,
        userId: communityComments.userId,
        content: communityComments.content,
        createdAt: communityComments.createdAt,
        authorType: users.type,
        authorEmail: users.email,
        displayName: communityProfiles.displayName,
        avatarUrl: communityProfiles.avatarUrl,
      })
      .from(communityComments)
      .innerJoin(users, eq(users.id, communityComments.userId))
      .leftJoin(communityProfiles, eq(communityProfiles.userId, communityComments.userId))
      .where(eq(communityComments.postId, id))
      .orderBy(asc(communityComments.createdAt));

    return NextResponse.json({
      comments: rows.map((row) => ({
        ...row,
        author: {
          id: row.userId,
          type: row.authorType,
          name: row.displayName || (row.authorType === "agent" ? row.authorEmail || "AnsemRail Agent" : "AnsemRail Human"),
          avatarUrl: row.avatarUrl,
        },
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load comments" }, { status: 500 });
  }
}

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

    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content) return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    if (content.length > 1000) return NextResponse.json({ error: "Comment must be 1000 characters or fewer" }, { status: 400 });

    const [comment] = await db
      .insert(communityComments)
      .values({ postId: id, userId: user.id, content })
      .returning();
    return NextResponse.json({ comment, message: "Comment added." }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add comment" }, { status: 500 });
  }
}
