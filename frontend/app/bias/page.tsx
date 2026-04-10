"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import {
  getBiasAudit,
  listAnalyses,
  type AnalysisSummary,
  type BiasAuditResponse,
  type LanguageGroupStats,
  type FairnessFlag,
} from "@/lib/api";
import { Spinner } from "@/components/spinner";

const VERDICT_STYLES: Record<
  string,
  { bg: string; border: string; text: string; label: string; icon: string }
> = {
  green: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    label: "Green — No issues detected",
    icon: "✅",
  },
  yellow: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    label: "Yellow — Review recommended",
    icon: "⚠️",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    label: "Red — Significant disparities",
    icon: "🚨",
  },
};

const SEVERITY_ICON: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  alert: "🚨",
};

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export default function BiasAuditPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [minGroupSize, setMinGroupSize] = useState(5);
  const [audit, setAudit] = useState<BiasAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAnalyses()
      .then(setAnalyses)
      .catch(() => {})
      .finally(() => setAnalysesLoading(false));
  }, []);

  async function runAudit() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setAudit(null);
    try {
      const r = await getBiasAudit(selectedId, {
        min_group_size: minGroupSize,
      });
      setAudit(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Bias & Fairness Audit"
      subtitle="Detect confidence disparities and label-language dependence. Uses 4/5ths rule + chi-square independence test."
      icon="⚖️"
    >
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select analysis
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-refined"
          >
            <option value="">Choose…</option>
            {analyses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.total} rows · {a.languages_detected} lang
                {a.languages_detected > 1 ? "s" : ""})
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Min group size
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={minGroupSize}
            onChange={(e) => setMinGroupSize(Number(e.target.value))}
            className="input-refined"
          />
        </div>
        <Button
          onClick={runAudit}
          disabled={!selectedId || loading || analysesLoading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" /> Auditing…
            </span>
          ) : (
            "Run audit"
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {audit && <AuditResults audit={audit} />}
    </PageShell>
  );
}

