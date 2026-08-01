import { listSkills } from "@/lib/clawpump";
import { MOONPAY_SKILLS } from "@/lib/moonpay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  let clawpumpSkills: any[] = [];
  let error: string | null = null;

  try {
    clawpumpSkills = await listSkills();
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Skills</h1>
        <p className="text-sm text-zinc-400">Registry of ClawPump and MoonPay skills — install with one click</p>
      </div>

      {error && (
        <Card className="border-red-800 bg-red-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> ClawPump Skills ({clawpumpSkills.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clawpumpSkills.map((skill) => (
            <Card key={skill.slug}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{skill.name}</CardTitle>
                  {skill.alwaysOn && <Badge variant="ansem">Always On</Badge>}
                </div>
                <CardDescription>{skill.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">{skill.slug}</Badge>
                  <button className="flex items-center gap-1 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <Zap className="h-3 w-3" /> Install
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> MoonPay Skills ({MOONPAY_SKILLS.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOONPAY_SKILLS.map((skill) => (
            <Card key={skill}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">{skill}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {skill.replace("moonpay-", "").replace(/-/g, " ")}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-zinc-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Custom SKILL.md</CardTitle>
          <CardDescription>
            Register a custom skill from a SKILL.md file. Agents can self-register with this.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">
                Drag and drop a SKILL.md file here, or click to browse
              </p>
              <p className="text-xs text-zinc-600 mt-2">
                YAML frontmatter required: name, description, version, tags
              </p>
            </div>
            <button className="w-full rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-medium text-white">
              Upload SKILL.md
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
