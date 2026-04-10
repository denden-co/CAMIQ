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
import { Spinner } from "@/components/spinner";
import {
  getAnalysis,
  getAnalysisTopics,
  getBiasAudit,
  type BiasAuditResponse,
  type FairnessFlag,
  type FairnessVerdict,
  type LanguageGroupStats,
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
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#ef4444",
};

export default function SavedAnalysisPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [topics, setTopics] = useState<TopicModelResponse | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [nTopics, setNTopics] = useState<number>(6);

  const [bias, setBias] = useState<BiasAuditResponse | null>(null);
  const [biasLoading, setBiasLoading] = useState(false);
  const [biasError, setBiasError] = useState<string | null>(null);
  const [minGroupSize, setMinGroupSize] = useState<number>(5);

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

  async function runBias() {
    if (!id) return;
    setBiasLoading(true);
    setBiasError(null);
    try {
      const result = await getBiasAudit(id, { min_group_size: minGroupSize });
      setBias(result);
    } catch (err) {
      setBiasError(
        err instanceof Error ? err.message : "Bias audit failed."
      );
    } finally {
      setBiasLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="nav-bar sticky top-0 z-40 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            Campaign<span className="text-gradient">IQ</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-muted-foreground transition hover:text-foreground sm:text-sm"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {analysisError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {analysisError}
          </div>
        )}

        {!analysis && !analysisError && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading analysis…
          </div>
        )}

        {analysis && (
          <>
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {analysis.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysis.total} rows · dominant{" "}
                  <span className="stat-badge bg-primary/10 text-primary capitalize">
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
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnalysisJSON(analysis, topics)}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnalysisPDF()}
                >
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Topic modelling section */}
            <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Topic modelling
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cluster texts into topics with BERTopic, then overlay
                    per-row sentiment lean.
                  </p>
                </div>
                <div className="flex items-end gap-3 print:hidden">
                  <label className="text-sm">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Target topics
                    </span>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={nTopics}
                      onChange={(e) =>
                        setNTopics(
                          Math.max(
                            2,
                            Math.min(20, Number(e.target.value) || 6)
                          )
                        )
                      }
                      className="input-refined w-20"
                    />
                  </label>
                  <Button onClick={runTopics} disabled={topicsLoading}>
                    {topicsLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" /> Modelling…
                      </span>
                    ) : (
                      "Run topic model"
                    )}
                  </Button>
                </div>
              </div>

              {topicsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {topicsError}
                </div>
              )}

              {topics && (
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground">
                    Backend:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                      {topics.backend}
                    </code>{" "}
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

            {/* Bias audit section */}
            <div className="mt-6 rounded-xl border border-border/60 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Bias & fairness audit
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Inspect how the sentiment model treats different language
                    groups. 4/5ths rule + chi-square + corpus-skew.
                  </p>
                </div>
                <div className="flex items-end gap-3 print:hidden">
                  <label className="text-sm">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Min group size
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={minGroupSize}
                      onChange={(e) =>
                        setMinGroupSize(
                          Math.max(
                            1,
                            Math.min(100, Number(e.target.value) || 5)
                          )
                        )
                      }
                      className="input-refined w-20"
                    />
                  </label>
                  <Button onClick={runBias} disabled={biasLoading}>
                    {biasLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" /> Auditing…
                      </span>
                    ) : (
                      "Run audit"
                    )}
                  </Button>
                </div>
              </div>

              {biasError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {biasError}
                </div>
              )}

              {bias && <BiasAuditView audit={bias} />}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

// ── Bias Audit ───────────────────────────────────────────

const VERDICT_STYLES: Record<
  FairnessVerdict,
  { label: string; className: string }
