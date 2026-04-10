"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import {
  generateStrategy,
  getLLMProviders,
  listAnalyses,
  type AnalysisSummary,
  type StrategyRecommendation,
  type StrategyResponse,
} from "@/lib/api";
import { Spinner } from "@/components/spinner";

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const CATEGORY_ICONS: Record<string, string> = {
  Messaging: "💬",
  Targeting: "🎯",
  "Risk Mitigation": "🛡️",
  "Resource Allocation": "📊",
  "Digital Strategy": "📱",
};

export default function StrategyPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[] | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [analysesError, setAnalysesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [focusTopics, setFocusTopics] = useState("");
  const [targetParty, setTargetParty] = useState("");
  const [biasAwareness, setBiasAwareness] = useState(true);
  const [provider, setProvider] = useState<string>("");

  const [result, setResult] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAnalyses()
      .then(setAnalyses)
      .catch((e) =>
        setAnalysesError(e instanceof Error ? e.message : "Failed to load.")
      );
    getLLMProviders()
      .then((r) => setProviders(r.providers))
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const topics = focusTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await generateStrategy(selectedId, {
        focus_topics: topics.length > 0 ? topics : null,
        target_party: targetParty || null,
        bias_awareness: biasAwareness,
        provider: provider || null,
      });
      setResult(res);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Strategy generation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="AI Strategic Advisor"
      subtitle="Generate data-grounded campaign strategy recommendations from your sentiment analysis."
      icon="🧠"
    >
      {/* Provider status */}
      <div className="text-sm">
        {providers.length > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            LLM ready — {providers.join(", ")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700">
            No LLM provider configured. Add an API key to{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px]">
              api/.env
            </code>
          </span>
        )}
      </div>

      {/* Configuration form */}
      <div className="mt-6 rounded-xl border border-border/60 bg-white p-6 shadow-soft">
        <h3 className="text-sm font-bold text-foreground">Configure</h3>

        {analysesError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {analysesError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm sm:col-span-2 lg:col-span-3">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Source analysis
            </span>
            <select
              className="input-refined"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— select a saved analysis —</option>
              {analyses?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.total} rows, {a.dominant_label},{" "}
                  {new Date(a.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Focus topics (optional, comma-separated)
            </span>
            <input
              type="text"
              placeholder="e.g. economy, healthcare, immigration"
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value)}
              className="input-refined"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              LLM provider
            </span>
            <select
              className="input-refined"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="">Auto (first available)</option>
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target party (optional)
            </span>
            <input
              type="text"
              placeholder="e.g. Labour, Conservative"
              value={targetParty}
              onChange={(e) => setTargetParty(e.target.value)}
              className="input-refined"
            />
          </label>

          <label className="flex items-center gap-2.5 self-end text-sm">
            <input
              type="checkbox"
              checked={biasAwareness}
              onChange={(e) => setBiasAwareness(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Include bias/fairness caveat
            </span>
          </label>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleGenerate}
            disabled={!selectedId || loading || providers.length === 0}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Generating…
              </span>
            ) : (
              "Generate strategy"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="text-lg font-bold text-foreground">
              Strategy Recommendations ({result.recommendations.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Provider: {result.provider} · Model: {result.model} ·{" "}
              {result.total_rows} source rows
            </p>
          </div>

          {/* Executive summary */}
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm">
            <p className="font-bold text-primary">Executive Summary</p>
            <p className="mt-1 leading-relaxed text-foreground/80">
              {result.executive_summary}
            </p>
          </div>

          <p className="mb-6 text-xs text-muted-foreground">
            {result.grounding_summary}
          </p>

          {/* Recommendation cards */}
          <div className="space-y-4">
            {result.recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>

          {/* Risk factors */}
          {result.risk_factors.length > 0 && (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h4 className="font-bold text-amber-900">
                Risk Factors ({result.risk_factors.length})
              </h4>
              <ul className="mt-3 space-y-2">
                {result.risk_factors.map((risk, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-amber-800"
                  >
                    <span className="mt-0.5 text-amber-600">⚠</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bias caveat */}
          {result.bias_caveat && (
            <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-6">
              <h4 className="font-bold text-purple-900">
                Bias & Fairness Caveat
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-purple-800">
                {result.bias_caveat}
              </p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function RecommendationCard({ rec }: { rec: StrategyRecommendation }) {
  const priorityStyle =
    PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS.Medium;
  const icon = CATEGORY_ICONS[rec.category] ?? "📋";

  return (
    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft transition-all hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xl">
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {rec.category}
            </p>
            <h4 className="mt-0.5 text-base font-bold text-foreground">
              {rec.title}
            </h4>
          </div>
        </div>
        <span
          className={`stat-badge shrink-0 border ${priorityStyle}`}
        >
          {rec.priority}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {rec.rationale}
      </p>

      {rec.sentiment_link && (
        <p className="mt-2 text-xs italic text-muted-foreground">
          Data link: {rec.sentiment_link}
        </p>
      )}

      {rec.actions.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Action steps
          </p>
          <ul className="mt-2 space-y-1.5">
            {rec.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-primary">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
