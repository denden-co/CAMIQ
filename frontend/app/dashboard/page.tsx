"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CountryPicker } from "@/components/country-picker";
import { useCountry } from "@/lib/country-context";
import {
  deleteAnalysis,
  listAnalyses,
  type AnalysisSummary,
} from "@/lib/api";

// DEV-ONLY dashboard — reads mock user from localStorage.
export default function DashboardPage() {
  const router = useRouter();
  const { selected: country } = useCountry();
  const [user, setUser] = useState<{ email: string; fullName: string } | null>(
    null
  );
  const [analyses, setAnalyses] = useState<AnalysisSummary[] | null>(null);
  const [analysesError, setAnalysesError] = useState<string | null>(null);
  const [analysesLoading, setAnalysesLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("campaigniq_dev_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    setAnalysesLoading(true);
    setAnalysesError(null);
    listAnalyses()
      .then((list) => {
        if (!cancelled) setAnalyses(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAnalysesError(
            err instanceof Error ? err.message : "Failed to load analyses."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAnalysesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  async function handleDeleteAnalysis(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await deleteAnalysis(id);
      setAnalyses((list) => (list ?? []).filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  }

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
            <CountryPicker />
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
          {country && (
            <>
              {" · "}Focus:{" "}
              <Link
                href="/countries"
                className="font-medium text-primary hover:underline"
              >
                {country.country} — {country.election_name}
              </Link>
            </>
          )}
        </p>

        <div className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">Recent Analyses</h3>
            <Link
              href="/analyze"
              className="text-sm text-primary hover:underline"
            >
              New analysis →
            </Link>
          </div>
          {analysesLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {analysesError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {analysesError}
            </div>
          )}
          {!analysesLoading && !analysesError && analyses && analyses.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No saved analyses yet. Run a batch or CSV on the{" "}
              <Link href="/analyze" className="text-primary hover:underline">
                Analyse page
              </Link>{" "}
              and hit <strong>Save analysis</strong>.
            </div>
          )}
          {analyses && analyses.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Source
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Rows
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Dominant
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Mean
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Languages
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Saved
                    </th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analyses.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2 font-medium">{a.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {a.source}
                      </td>
                      <td className="px-4 py-2">{a.total}</td>
                      <td className="px-4 py-2 capitalize">
                        {a.dominant_label}
                      </td>
                      <td className="px-4 py-2">
                        {a.mean_compound.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">{a.languages_detected}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/dashboard/analyses/${a.id}` as any}
                          className="mr-3 text-xs text-primary hover:underline"
                        >
                          View · Topics
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnalysis(a.id, a.name)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <h3 className="mt-12 text-lg font-semibold">Modules</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Batch & CSV Analysis"
            description="Upload a CSV or paste rows — multilingual sentiment, language mix, top phrases"
            status="Live"
            href="/analyze"
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
            status="Live"
            href="/countries"
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
