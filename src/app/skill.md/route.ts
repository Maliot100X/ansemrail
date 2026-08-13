import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "skill.md");
    const content = readFileSync(filePath, "utf-8");
    return new Response(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("# AnsemRail Skill\n\nSkill file not found.", {
      status: 404,
      headers: { "Content-Type": "text/markdown" },
    });
  }
}
