"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// DEV-ONLY dashboard — reads mock user from localStorage.
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; fullName: string } | null>(
    null
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("campaigniq_dev_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function handleSignOut() {
    try {
      localStorage.removeItem("campaigniq_dev_user");
    } catch {
      /* ignore */
    }
    document.cookie = "campaigniq_dev_auth=; path=/; max-age=0; samesite=lax";
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">CampaignIQ</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email ?? "dev user"}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-bold">
          Welcome{user?.fullName ? `, ${user.fullName}` : ""}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your role:{" "}
          <span className="font-medium text-foreground">analyst</span>
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Social Data Analysis"
            description="Sentiment and topics from Twitter/X, Reddit, and news"
            status="Coming Phase 2"
          />
          <DashboardCard
            title="Single Text Analysis"
            description="Analyse any text — speech, manifesto, post — instantly"
            status="Live"
            href="/analyze"
          />
          <DashboardCard
            title="Voter Personas"
            description="LLM-generated personas grounded in real conversation data"
            status="Coming Phase 4"
          />
          <DashboardCard
            title="AI Strategic Advisor"
            description="Multi-LLM strategy recommendations from your data"
            status="Coming Phase 4"
          />
          <DashboardCard
            title="Bias & Fairness Audit"
            description="Detect and report on model bias across demographics"
            status="Coming Phase 4"
          />
          <DashboardCard
            title="Country Configuration"
            description="Configure parties, electoral system, languages"
            status="Coming Phase 1"
          />
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  status,
  href,
}: {
  title: string;
  description: string;
  status: string;
  href?: string;
}) {
  const isLive = status.toLowerCase() === "live";
  const body = (
    <div
      className={`h-full rounded-lg border border-border bg-background p-6 shadow-sm transition ${
        href ? "hover:border-primary hover:shadow-md" : ""
      }`}
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <p
        className={`mt-4 text-xs uppercase tracking-wide ${
          isLive ? "text-green-600" : "text-primary"
        }`}
      >
        {status}
      </p>
    </div>
  );

  return href ? <Link href={href as any}>{body}</Link> : body;
}
