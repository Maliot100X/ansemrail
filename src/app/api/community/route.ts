import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  communityComments,
  communityLikes,
  communityProfiles,
  communityPosts,
  users,
} from "@/db/schema";
import { getRequestUser } from "@/lib/auth-session";
import {
  buildXPreview,
  ensureCommunityTables,
  isValidXPostUrl,
  normalizeExternalUrl,
} from "@/lib/community";

export const dynamic = "force-dynamic";

const UPLOAD_PATH = /^\/api\/upload\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LoadOptions = {
  viewerId?: string;
  authorId?: string;
  postId?: string;
  limit?: number;
};

async function loadPosts(options: LoadOptions = {}) {
  const limit = Math.min(Math.max(options.limit || 50, 1), 100);
  const filters = [eq(communityPosts.status, "visible")];
  if (options.authorId) filters.push(eq(communityPosts.userId, options.authorId));
  if (options.postId) filters.push(eq(communityPosts.id, options.postId));

  const rows = await db
    .select({
      id: communityPosts.id,
      userId: communityPosts.userId,
      content: communityPosts.content,
      imageUrl: communityPosts.imageUrl,
      tweetUrl: communityPosts.tweetUrl,
      tweetPreview: communityPosts.tweetPreview,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      authorType: users.type,
      authorEmail: users.email,
      displayName: communityProfiles.displayName,
      bio: communityProfiles.bio,
      avatarUrl: communityProfiles.avatarUrl,
      bannerUrl: communityProfiles.bannerUrl,
      websiteUrl: communityProfiles.websiteUrl,
      xUrl: communityProfiles.xUrl,
      likeCount: sql<number>`(select count(*)::int from community_likes where post_id = ${communityPosts.id})`,
      commentCount: sql<number>`(select count(*)::int from community_comments where post_id = ${communityPosts.id} and status = 'visible')`,
      followedByMe: sql<boolean>`exists (select 1 from community_follows where follower_user_id = ${options.viewerId || null} and following_user_id = ${communityPosts.userId})`,
    })
    .from(communityPosts)
    .innerJoin(users, eq(users.id, communityPosts.userId))
    .leftJoin(communityProfiles, eq(communityProfiles.userId, communityPosts.userId))
    .where(and(...filters))
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit);

  const postIds = rows.map((row) => row.id);
  const likedByMe = new Set(
    options.viewerId && postIds.length
      ? (
          await db
            .select({ postId: communityLikes.postId })
            .from(communityLikes)
            .where(and(eq(communityLikes.userId, options.viewerId), inArray(communityLikes.postId, postIds)))
        ).map((row) => row.postId)
      : []
  );

  const comments = postIds.length
    ? await db
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
        .where(inArray(communityComments.postId, postIds))
        .orderBy(desc(communityComments.createdAt))
    : [];

  return rows.map((row) => ({
    ...row,
    likedByMe: likedByMe.has(row.id),
    followedByMe: !!row.followedByMe,
    author: {
      id: row.userId,
      type: row.authorType,
      name: row.displayName || (row.authorType === "agent" ? row.authorEmail || "AnsemRail Agent" : "AnsemRail Human"),
      bio: row.bio,
      avatarUrl: row.avatarUrl,
      bannerUrl: row.bannerUrl,
      websiteUrl: row.websiteUrl,
      xUrl: row.xUrl,
    },
    comments: comments
      .filter((comment) => comment.postId === row.id)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.userId,
          type: comment.authorType,
          name: comment.displayName || (comment.authorType === "agent" ? comment.authorEmail || "AnsemRail Agent" : "AnsemRail Human"),
          avatarUrl: comment.avatarUrl,
        },
      })),
  }));
}

export async function GET(request: NextRequest) {
  try {
    await ensureCommunityTables();
    const viewer = await getRequestUser(request);
    const params = request.nextUrl.searchParams;
    const posts = await loadPosts({
      viewerId: viewer?.id,
      authorId: params.get("userId") || undefined,
      postId: params.get("postId") || undefined,
      limit: Number(params.get("limit") || 50),
    });
    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load community" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCommunityTables();
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content) return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: "Post must be 2000 characters or fewer" }, { status: 400 });

    const rawImage = String(body.imageUrl || "").trim();
    let imageUrl: string | null = null;
    if (rawImage) {
      if (UPLOAD_PATH.test(rawImage)) {
        imageUrl = rawImage;
      } else {
        imageUrl = normalizeExternalUrl(rawImage);
        if (!imageUrl) return NextResponse.json({ error: "Image URL must be HTTPS" }, { status: 400 });
      }
    }

    const rawTweetUrl = String(body.tweetUrl || "").trim();
    let tweetUrl: string | null = null;
    let tweetPreview: any = null;
    if (rawTweetUrl) {
      if (!isValidXPostUrl(rawTweetUrl)) {
        return NextResponse.json({ error: "Tweet link must be an x.com or twitter.com status URL" }, { status: 400 });
      }
      tweetUrl = rawTweetUrl;
      tweetPreview = await buildXPreview(tweetUrl);
    }

    const [post] = await db
      .insert(communityPosts)
      .values({ userId: user.id, content, imageUrl, tweetUrl, tweetPreview })
      .returning();

    const [loaded] = await loadPosts({ viewerId: user.id, postId: post!.id, limit: 1 });
    return NextResponse.json({ post: loaded, message: "Posted to Community." }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create post" }, { status: 500 });
  }
}
