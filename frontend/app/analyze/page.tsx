"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvUpload } from "@/components/csv-upload";
import { useCountry } from "@/lib/country-context";
import { Spinner } from "@/components/spinner";
import { PageShell } from "@/components/page-shell";
import {
  analyzeBatch,
  analyzeText,
  getDevUserEmail,
  saveAnalysis,
  type AnalysisSource,
  type AnalyzeResponse,
  type BatchAnalyzeResponse,
  type SentimentLabel,
} from "@/lib/api";

const SAMPLE =
  "The new housing policy is a bold step forward. Families finally have a reason to be hopeful, though some critics argue the plan doesn't go far enough on affordability.";

const BATCH_SAMPLE = [
  "The new housing policy is a bold step forward for families.",
  "This government has completely failed working people.",
  "Today's debate covered tax, immigration, and the NHS.",
  "La nouvelle politique du logement est une avancée bienvenue.",
  "El debate electoral fue largo y tocó varios temas económicos.",
  "Die Regierung hat die Wähler zutiefst enttäuscht.",
].join("\n");

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", fr: "🇫🇷", es: "🇪🇸", de: "🇩🇪", it: "🇮🇹",
  pt: "🇵🇹", ar: "🇸🇦", hi: "🇮🇳", nl: "🇳🇱", pl: "🇵🇱",
  ru: "🇷🇺", uk: "🇺🇦", "zh-cn": "🇨🇳", "zh-tw": "🇹🇼",
  ja: "🇯🇵", ko: "🇰🇷", tr: "🇹🇷", sv: "🇸🇪", da: "🇩🇰",
  fi: "🇫🇮", no: "🇳🇴", el: "🇬🇷", he: "🇮🇱", cs: "🇨🇿",
  hu: "🇭🇺", ro: "🇷🇴", id: "🇮🇩", vi: "🇻🇳", th: "🇹🇭",
  bn: "🇧🇩", ta: "🇮🇳", fa: "🇮🇷",
};

type Mode = "single" | "batch" | "csv";

export default function AnalyzePage() {
  const [mode, setMode] = useState<Mode>("single");
  const { selected: country } = useCountry();

  return (
    <PageShell
      title="Text Analysis"
      subtitle="Paste any text — speech, tweet, manifesto — or upload a CSV. Multilingual sentiment, key phrases, and aggregate stats."
      Icon={BarChart3}
    >
      {/* Mode tabs */}
      <div className="inline-flex rounded-xl border border-border/60 bg-white p-1 shadow-soft">
        {(["single", "batch", "csv"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-5 sm:text-sm ${
              mode === m
                ? "btn-gradient shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {m === "single" ? "Single" : m === "batch" ? "Batch" : "CSV"}
          </button>
        ))}
      </div>

      {mode === "single" && <SingleMode />}
      {mode === "batch" && (
        <BatchMode countryId={country?.id ?? null} source="paste" />
      )}
      {mode === "csv" && <CsvMode countryId={country?.id ?? null} />}
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Single text mode
// ---------------------------------------------------------------------------

function SingleMode() {
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
    <>
      <form onSubmit={handleAnalyze} className="mt-6 space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here…"
          rows={10}
          className="input-refined !p-4 font-mono text-sm"
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading || !text.trim()}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Analysing…
              </span>
            ) : (
              "Analyse"
            )}
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

      {error && <ErrorCard error={error} />}
      {result && <SingleResults result={result} />}
    </>
  );
}

