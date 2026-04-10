"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import {
  generatePersonas,
  getLLMProviders,
  listAnalyses,
  type AnalysisSummary,
  type PersonaProfile,
  type PersonasResponse,
} from "@/lib/api";
import { Spinner } from "@/components/spinner";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800 border-emerald-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  negative: "bg-red-100 text-red-800 border-red-200",
};

const PERSUADABILITY_COLORS: Record<string, string> = {
  Low: "bg-blue-100 text-blue-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-purple-100 text-purple-800",
};

export default function PersonasPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[] | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [analysesError, setAnalysesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [count, setCount] = useState(3);
  const [country, setCountry] = useState("");
  const [election, setElection] = useState("");
  const [hint, setHint] = useState("");
  const [provider, setProvider] = useState<string>("");

  const [result, setResult] = useState<PersonasResponse | null>(null);
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
      const res = await generatePersonas(selectedId, {
        count,
        country: country || null,
        election: election || null,
        demographics_hint: hint || null,
        provider: provider || null,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Voter Personas"
      subtitle="Generate realistic voter personas grounded in your sentiment analysis data. Powered by LLM."
      icon="👥"
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

          <label className="text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Number of personas
            </span>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.max(1, Math.min(10, Number(e.target.value) || 3))
                )
              }
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
              Country context
            </span>
            <input
              type="text"
              placeholder="e.g. United Kingdom"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input-refined"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Election context
            </span>
            <input
              type="text"
              placeholder="e.g. 2024 General Election"
              value={election}
              onChange={(e) => setElection(e.target.value)}
              className="input-refined"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demographics hint (optional)
            </span>
            <input
              type="text"
              placeholder="e.g. include a young urban voter and a rural retiree"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="input-refined"
            />
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
              "Generate personas"
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
              Generated Personas ({result.personas.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Provider: {result.provider} · Model: {result.model} ·{" "}
              {result.total_rows} source rows
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
            {result.grounding_summary}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {result.personas.map((p, i) => (
              <PersonaCard key={i} persona={p} />
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function PersonaCard({ persona }: { persona: PersonaProfile }) {
  const sentStyle =
    SENTIMENT_COLORS[persona.sentiment_alignment] ??
    SENTIMENT_COLORS.neutral;
  const persuStyle =
    PERSUADABILITY_COLORS[persona.persuadability] ??
    "bg-slate-100 text-slate-800";

  return (
    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft transition-all hover:shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold text-foreground">{persona.name}</h4>
          <p className="text-sm text-muted-foreground">
            {persona.age} · {persona.gender} · {persona.location}
          </p>
        </div>
        <span
          className={`stat-badge border capitalize ${sentStyle}`}
        >
          {persona.sentiment_alignment}
        </span>
      </div>

      {/* Demographics grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Occupation" value={persona.occupation} />
        <Detail label="Education" value={persona.education} />
        <Detail label="Income" value={persona.income_bracket} />
        <Detail label="Leaning" value={persona.political_leaning} />
      </div>

      {/* Narrative */}
      <p className="mt-4 text-sm leading-relaxed text-foreground/80">
        {persona.narrative}
      </p>

      {/* Confidence bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence in position</span>
          <span className="font-semibold">
            {(persona.confidence_level * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
            style={{ width: `${persona.confidence_level * 100}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Persuadability:</span>
        <span className={`stat-badge ${persuStyle}`}>
          {persona.persuadability}
        </span>
      </div>

      {/* Top issues */}
      {persona.top_issues.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top issues
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {persona.top_issues.map((issue) => (
              <span
                key={issue}
                className="rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Media diet */}
      {persona.media_diet.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Media diet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {persona.media_diet.join(", ")}
          </p>
        </div>
      )}

      {/* Messaging angles */}
      {persona.messaging_angles.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline">
            Messaging angles ({persona.messaging_angles.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {persona.messaging_angles.map((angle, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {angle}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Traits */}
      {persona.traits.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline">
            Personality traits ({persona.traits.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {persona.traits.map((t, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium">{t.trait}</span>{" "}
                <span className="text-muted-foreground">— {t.description}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}: </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
