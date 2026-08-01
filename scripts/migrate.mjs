import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const sql = neon(process.env.DATABASE_URL);
const raw = readFileSync("./drizzle/0000_breezy_whirlwind.sql", "utf-8");
const statements = raw.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  try {
    await sql.query(stmt);
    console.log("OK:", stmt.slice(0, 60).replace(/\n/g, " "));
  } catch (e) {
    if (e.message.includes("already exists")) {
      console.log("SKIP (exists):", stmt.slice(0, 60).replace(/\n/g, " "));
    } else {
      console.error("ERROR:", e.message, "|| SQL:", stmt.slice(0, 80));
    }
  }
}
console.log("Migration complete.");
