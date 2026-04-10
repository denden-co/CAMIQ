"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  generatePersonas,
  getLLMProviders,
  listAnalyses,
  type AnalysisSummary,
  type PersonaProfile,
  type PersonasResponse,
} from "@/lib/api";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-800 border-green-300",
  neutral: "bg-gray-100 text-gray-800 border-gray-300",
  negative: "bg-red-100 text-red-800 border-red-300",
};

const PERSUADABILITY_COLORS: Record<string, string> = {
  Low: "bg-blue-100 text-blue-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-purple-100 text-purple-800",
};

export default function PersonasPage() {
  // --- data ---
  const [analyses, setAnalyses] = useState<AnalysisSummary[] | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [analysesError, setAnalysesError] = useState<string | null>(null);

  // --- form ---
  const [selectedId, setSelectedId] = useState<string>("");
  const [count, setCount] = useState(3);
  const [country, setCountry] = useState("");
  const [election, setElection] = useState("");
  const [hint, setHint] = useState("");
  const [provider, setProvider] = useState<string>("");

  // --- results ---
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
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">CampaignIQ</h1>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-bold">Voter Personas</h2>
        <p className="mt-2 text-muted-foreground">
          Generate realistic voter personas grounded in your sentiment analysis
          data. Powered by LLM — requires at least one API key configured.
        </p>

        {/* Provider status */}
        <div className="mt-4 text-sm">
          {providers.length > 0 ? (
            <span className="text-green-700">
              LLM ready — available: {providers.join(", ")}
            </span>
          ) : (
            <span className="text-amber-700">
              No LLM provider configured. Add an API key to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                api/.env
              </code>{" "}
              and restart the backend.
            </span>
          )}
        </div>

        {/* Configuration form */}
        <div className="mt-8 rounded-lg border border-border bg-background p-6">
          <h3 className="text-lg font-semibold">Configure</h3>

          {analysesError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {analysesError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Analysis picker */}
            <label className="text-sm sm:col-span-2 lg:col-span-3">
              <span className="block font-medium text-muted-foreground">
                Source analysis
              </span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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

            {/* Count */}
            <label className="text-sm">
              <span className="block font-medium text-muted-foreground">
                Number of personas
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(10, Number(e.target.value) || 3)))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            {/* Provider */}
            <label className="text-sm">
              <span className="block font-medium text-muted-foreground">
                LLM provider
              </span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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

            {/* Country */}
            <label className="text-sm">
              <span className="block font-medium text-muted-foreground">
                Country context
              </span>
              <input
                type="text"
                placeholder="e.g. United Kingdom"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            {/* Election */}
            <label className="text-sm">
              <span className="block font-medium text-muted-foreground">
                Election context
              </span>
              <input
                type="text"
                placeholder="e.g. 2024 General Election"
                value={election}
                onChange={(e) => setElection(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            {/* Demographics hint */}
            <label className="text-sm sm:col-span-2 lg:col-span-2">
              <span className="block font-medium text-muted-foreground">
                Demographics hint (optional)
              </span>
              <input
                type="text"
                placeholder="e.g. include a young urban voter and a rural retiree"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!selectedId || loading || providers.length === 0}
            >
              {loading ? "Generating personas…" : "Generate personas"}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8">
            <div className="mb-4 flex items-baseline justify-between gap-4 flex-wrap">
              <h3 className="text-lg font-semibold">
                Generated Personas ({result.personas.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Provider: {result.provider} · Model: {result.model} ·{" "}
                {result.total_rows} source rows
              </p>
            </div>

            <p className="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {result.grounding_summary}
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {result.personas.map((p, i) => (
                <PersonaCard key={i} persona={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function PersonaCard({ persona }: { persona: PersonaProfile }) {
  const sentStyle =
    SENTIMENT_COLORS[persona.sentiment_alignment] ?? SENTIMENT_COLORS.neutral;
  const persuStyle =
    PERSUADABILITY_COLORS[persona.persuadability] ??
    "bg-gray-100 text-gray-800";

  return (
    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold">{persona.name}</h4>
          <p className="text-sm text-muted-foreground">
            {persona.age} · {persona.gender} · {persona.location}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${sentStyle}`}
        >
          {persona.sentiment_alignment}
        </span>
      </div>

      {/* Demographics grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <Detail label="Occupation" value={persona.occupation} />
        <Detail label="Education" value={persona.education} />
        <Detail label="Income" value={persona.income_bracket} />
        <Detail label="Leaning" value={persona.political_leaning} />
      </div>

      {/* Narrative */}
      <p className="mt-4 text-sm leading-relaxed">{persona.narrative}</p>

      {/* Confidence bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence in position</span>
          <span>{(persona.confidence_level * 100).toFixed(0)}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${persona.confidence_level * 100}%` }}
          />
        </div>
      </div>

      {/* Tags row: persuadability */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Persuadability:</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${persuStyle}`}
        >
          {persona.persuadability}
        </span>
      </div>

      {/* Top issues */}
      {persona.top_issues.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Top issues
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {persona.top_issues.map((issue) => (
              <span
                key={issue}
                className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs"
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
          <p className="text-xs font-medium text-muted-foreground">
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
          <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
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
          <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
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