function SingleResults({ result }: { result: AnalyzeResponse }) {
  const labelColour =
    result.label === "positive"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : result.label === "negative"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="mt-8 space-y-5">
      {result.language && <LanguageChip language={result.language} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sentiment">
          <span
            className={`stat-badge border capitalize ${labelColour}`}
          >
            {result.label}
          </span>
        </StatCard>
        <StatCard label="Confidence">
          <span className="text-2xl font-bold text-foreground">
            {(result.confidence * 100).toFixed(1)}%
          </span>
        </StatCard>
        <StatCard label="Compound score">
          <span className="text-2xl font-bold text-foreground">
            {result.scores.compound.toFixed(3)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">(−1 to +1)</span>
        </StatCard>
      </div>

      <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Score breakdown
        </h3>
        <div className="mt-4 space-y-3">
          <ScoreBar label="Positive" value={result.scores.positive} colour="bg-emerald-500" />
          <ScoreBar label="Neutral" value={result.scores.neutral} colour="bg-slate-400" />
          <ScoreBar label="Negative" value={result.scores.negative} colour="bg-red-500" />
        </div>
      </div>

      {result.key_phrases.length > 0 && (
        <KeyPhrasesCard phrases={result.key_phrases} title="Key phrases" />
      )}

      <p className="text-xs text-muted-foreground">
        Model: <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{result.model}</code> · {result.word_count} words · {result.character_count} characters
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Batch mode
// ---------------------------------------------------------------------------

function BatchMode({
  countryId,
  source,
}: {
  countryId: string | null;
  source: AnalysisSource;
}) {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<BatchAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await analyzeBatch(lines);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleAnalyze} className="mt-6 space-y-4">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Paste one text per line — up to 500 rows…"
          rows={12}
          className="input-refined !p-4 font-mono text-sm"
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading || lines.length === 0}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Analysing {lines.length}…
              </span>
            ) : (
              `Analyse ${lines.length || ""} rows`
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRaw(BATCH_SAMPLE);
              setResult(null);
              setError(null);
            }}
          >
            Try multilingual sample
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {lines.length} non-empty rows · max 500
          </span>
        </div>
      </form>

      {error && <ErrorCard error={error} />}
      {result && (
        <BatchResults
          result={result}
          originalLines={lines}
          countryId={countryId}
          source={source}
          defaultName={`Batch ${new Date().toLocaleString()}`}
        />
      )}
    </>
  );
}

