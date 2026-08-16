import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";
import { fetchPostInfo } from "@/lib/twitter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const encKeys = (dbUser.encryptedKeys as any) || {};
    return NextResponse.json({
      verified: !!encKeys.twitterVerified,
      handle: encKeys.twitterHandle || null,
      verifiedAt: encKeys.twitterVerifiedAt || null,
      tweetUrl: encKeys.verifiedTweetUrl || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, handle, tweetUrl } = body;

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const encKeys = (dbUser.encryptedKeys as any) || {};

    if (action === "start") {
      // Generate a verification code
      const code = "ANSEM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newEncKeys = {
        ...encKeys,
        twitterVerifyCode: code,
        twitterVerifyExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      await db
        .update(users)
        .set({ encryptedKeys: newEncKeys, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        code,
        message: "Post this code on X/Twitter to verify your agent.",
        instructions: `Post a tweet containing your code "${code}" and your AnsemRail agent profile link. Then submit the tweet URL to complete verification.`,
      });
    }

    if (action === "verify") {
      if (!tweetUrl) {
        return NextResponse.json({ error: "tweetUrl is required" }, { status: 400 });
      }

      const code = encKeys.twitterVerifyCode;
      if (!code) {
        return NextResponse.json({ error: "No pending verification. Start with action=start first." }, { status: 400 });
      }

      const expiry = encKeys.twitterVerifyExpiry ? new Date(encKeys.twitterVerifyExpiry) : null;
      if (expiry && expiry < new Date()) {
        return NextResponse.json({ error: "Verification code expired. Start a new one with action=start." }, { status: 400 });
      }

      // Fetch the tweet
      const post = await fetchPostInfo(tweetUrl);
      if (!post.ok) {
        return NextResponse.json({ error: "Could not fetch tweet: " + (post.note || "unknown error") }, { status: 400 });
      }

      const tweetText = (post.text || "").toLowerCase();
      const codeLower = code.toLowerCase();

      if (!tweetText.includes(codeLower)) {
        return NextResponse.json({
          error: `Verification code "${code}" not found in the tweet. Make sure you posted the exact code.`,
          tweetText: post.text?.slice(0, 200),
        }, { status: 400 });
      }

      // Verified! Update user — prefer user-submitted handle, fallback to real author from post
      let handleClean = handle ? handle.replace(/^@/, "").trim() : null;
      if (!handleClean && post.author && post.author.toLowerCase() !== "i") {
        handleClean = post.author;
      }
      // If still no handle, try to find one from the tweet text mentions
      if (!handleClean && post.mentions.length > 0) {
        handleClean = post.mentions[0];
      }
      const newEncKeys = {
        ...encKeys,
        twitterVerified: true,
        twitterHandle: handleClean ? "@" + handleClean : null,
        twitterVerifiedAt: new Date().toISOString(),
        twitterVerifyCode: null,
        twitterVerifyExpiry: null,
        verifiedTweetUrl: tweetUrl,
      };
      await db
        .update(users)
        .set({ encryptedKeys: newEncKeys, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        verified: true,
        handle: handleClean,
        tweetUrl,
        message: "Twitter verification successful! Your agent is now verified.",
      });
    }

    if (action === "status") {
      return NextResponse.json({
        verified: !!encKeys.twitterVerified,
        handle: encKeys.twitterHandle || null,
        verifiedAt: encKeys.twitterVerifiedAt || null,
        tweetUrl: encKeys.verifiedTweetUrl || null,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use start, verify, or status." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