function AuditResults({ audit }: { audit: BiasAuditResponse }) {
  const v = VERDICT_STYLES[audit.verdict] ?? VERDICT_STYLES.green;

  return (
    <div className="mt-8 space-y-5">
      {/* Verdict banner */}
      <div
        className={`rounded-xl ${v.bg} ${v.border} border p-5`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{v.icon}</span>
          <div>
            <h2 className={`text-lg font-bold ${v.text}`}>{v.label}</h2>
            <p className={`text-sm ${v.text} opacity-80`}>
              {audit.total_rows} rows · {audit.languages_detected} languages ·
              min group size: {audit.min_group_size}
            </p>
          </div>
        </div>
      </div>

      {/* Flags */}
      {audit.flags.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground">Fairness Flags</h3>
          <div className="mt-2 space-y-2">
            {audit.flags.map((f: FairnessFlag, i: number) => (
              <div
                key={i}
                className={`rounded-xl border p-4 text-sm ${
                  f.severity === "alert"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : f.severity === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                <span className="mr-2">
                  {SEVERITY_ICON[f.severity] ?? "ℹ️"}
                </span>
                <strong>{f.code}</strong> — {f.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Disparity */}
      <div>
        <h3 className="text-sm font-bold text-foreground">
          Confidence Parity (4/5ths Rule)
        </h3>
        <div className="mt-2 rounded-xl border border-border/60 bg-white p-5 shadow-soft">
          {audit.confidence_disparity.disparity_ratio != null ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Lowest confidence
                </p>
                <p className="mt-1 text-lg font-bold">
                  {audit.confidence_disparity.min_group?.toUpperCase()}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({pct(audit.confidence_disparity.min_mean_confidence!)})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Highest confidence
                </p>
                <p className="mt-1 text-lg font-bold">
                  {audit.confidence_disparity.max_group?.toUpperCase()}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({pct(audit.confidence_disparity.max_mean_confidence!)})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Disparity ratio
                </p>
                <p className="mt-1 text-lg font-bold">
                  {(
                    audit.confidence_disparity.disparity_ratio! * 100
                  ).toFixed(1)}
                  %{" "}
                  <span
                    className={`stat-badge ml-1 ${
                      audit.confidence_disparity.passes_four_fifths
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {audit.confidence_disparity.passes_four_fifths
                      ? "PASSES ≥ 80%"
                      : "FAILS < 80%"}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not enough language groups with sufficient data to compute.
            </p>
          )}
        </div>
      </div>

      {/* Chi-square */}
      <div>
        <h3 className="text-sm font-bold text-foreground">
          Chi-Square Independence Test
        </h3>
        <div className="mt-2 rounded-xl border border-border/60 bg-white p-5 shadow-soft">
          {audit.chi_square.computable ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  χ² statistic
                </p>
                <p className="mt-1 text-lg font-bold">
                  {audit.chi_square.chi2?.toFixed(3)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  p-value
                </p>
                <p className="mt-1 text-lg font-bold">
                  {audit.chi_square.p_value?.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Result
                </p>
                <p className="mt-1">
                  <span
                    className={`stat-badge ${
                      audit.chi_square.significant
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {audit.chi_square.significant
                      ? "DEPENDENT — labels vary by language"
                      : "INDEPENDENT — labels do not depend on language"}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {audit.chi_square.reason}
            </p>
          )}
        </div>
      </div>

      {/* Corpus Skew */}
      <div>
        <h3 className="text-sm font-bold text-foreground">Corpus Skew</h3>
        <div className="mt-2 rounded-xl border border-border/60 bg-white p-5 shadow-soft">
          <p className="text-sm">
            Dominant label:{" "}
            <strong className="capitalize">
              {audit.corpus_skew.dominant_label}
            </strong>{" "}
            at <strong>{pct(audit.corpus_skew.dominant_share)}</strong>
            {" — "}
            <span
              className={`stat-badge ml-1 ${
                audit.corpus_skew.skew_flag
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {audit.corpus_skew.skew_flag ? "SKEWED (> 70%)" : "Balanced"}
            </span>
          </p>
        </div>
      </div>

      {/* Language Groups Table */}
      <div>
        <h3 className="text-sm font-bold text-foreground">
          Language Group Breakdown
        </h3>
        <div className="mt-2 overflow-x-auto rounded-xl border border-border/60 bg-white shadow-soft">
          <table className="table-premium w-full">
            <thead>
              <tr>
                <th>Language</th>
                <th className="text-right">n</th>
                <th className="text-right">Share</th>
                <th className="text-right">Positive</th>
                <th className="text-right">Neutral</th>
                <th className="text-right">Negative</th>
                <th className="text-right">Mean Conf.</th>
                <th className="text-right">Mean Comp.</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {audit.language_groups.map((g: LanguageGroupStats) => (
                <tr
                  key={g.code}
                  className={g.small_sample ? "opacity-60" : ""}
                >
                  <td className="font-medium">
                    {g.name}{" "}
                    <span className="text-muted-foreground">({g.code})</span>
                  </td>
                  <td className="text-right">{g.n}</td>
                  <td className="text-right">{pct(g.share)}</td>
                  <td className="text-right">
                    {g.label_counts.positive ?? 0}
                  </td>
                  <td className="text-right">{g.label_counts.neutral ?? 0}</td>
                  <td className="text-right">
                    {g.label_counts.negative ?? 0}
                  </td>
                  <td className="text-right font-mono text-xs">
                    {(g.mean_confidence * 100).toFixed(1)}%
                  </td>
                  <td className="text-right font-mono text-xs">
                    {g.mean_compound.toFixed(3)}
                  </td>
                  <td className="text-center">
                    {g.small_sample ? (
                      <span className="stat-badge bg-amber-100 text-amber-700">
                        Small
                      </span>
                    ) : (
                      <span className="stat-badge bg-emerald-100 text-emerald-700">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