function CsvMode({ countryId }: { countryId: string | null }) {
  const [texts, setTexts] = useState<string[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [result, setResult] = useState<BatchAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAnalysis(
    ts: string[],
    meta: { filename: string; column: string }
  ) {
    setError(null);
    setResult(null);
    setTexts(ts);
    setFilename(meta.filename);
    setLoading(true);
    try {
      const r = await analyzeBatch(ts);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CsvUpload onColumnSelected={runAnalysis} />
      {loading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Analysing {texts?.length ?? 0} rows with XLM-RoBERTa…
        </p>
      )}
      {error && <ErrorCard error={error} />}
      {result && texts && (
        <BatchResults
          result={result}
          originalLines={texts}
          countryId={countryId}
          source="csv"
          defaultName={
            filename.replace(/\.csv$/i, "") ||
            `CSV ${new Date().toLocaleString()}`
          }
        />
      )}
    </>
  );
}

function BatchResults({
  result,
  originalLines,
  countryId,
  source,
  defaultName,
}: {
  result: BatchAnalyzeResponse;
  originalLines: string[];
  countryId: string | null;
  source: AnalysisSource;
  defaultName: string;
}) {
  const { aggregate } = result;
  const labels: SentimentLabel[] = ["positive", "neutral", "negative"];

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);
    const email = getDevUserEmail();
    if (!email) {
      setSaveError("Not signed in — sign in first to save analyses.");
      return;
    }
    const name = window.prompt("Name this analysis:", defaultName)?.trim();
    if (!name) return;
    setSaving(true);
    try {
      const saved = await saveAnalysis({
        name,
        country_id: countryId,
        source,
        original_texts: originalLines,
        batch: result,
      });
      setSaveMessage(`Saved as "${saved.name}" — visible on your dashboard.`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function handleExportCsv() {
    const rows = result.results.map((r, i) => ({
      row: i + 1,
      text: originalLines[i] ?? "",
      label: r.label,
      confidence: r.confidence.toFixed(4),
      compound: r.scores.compound.toFixed(4),
      positive: r.scores.positive.toFixed(4),
      neutral: r.scores.neutral.toFixed(4),
      negative: r.scores.negative.toFixed(4),
      language: r.language?.code ?? "",
      language_name: r.language?.name ?? "",
      model: r.model,
    }));
    const headers = Object.keys(rows[0] ?? { row: "" });
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => esc((r as Record<string, unknown>)[h]))
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaigniq-analysis-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-5">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-white px-5 py-4 shadow-soft">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save analysis"}
        </Button>
        <Button type="button" variant="outline" onClick={handleExportCsv}>
          Export CSV
        </Button>
        {saveMessage && (
          <span className="text-sm font-medium text-emerald-700">
            {saveMessage}
          </span>
        )}
        {saveError && (
          <span className="text-sm text-danger">{saveError}</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Texts analysed">
          <span className="text-2xl font-bold">{aggregate.total}</span>
        </StatCard>
        <StatCard label="Mean compound">
          <span className="text-2xl font-bold">
            {aggregate.mean_compound.toFixed(3)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">(−1..+1)</span>
        </StatCard>
        <StatCard label="Dominant label">
          <span className="text-lg font-bold capitalize">
            {labels.reduce((a, b) =>
              aggregate.label_counts[a] >= aggregate.label_counts[b] ? a : b
            )}
          </span>
        </StatCard>
        <StatCard label="Languages">
          <span className="text-lg font-bold">
            {Object.keys(aggregate.language_counts).length || "—"}
          </span>
        </StatCard>
      </div>

      {/* Label distribution */}
      <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Label distribution
        </h3>
        <div className="mt-4 space-y-3">
          <ScoreBar
            label="Positive"
            value={aggregate.label_share.positive ?? 0}
            colour="bg-emerald-500"
            suffix={`${aggregate.label_counts.positive ?? 0} rows`}
          />
          <ScoreBar
            label="Neutral"
            value={aggregate.label_share.neutral ?? 0}
            colour="bg-slate-400"
            suffix={`${aggregate.label_counts.neutral ?? 0} rows`}
          />
          <ScoreBar
            label="Negative"
            value={aggregate.label_share.negative ?? 0}
            colour="bg-red-500"
            suffix={`${aggregate.label_counts.negative ?? 0} rows`}
          />
        </div>
      </div>

      {/* Language mix */}
      {Object.keys(aggregate.language_counts).length > 0 && (
        <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Language mix
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(aggregate.language_counts)
              .sort(([, a], [, b]) => b - a)
              .map(([code, count]) => (
                <span
                  key={code}
                  className="rounded-full border border-border/50 bg-muted/60 px-3 py-1 text-sm"
                >
                  <span className="mr-1">{LANG_FLAGS[code] ?? "🌐"}</span>
                  <code className="text-xs">{code}</code> · {count}
                </span>
              ))}
          </div>
        </div>
      )}

      {aggregate.top_phrases.length > 0 && (
        <KeyPhrasesCard
          phrases={aggregate.top_phrases}
          title="Top phrases across batch"
        />
      )}

      {/* Per-text results */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-soft">
        <div className="border-b border-border/40 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Per-text results ({result.results.length})
          </h3>
        </div>
        <ul className="divide-y divide-border/40">
          {result.results.map((r, i) => (
            <li
              key={i}
              className="px-6 py-4 text-sm transition-colors hover:bg-primary/[0.02]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`stat-badge capitalize ${
                    r.label === "positive"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.label === "negative"
                      ? "bg-red-100 text-red-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {r.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(r.confidence * 100).toFixed(0)}% ·{" "}
                  {r.scores.compound.toFixed(2)}
                </span>
                {r.language && (
                  <span className="text-xs text-muted-foreground">
                    {LANG_FLAGS[r.language.code] ?? "🌐"} {r.language.code}
                  </span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 leading-relaxed text-foreground">
                {originalLines[i] ?? ""}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Model:{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
          {result.model}
        </code>{" "}
        · {aggregate.total} texts
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function LanguageChip({
  language,
}: {
  language: { code: string; name: string; confidence: number };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-full border border-border/50 bg-white px-3 py-1.5 shadow-soft">
        <span className="mr-1">{LANG_FLAGS[language.code] ?? "🌐"}</span>
        Detected: <strong>{language.name}</strong>{" "}
        <span className="text-muted-foreground">
          ({language.code}) · {(language.confidence * 100).toFixed(0)}%
          confidence
        </span>
      </span>
    </div>
  );
}

function KeyPhrasesCard({
  phrases,
  title,
}: {
  phrases: { phrase: string; weight: number }[];
  title: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {phrases.map((kp) => (
          <span
            key={kp.phrase}
            className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
            style={{ opacity: 0.5 + kp.weight * 0.5 }}
          >
            {kp.phrase}
          </span>
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ error }: { error: string }) {
  return (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-semibold">Analysis failed</p>
      <p className="mt-1">{error}</p>
      <p className="mt-2 text-xs text-red-500">
        Make sure the FastAPI backend is running at{" "}
        <code className="rounded bg-red-100 px-1 py-0.5">
          http://localhost:8000
        </code>
        .
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
    <div className="rounded-xl border border-border/60 bg-white p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
  suffix,
}: {
  label: string;
  value: number;
  colour: string;
  suffix?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {pct}%{suffix ? ` · ${suffix}` : ""}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full ${colour} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
