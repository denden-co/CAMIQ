"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  getAnalysis,
  getAnalysisTopics,
  type SavedAnalysis,
  type Topic,
  type TopicModelResponse,
} from "@/lib/api";
import {
  exportAnalysisCSV,
  exportAnalysisJSON,
  exportAnalysisPDF,
} from "@/lib/export";

const LEAN_COLORS: Record<string, string> = {
  positive: "#16a34a", // green-600
  neutral: "#9ca3af", // gray-400
  negative: "#dc2626", // red-600
};

// Phase 3: saved analysis detail page with BERTopic topic modelling.
export default function SavedAnalysisPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [topics, setTopics] = useState<TopicModelResponse | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [nTopics, setNTopics] = useState<number>(6);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getAnalysis(id)
      .then((a) => {
        if (!cancelled) setAnalysis(a);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAnalysisError(
            err instanceof Error ? err.message : "Failed to load analysis."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function runTopics() {
    if (!id) return;
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const result = await getAnalysisTopics(id, { n_topics: nTopics });
      setTopics(result);
    } catch (err) {
      setTopicsError(
        err instanceof Error ? err.message : "Topic modelling failed."
      );
    } finally {
      setTopicsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border print:hidden">
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
        {analysisError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {analysisError}
          </div>
        )}

        {!analysis && !analysisError && (
          <p className="text-sm text-muted-foreground">Loading analysis…</p>
        )}

        {analysis && (
          <>
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-3xl font-bold">{analysis.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysis.total} rows · dominant{" "}
                  <span className="font-medium capitalize text-foreground">
                    {analysis.dominant_label}
                  </span>{" "}
                  · mean compound {analysis.mean_compound.toFixed(2)} ·{" "}
                  {analysis.languages_detected} language(s) · saved{" "}
                  {new Date(analysis.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnalysisCSV(analysis)}
                  title="Download one row per text as CSV"
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnalysisJSON(analysis, topics)}
                  title="Download the full analysis (plus topics if run) as JSON"
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnalysisPDF()}
                  title="Open the browser print dialog — pick 'Save as PDF'"
                >
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold">Topic modelling</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cluster the original texts into topics with BERTopic, then
                    overlay the per-row sentiment lean.
                  </p>
                </div>
                <div className="flex items-end gap-3 print:hidden">
                  <label className="text-sm">
                    <span className="block text-muted-foreground">
                      Target topics
                    </span>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={nTopics}
                      onChange={(e) =>
                        setNTopics(
                          Math.max(2, Math.min(20, Number(e.target.value) || 6))
                        )
                      }
                      className="mt-1 w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </label>
                  <Button onClick={runTopics} disabled={topicsLoading}>
                    {topicsLoading ? "Modelling…" : "Run topic model"}
                  </Button>
                </div>
              </div>

              {topicsError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {topicsError}
                </div>
              )}

              {topics && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Backend: <span className="font-mono">{topics.backend}</span>{" "}
                    · {topics.topic_count} topics ·{" "}
                    {topics.assigned_documents}/{topics.total_documents} docs
                    assigned · {topics.outlier_documents} outliers
                  </p>

                  <TopicCharts topics={topics.topics} />

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {topics.topics.map((t) => (
                      <TopicCard key={t.id} topic={t} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function TopicCharts({ topics }: { topics: Topic[] }) {
  // Size chart: doc_count per topic, colored by dominant lean.
  const sizeData = useMemo(
    () =>
      topics.map((t) => ({
        name: truncateLabel(t.label),
        docs: t.doc_count,
        lean: t.dominant_label,
      })),
    [topics]
  );

  // Stacked chart: share of positive / neutral / negative within each topic.
  const stackData = useMemo(
    () =>
      topics.map((t) => ({
        name: truncateLabel(t.label),
        positive: Math.round((t.label_share.positive ?? 0) * 100),
        neutral: Math.round((t.label_share.neutral ?? 0) * 100),
        negative: Math.round((t.label_share.negative ?? 0) * 100),
      })),
    [topics]
  );

  if (topics.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="text-sm font-semibold">Topic size</h4>
        <p className="text-xs text-muted-foreground">
          Documents per topic, coloured by dominant sentiment lean.
        </p>
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sizeData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                fontSize={11}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number) => [`${value} docs`, "Size"]}
              />
              <Bar dataKey="docs" radius={[0, 4, 4, 0]}>
                {sizeData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={LEAN_COLORS[entry.lean] ?? LEAN_COLORS.neutral}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="text-sm font-semibold">Sentiment composition</h4>
        <p className="text-xs text-muted-foreground">
          Per-topic share of positive / neutral / negative documents.
        </p>
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stackData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                fontSize={11}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="positive"
                stackId="s"
                fill={LEAN_COLORS.positive}
              />
              <Bar dataKey="neutral" stackId="s" fill={LEAN_COLORS.neutral} />
              <Bar
                dataKey="negative"
                stackId="s"
                fill={LEAN_COLORS.negative}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function truncateLabel(label: string, max = 22): string {
  if (label.length <= max) return label;
  return label.slice(0, max - 1) + "…";
}

function TopicCard({ topic }: { topic: Topic }) {
  const pos = topic.label_share.positive ?? 0;
  const neu = topic.label_share.neutral ?? 0;
  const neg = topic.label_share.negative ?? 0;

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-semibold">{topic.label}</h4>
        <span
          className={`text-xs uppercase tracking-wide ${leanColor(topic.dominant_label)}`}
        >
          {topic.dominant_label}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {topic.doc_count} docs · {(topic.share * 100).toFixed(0)}% of corpus ·
        mean {topic.mean_compound.toFixed(2)}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {topic.keywords.slice(0, 8).map((k) => (
          <span
            key={k}
            className="rounded-full border border-border bg-background px-2 py-0.5 text-xs"
          >
            {k}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-green-500"
            style={{ width: `${pos * 100}%` }}
            title={`Positive ${(pos * 100).toFixed(0)}%`}
          />
          <div
            className="bg-gray-400"
            style={{ width: `${neu * 100}%` }}
            title={`Neutral ${(neu * 100).toFixed(0)}%`}
          />
          <div
            className="bg-red-500"
            style={{ width: `${neg * 100}%` }}
            title={`Negative ${(neg * 100).toFixed(0)}%`}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>+ {(pos * 100).toFixed(0)}%</span>
          <span>= {(neu * 100).toFixed(0)}%</span>
          <span>− {(neg * 100).toFixed(0)}%</span>
        </div>
      </div>

      {topic.samples.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Sample texts ({topic.samples.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {topic.samples.map((s, i) => (
              <li
                key={i}
                className="rounded border border-border bg-background p-2 text-xs"
              >
                <span className={`mr-2 font-medium ${leanColor(s.label)}`}>
                  {s.label}
                </span>
                {s.text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function leanColor(label: string): string {
  switch (label) {
    case "positive":
      return "text-green-600";
    case "negative":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}
