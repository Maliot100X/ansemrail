import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toBuffer(data: any): Buffer | null {
  if (data === null || data === undefined) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === "string") {
    const hex = data.replace(/\\x/g, "");
    if (/^[0-9a-fA-F]+$/.test(hex)) return Buffer.from(hex, "hex");
    return Buffer.from(data, "base64");
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await db.execute(sql`
      SELECT mime, data FROM uploaded_images WHERE id = ${id} LIMIT 1
    `);
    const rows = Array.isArray(res) ? res : (res as any)?.rows || [];
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    const buffer = toBuffer(row.data);
    if (!buffer) {
      return NextResponse.json({ error: "Image data is invalid" }, { status: 500 });
    }
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": row.mime || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load image" },
      { status: 500 }
    );
  }
}
