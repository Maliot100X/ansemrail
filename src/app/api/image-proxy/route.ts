import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 4 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("u") || request.nextUrl.searchParams.get("url") || "";
  let target = "";
  try {
    target = Buffer.from(raw, "base64url").toString("utf-8");
  } catch {
    target = "";
  }
  if (!/^https?:\/\//i.test(target)) {
    // Fall back to treating the param as a raw URL
    target = /^https?:\/\//i.test(raw) ? raw : "";
  }
  if (!target) {
    return NextResponse.json({ error: "Missing image url (u or url param)" }, { status: 400 });
  }

  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AnsemRail/1.0)" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream image fetch failed: ${res.status}` }, { status: 502 });
    }
    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Upstream URL is not an image" }, { status: 400 });
    }
    if (buf.length === 0 || buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image is empty or too large (max 4 MB)" }, { status: 400 });
    }
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Image proxy failed" }, { status: 502 });
  }
}
