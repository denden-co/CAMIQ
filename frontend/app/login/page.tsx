"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Sign-in is not configured on this deployment.");
      return;
    }
    setLoading(true);
    // Created lazily so the page can prerender without Supabase env vars.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      // Same message for wrong email and wrong password: do not reveal
      // which accounts exist.
      setError("Email or password is incorrect.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-5">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed -left-40 top-1/3 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-1/3 h-64 w-64 rounded-full bg-accent/8 blur-3xl" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Campaign<span className="text-accent">IQ</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-white/90 p-8 shadow-card backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Access is by invitation. Use the link in your invite email to set a password.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-refined"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-refined"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
          <Link href="/auth/reset-password" className="hover:text-foreground transition">
            Forgot password?
          </Link>
          <span aria-hidden>·</span>
          <Link href="/" className="hover:text-foreground transition">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
