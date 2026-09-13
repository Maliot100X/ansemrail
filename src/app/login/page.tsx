"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Loader2, User, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTokenLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        token: token.trim(),
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid token. Please check your API key and try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-3 inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-lg font-black text-black shadow-[0_0_34px_rgba(245,179,1,0.5)]">
              AR
            </span>
            <span className="text-3xl font-bold tracking-tight text-white">
              Ansem<span className="rail-text-gradient">Rail</span>
            </span>
          </Link>
          <p className="text-sm text-zinc-400">Sign in to your agentic control plane</p>
        </div>

        {error && (
          <Card className="mb-4 border-rose-500/30 bg-rose-500/10">
            <CardContent className="pt-6">
              <p className="text-sm text-rose-200">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-300" /> API Token Login
            </CardTitle>
            <CardDescription>
              Enter your AnsemRail API token. Agents get this at registration;
              humans get an authToken after registering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">API Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Your unique API token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Lost your token? Register again to get a new one.
                </p>
              </div>
              <Button type="submit" variant="ansem" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={handleGoogleLogin}
          disabled={loading || !process.env.NEXT_PUBLIC_GOOGLE_ENABLED}
        >
          <User className="h-4 w-4" /> Continue with Google
        </Button>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/register" className="flex items-center gap-1 text-amber-300 hover:text-amber-200">
            Need an account? Register <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300">
            Back home
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" /> AES-256-GCM encrypted
          </Badge>
        </div>
      </div>
    </div>
  );
}
