import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getRequestUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — Neon bytea + Vercel body limits
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const raw = typeof body.image === "string" ? body.image.trim() : "";
    if (!raw) {
      return NextResponse.json(
        { error: 'image is required — send { image: "<base64 or data URL>" }' },
        { status: 400 }
      );
    }

    let b64 = raw;
    let mime = "image/png";
    if (raw.startsWith("data:")) {
      const match = raw.match(/^data:([^;]+);base64,([\s\S]+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
      }
      mime = match[1];
      b64 = match[2];
    }
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, or GIF images are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(b64, "base64");
    if (!buffer.length) {
      return NextResponse.json({ error: "Empty image data" }, { status: 400 });
    }
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large — max 4MB" }, { status: 400 });
    }

    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isWebp = buffer.toString("ascii", 0, 4) === "RIFF";
    const isGif = buffer.toString("ascii", 0, 4) === "GIF8";
    if (!isPng && !isJpeg && !isWebp && !isGif) {
      return NextResponse.json(
        { error: "Uploaded data is not a valid PNG/JPEG/WebP/GIF image" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS uploaded_images (
        id uuid PRIMARY KEY,
        owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
        mime text NOT NULL,
        data bytea NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`ALTER TABLE uploaded_images ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE SET NULL`);
    await db.execute(sql`
      INSERT INTO uploaded_images (id, owner_id, mime, data) VALUES (${id}, ${user.id}, ${mime}, ${buffer})
    `);

    const url = `${request.nextUrl.origin}/api/upload/${id}`;
    return NextResponse.json(
      {
        id,
        url,
        mime,
        size: buffer.length,
        message: "Image uploaded — use the returned URL in your launch.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
