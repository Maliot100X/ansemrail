"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Sparkles, Zap, Loader2, Upload, FileText } from "lucide-react";

interface ClawPumpSkill {
  slug: string;
  name: string;
  description: string;
  alwaysOn: boolean;
}

interface SkillsClientProps {
  clawpumpSkills: ClawPumpSkill[];
  moonpaySkills: readonly string[];
  error: string | null;
  hasOwnKey: boolean;
}

export function SkillsClient({ clawpumpSkills, moonpaySkills, error, hasOwnKey }: SkillsClientProps) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || null;
  const [installing, setInstalling] = useState<string | null>(null);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ agentId?: string; agentToken?: string; message?: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [skillMdContent, setSkillMdContent] = useState<string>("");
  const [agentName, setAgentName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = userId;
    fetch(id ? `/api/skills?userId=${id}` : "/api/skills")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.skills)) {
          const slugs = new Set<string>();
          for (const sk of data.skills) {
            slugs.add(sk.slug);
            slugs.add(String(sk.slug).replace(/-[0-9a-f]{8}$/, ""));
          }
          setInstalledSlugs(slugs);
        }
      })
      .catch(() => {});
  }, [userId]);

  async function handleInstall(skill: ClawPumpSkill) {
    setInstalling(skill.slug);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: skill.name,
          slug: skill.slug,
          description: skill.description,
          tags: ["clawpump"],
          userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Install failed");
      setInstalledSlugs((prev) => new Set(prev).add(skill.slug));
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setInstalling(null);
    }
  }

  async function handleMoonpayInstall(skill: string) {
    setInstalling(skill);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: skill,
          slug: skill,
          description: skill.replace("moonpay-", "").replace(/-/g, " "),
          tags: ["moonpay"],
          userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Install failed");
      setInstalledSlugs((prev) => new Set(prev).add(skill));
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setInstalling(null);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSkillMdContent(ev.target?.result as string);
    };
    reader.readAsText(file);
  }

  async function handleSkillMdRegister(e: React.FormEvent) {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const res = await fetch("/api/register/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillMdContent: skillMdContent,
          name: agentName || "Custom SKILL.md Agent",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setUploadResult(data);
      if (data.agentId) localStorage.setItem("ansemrail_agent_id", data.agentId);
      if (data.agentToken) {
        localStorage.setItem("ansemrail_agent_token", data.agentToken);
        await signIn("credentials", { token: data.agentToken, redirect: false });
      }
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Skills</h1>
        <p className="text-sm text-zinc-400">Registry of ClawPump and MoonPay skills — install with one click</p>
      </div>

      {error && (
        <Card className={hasOwnKey ? "border-red-800 bg-red-950/30" : "border-amber-900/40 bg-amber-950/20"}>
          <CardContent className="pt-6">
            <p className={`text-sm ${hasOwnKey ? "text-red-400" : "text-amber-300"}`}>{error}</p>
            {!hasOwnKey && (
              <a href="/settings" className="text-xs text-amber-400 underline mt-1 inline-block">
                Open Settings → Accounts
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {uploadError && (
        <Card className="border-red-800 bg-red-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-400">{uploadError}</p>
          </CardContent>
        </Card>
      )}

      {uploadResult && (
        <Card className="border-green-800 bg-green-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{uploadResult.message}</span>
            </div>
            {uploadResult.agentId && <p className="mt-2 text-sm text-zinc-400">Agent ID: {uploadResult.agentId}</p>}
            {uploadResult.agentToken && (
              <div className="mt-3 rounded-md bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500 mb-1">Agent Token (save this — shown once):</p>
                <code className="text-sm text-amber-400 break-all">{uploadResult.agentToken}</code>
              </div>
            )}
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
                  {installedSlugs.has(skill.slug) ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" /> Installed
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleInstall(skill)}
                      disabled={installing === skill.slug}
                    >
                      {installing === skill.slug ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <><Zap className="h-3 w-3" /> Install</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> MoonPay Skills ({moonpaySkills.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {moonpaySkills.map((skill) => (
            <Card key={skill}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">{skill}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {skill.replace("moonpay-", "").replace(/-/g, " ")}
                    </p>
                  </div>
                  {installedSlugs.has(skill) ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" /> Installed
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMoonpayInstall(skill)}
                      disabled={installing === skill}
                    >
                      {installing === skill ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <><Zap className="h-3 w-3" /> Install</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-500" /> Upload Custom SKILL.md
          </CardTitle>
          <CardDescription>
            Register a custom skill from a SKILL.md file. Agents can self-register with this.
            The platform parses the YAML frontmatter and issues an agentToken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSkillMdRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skillAgentName">Agent Name</Label>
              <Input
                id="skillAgentName"
                placeholder="My SKILL.md Agent"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillfile-upload">Upload SKILL.md</Label>
              <Input
                id="skillfile-upload"
                type="file"
                accept=".md,.txt"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <p className="text-xs text-zinc-500">
                YAML frontmatter required: name, description, version, tags
              </p>
            </div>
            {skillMdContent && (
              <div className="rounded-md bg-zinc-900 border border-zinc-800 p-3 max-h-48 overflow-auto">
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                  {skillMdContent.slice(0, 500)}
                  {skillMdContent.length > 500 && "..."}
                </pre>
              </div>
            )}
            <Button type="submit" variant="ansem" className="w-full" disabled={uploadLoading || !skillMdContent}>
              {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="h-4 w-4" /> Register Agent via SKILL.md</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
