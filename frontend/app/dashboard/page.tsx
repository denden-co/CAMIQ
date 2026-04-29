"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  type LucideIcon,
  PenLine,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryPicker } from "@/components/country-picker";
import { useCountry } from "@/lib/country-context";
import {
  deleteAnalysis,
  listAnalyses,
  type AnalysisSummary,
} from "@/lib/api";
import { Spinner } from "@/components/spinner";

type ModuleCard = {
  title: string;
  desc: string;
  href: string;
  Icon: LucideIcon;
};

const MODULE_CARDS: ModuleCard[] = [
  {
    title: "Batch & CSV Analysis",
    desc: "Upload a CSV or paste rows — multilingual sentiment, language mix, top phrases",
    href: "/analyze",
    Icon: BarChart3,
  },
  {
    title: "Single Text Analysis",
    desc: "Analyse any text — speech, manifesto, post — instantly",
    href: "/analyze",
    Icon: PenLine,
  },
  {
    title: "Voter Personas",
    desc: "LLM-generated personas grounded in real conversation data",
    href: "/personas",
    Icon: Users,
  },
  {
    title: "AI Strategic Advisor",
    desc: "Multi-LLM strategy recommendations from your data",
    href: "/strategy",
    Icon: Sparkles,
  },
  {
    title: "Bias & Fairness Audit",
    desc: "Detect confidence disparities and label-language dependence",
    href: "/bias",
    Icon: Scale,
  },
  {
    title: "Country Configuration",
    desc: "Configure parties, electoral system, languages",
    href: "/countries",
    Icon: Globe2,
  },
];

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
      {/* ── Nav bar ───────────────────────────────── */}
      <header className="nav-bar sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            Campaign<span className="text-gradient">IQ</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CountryPicker />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email ?? "dev user"}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero banner ───────────────────────────── */}
      <section className="border-b border-border/40 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome{user?.fullName ? `, ${user.fullName}` : ""}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your role:{" "}
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Analyst
            </span>
            {country && (
              <>
                {" · "}
                <Link
                  href="/countries"
                  className="font-medium text-primary hover:underline"
                >
                  {country.country} — {country.election_name}
                </Link>
              </>
            )}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {/* ── Recent Analyses ─────────────────────── */}
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-foreground">
              Recent Analyses
            </h3>
            <Link
              href="/analyze"
              className="text-sm font-medium text-primary hover:underline"
            >
              New analysis →
            </Link>
          </div>

          {analysesLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading saved analyses…
            </div>
          )}

          {analysesError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {analysesError}
            </div>
          )}

          {!analysesLoading &&
            !analysesError &&
            analyses &&
            analyses.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                No saved analyses yet. Run a batch or CSV on the{" "}
                <Link
                  href="/analyze"
                  className="font-medium text-primary hover:underline"
                >
                  Analyse page
                </Link>{" "}
                and hit <strong>Save analysis</strong>.
              </div>
            )}

          {analyses && analyses.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-white shadow-soft">
              <table className="table-premium w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Rows</th>
                    <th>Dominant</th>
                    <th>Mean</th>
                    <th>Languages</th>
                    <th>Saved</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.name}</td>
                      <td className="text-muted-foreground">{a.source}</td>
                      <td>{a.total}</td>
                      <td>
                        <span className="stat-badge bg-primary/10 text-primary capitalize">
                          {a.dominant_label}
                        </span>
                      </td>
                      <td className="font-mono text-xs">
                        {a.mean_compound.toFixed(2)}
                      </td>
                      <td>{a.languages_detected}</td>
                      <td className="text-muted-foreground text-xs">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/dashboard/analyses/${a.id}` as any}
                          className="mr-3 text-xs font-medium text-primary hover:underline"
                        >
                          View · Topics
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnalysis(a.id, a.name)}
                          className="text-xs font-medium text-danger hover:underline"
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

        {/* ── Module cards ────────────────────────── */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-foreground">Modules</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {MODULE_CARDS.map((m) => (
              <Link key={m.title} href={m.href as any}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-6 transition-colors duration-150 hover:border-foreground/30">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card">
                    <m.Icon
                      className="h-5 w-5 text-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h4 className="font-semibold text-foreground">{m.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {m.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                    Open module
                    <ArrowRight
                      className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
