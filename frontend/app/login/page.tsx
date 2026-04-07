"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// DEV-ONLY mock login — bypasses Supabase.
// Any non-empty email/password signs you in and drops a client cookie.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Store a friendly display name in localStorage for the dashboard to read.
    try {
      localStorage.setItem(
        "campaigniq_dev_user",
        JSON.stringify({ email, fullName: email.split("@")[0] })
      );
    } catch {
      /* ignore — SSR or blocked storage */
    }

    // Set the dev auth cookie the middleware checks for.
    document.cookie = "campaigniq_dev_auth=1; path=/; max-age=86400; samesite=lax";

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">CampaignIQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account
          </p>
          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
            Dev mode — any email/password works
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
