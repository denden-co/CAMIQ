"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem(
        "campaigniq_dev_user",
        JSON.stringify({ email, fullName: email.split("@")[0] })
      );
    } catch {
      /* ignore */
    }
    document.cookie =
      "campaigniq_dev_auth=1; path=/; max-age=86400; samesite=lax";
    window.location.assign("/dashboard");
  }

  return (
    <main className="hero-mesh flex min-h-screen items-center justify-center px-5">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed -left-40 top-1/3 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-1/3 h-64 w-64 rounded-full bg-accent/8 blur-3xl" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Campaign<span className="text-gradient">IQ</span>
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

          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 text-center text-xs text-amber-700">
            Dev mode — any email & password works
          </div>

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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