> = {
  green: {
    label: "Green — no major fairness concerns",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  yellow: {
    label: "Yellow — warnings found, review recommended",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  red: {
    label: "Red — alerts raised, results may be unfair",
    className: "bg-red-50 text-red-800 border-red-200",
  },
};

const SEVERITY_STYLES: Record<FairnessFlag["severity"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  alert: "border-red-200 bg-red-50 text-red-800",
};

function BiasAuditView({ audit }: { audit: BiasAuditResponse }) {
  const verdict = VERDICT_STYLES[audit.verdict];

  const confData = useMemo(
    () =>
      audit.language_groups
        .filter((g) => !g.small_sample)
        .map((g) => ({
          name: g.code,
          confidence: Math.round(g.mean_confidence * 100),
        })),
    [audit.language_groups]
  );

  const sizeData = useMemo(
    () => audit.language_groups.map((g) => ({ name: g.code, n: g.n })),
    [audit.language_groups]
  );

  return (
    <div className="mt-6 space-y-5">
      <div
        className={`rounded-xl border px-4 py-3 text-sm font-semibold ${verdict.className}`}
      >
        {verdict.label}
      </div>

      <p className="text-xs text-muted-foreground">
        {audit.total_rows} rows · {audit.languages_detected} language(s) · min
        group size = {audit.min_group_size}
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <h4 className="text-sm font-bold">Rows per language</h4>
          <p className="text-xs text-muted-foreground">
            Count of rows in each detected language group.
          </p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sizeData}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="n" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <h4 className="text-sm font-bold">Mean confidence (eligible)</h4>
          <p className="text-xs text-muted-foreground">
            Mean model confidence per language, for groups with n ≥{" "}
            {audit.min_group_size}.
          </p>
          <div className="mt-3 h-56 w-full">
            {confData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={confData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number) => [`${value}%`, "Mean conf."]}
                  />
                  <Bar
                    dataKey="confidence"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="p-4 text-xs text-muted-foreground">
                No language group meets the minimum size threshold.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label="4/5ths rule">
          {audit.confidence_disparity.disparity_ratio !== null ? (
            <>
              <div className="text-2xl font-bold">
                {audit.confidence_disparity.disparity_ratio.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {audit.confidence_disparity.min_group} vs{" "}
                {audit.confidence_disparity.max_group} ·{" "}
                {audit.confidence_disparity.passes_four_fifths
                  ? "passes"
                  : "fails"}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Not computable.</p>
          )}
        </StatCard>

        <StatCard label="Chi-square (label ⟂ lang)">
          {audit.chi_square.computable && audit.chi_square.chi2 !== null ? (
            <>
              <div className="text-2xl font-bold">
                χ² = {audit.chi_square.chi2.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                dof {audit.chi_square.dof}
                {audit.chi_square.p_value !== null && (
                  <> · p = {audit.chi_square.p_value.toFixed(4)}</>
                )}
                {audit.chi_square.significant !== null && (
                  <>
                    {" · "}
                    {audit.chi_square.significant
                      ? "significant"
                      : "not significant"}
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {audit.chi_square.reason ?? "Not computable."}
            </p>
          )}
        </StatCard>

        <StatCard label="Corpus skew">
          <div className="text-2xl font-bold capitalize">
            {audit.corpus_skew.dominant_label}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {(audit.corpus_skew.dominant_share * 100).toFixed(0)}% of rows ·{" "}
            {audit.corpus_skew.skew_flag ? "skewed" : "balanced"}
          </p>
        </StatCard>
      </div>

      {/* Language groups table */}
      <div>
        <h4 className="mb-3 text-sm font-bold text-foreground">
          Language groups
        </h4>
        <div className="overflow-x-auto rounded-xl border border-border/60 shadow-soft">
          <table className="table-premium w-full">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th className="text-right">n</th>
                <th className="text-right">Share</th>
                <th className="text-right">Mean conf.</th>
                <th className="text-right">Mean comp.</th>
                <th className="text-right">+</th>
                <th className="text-right">=</th>
                <th className="text-right">−</th>
              </tr>
            </thead>
            <tbody>
              {audit.language_groups.map((g) => (
                <LanguageRow key={g.code} group={g} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fairness flags */}
      <div>
        <h4 className="mb-3 text-sm font-bold text-foreground">
          Fairness flags ({audit.flags.length})
        </h4>
        {audit.flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No fairness concerns were raised on this batch.
          </p>
        ) : (
          <ul className="space-y-2">
            {audit.flags.map((f) => (
              <li
                key={f.code}
                className={`rounded-xl border px-4 py-3 text-sm ${SEVERITY_STYLES[f.severity]}`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {f.severity}
                </span>{" "}
                · <span className="font-semibold">{f.code}</span> — {f.message}
              </li>
            ))}
          </ul>
        )}
      </div>
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
    <div className="rounded-xl border border-border/60 bg-white p-5 shadow-soft">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LanguageRow({ group }: { group: LanguageGroupStats }) {
  const pos = group.label_share.positive ?? 0;
  const neu = group.label_share.neutral ?? 0;
  const neg = group.label_share.negative ?? 0;
  return (
    <tr className={group.small_sample ? "opacity-60" : ""}>
      <td className="font-mono text-xs">{group.code}</td>
      <td>
        {group.name}
        {group.small_sample && (
          <span className="stat-badge ml-2 bg-amber-100 text-amber-800 text-[10px]">
            small
          </span>
        )}
      </td>
      <td className="text-right">{group.n}</td>
      <td className="text-right">{(group.share * 100).toFixed(0)}%</td>
      <td className="text-right font-mono text-xs">
        {group.mean_confidence.toFixed(2)}
      </td>
      <td className="text-right font-mono text-xs">
        {group.mean_compound.toFixed(2)}
      </td>
      <td className="text-right text-emerald-600">
        {(pos * 100).toFixed(0)}%
      </td>
      <td className="text-right text-muted-foreground">
        {(neu * 100).toFixed(0)}%
      </td>
      <td className="text-right text-red-500">{(neg * 100).toFixed(0)}%</td>
    </tr>
  );
}

// ── Topic Charts ─────────────────────────────────────────

function TopicCharts({ topics }: { topics: Topic[] }) {
  const sizeData = useMemo(
    () =>
      topics.map((t) => ({
        name: truncateLabel(t.label),
        docs: t.doc_count,
        lean: t.dominant_label,
      })),
    [topics]
  );

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
    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <h4 className="text-sm font-bold">Topic size</h4>
        <p className="text-xs text-muted-foreground">
          Documents per topic, coloured by dominant sentiment.
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

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <h4 className="text-sm font-bold">Sentiment composition</h4>
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
    <div className="rounded-xl border border-border/60 bg-white p-5 shadow-soft transition-all hover:shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-bold text-foreground">{topic.label}</h4>
        <span
          className={`stat-badge capitalize ${
            topic.dominant_label === "positive"
              ? "bg-emerald-100 text-emerald-800"
              : topic.dominant_label === "negative"
              ? "bg-red-100 text-red-800"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {topic.dominant_label}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {topic.doc_count} docs · {(topic.share * 100).toFixed(0)}% of corpus ·
        mean {topic.mean_compound.toFixed(2)}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {topic.keywords.slice(0, 8).map((k) => (
          <span
            key={k}
            className="rounded-lg border border-primary/10 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {k}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="bg-emerald-500"
            style={{ width: `${pos * 100}%` }}
            title={`Positive ${(pos * 100).toFixed(0)}%`}
          />
          <div
            className="bg-slate-400"
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
          <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline">
            Sample texts ({topic.samples.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {topic.samples.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-xs"
              >
                <span
                  className={`mr-2 font-semibold ${leanColor(s.label)}`}
                >
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
      return "text-emerald-600";
    case "negative":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}
