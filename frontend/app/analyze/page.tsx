"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { analyzeText, type AnalyzeResponse } from "@/lib/api";

const SAMPLE =
  "The new housing policy is a bold step forward. Families finally have a reason to be hopeful, though some critics argue the plan doesn't go far enough on affordability.";

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await analyzeText(text);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold">
            CampaignIQ
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">Single Text Analysis</h1>
        <p className="mt-2 text-muted-foreground">
          Paste any piece of text — a speech, a tweet, a manifesto excerpt — and
          get sentiment, confidence, and the words driving the signal.
        </p>

        <form onSubmit={handleAnalyze} className="mt-8 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here…"
            rows={10}
            className="w-full rounded-md border border-border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading || !text.trim()}>
              {loading ? "Analysing…" : "Analyse"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setText(SAMPLE);
                setResult(null);
                setError(null);
              }}
            >
              Try sample text
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {text.length.toLocaleString()} characters
            </span>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Analysis failed</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-red-600">
              Make sure the FastAPI backend is running at{" "}
              <code>http://localhost:8000</code>.
            </p>
          </div>
        )}

        {result && <Results result={result} />}
      </section>
    </main>
  );
}

function Results({ result }: { result: AnalyzeResponse }) {
  const labelColour =
    result.label === "positive"
      ? "bg-green-100 text-green-800"
      : result.label === "negative"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sentiment">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${labelColour}`}
          >
            {result.label}
          </span>
        </StatCard>
        <StatCard label="Confidence">
          <span className="text-2xl font-bold">
            {(result.confidence * 100).toFixed(1)}%
          </span>
        </StatCard>
        <StatCard label="Compound score">
          <span className="text-2xl font-bold">
            {result.scores.compound.toFixed(3)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            (−1 to +1)
          </span>
        </StatCard>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Score breakdown
        </h3>
        <div className="mt-4 space-y-3">
          <ScoreBar
            label="Positive"
            value={result.scores.positive}
            colour="bg-green-500"
          />
          <ScoreBar
            label="Neutral"
            value={result.scores.neutral}
            colour="bg-gray-400"
          />
          <ScoreBar
            label="Negative"
            value={result.scores.negative}
            colour="bg-red-500"
          />
        </div>
      </div>

      {result.key_phrases.length > 0 && (
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Key phrases
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.key_phrases.map((kp) => (
              <span
                key={kp.phrase}
                className="rounded-md border border-border bg-muted px-3 py-1 text-sm"
                style={{ opacity: 0.4 + kp.weight * 0.6 }}
              >
                {kp.phrase}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Model: <code>{result.model}</code> · {result.word_count} words ·{" "}
        {result.character_count} characters
      </p>
    </div>
  );
}

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
