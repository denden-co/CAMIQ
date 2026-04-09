// Phase 3: client-side export helpers for saved analyses.
// CSV and JSON are direct blob downloads. PDF uses window.print() so
// there's no extra dependency — users pick "Save as PDF" in the print dialog.

import type { SavedAnalysis, TopicModelResponse } from "./api";

/** Download arbitrary text content as a file. */
export function downloadBlob(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the click so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Escape a single CSV cell per RFC 4180. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

/** Sanitise a name to a safe filename stem. */
export function safeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9_\- ]/gi, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "analysis";
}

/**
 * Flatten a saved analysis to a CSV: one row per original text, with its
 * sentiment result columns inline.
 */
export function analysisToCSV(analysis: SavedAnalysis): string {
  const header = [
    "row",
    "text",
    "label",
    "confidence",
    "compound",
    "positive",
    "neutral",
    "negative",
    "language_code",
    "language_name",
    "word_count",
    "character_count",
    "model",
    "top_phrases",
  ];

  const lines = [csvRow(header)];

  analysis.original_texts.forEach((text, i) => {
    const r = analysis.batch.results[i];
    if (!r) return;
    const topPhrases = r.key_phrases
      .slice(0, 5)
      .map((k) => `${k.phrase} (${k.weight.toFixed(2)})`)
      .join(" | ");
    lines.push(
      csvRow([
        i + 1,
        text,
        r.label,
        r.confidence.toFixed(3),
        r.scores.compound.toFixed(3),
        r.scores.positive.toFixed(3),
        r.scores.neutral.toFixed(3),
        r.scores.negative.toFixed(3),
        r.language?.code ?? "",
        r.language?.name ?? "",
        r.word_count,
        r.character_count,
        r.model,
        topPhrases,
      ]),
    );
  });

  return lines.join("\n");
}

/**
 * Bundle the full analysis plus (optional) topic model output as JSON.
 * Includes a small metadata header so downstream consumers know the version.
 */
export function analysisToJSON(
  analysis: SavedAnalysis,
  topics: TopicModelResponse | null,
): string {
  const payload = {
    _meta: {
      exported_at: new Date().toISOString(),
      exporter: "CampaignIQ frontend",
      version: 1,
    },
    analysis,
    topics,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportAnalysisCSV(analysis: SavedAnalysis): void {
  const csv = analysisToCSV(analysis);
  downloadBlob(csv, `${safeFilename(analysis.name)}.csv`, "text/csv;charset=utf-8");
}

export function exportAnalysisJSON(
  analysis: SavedAnalysis,
  topics: TopicModelResponse | null,
): void {
  const json = analysisToJSON(analysis, topics);
  downloadBlob(
    json,
    `${safeFilename(analysis.name)}.json`,
    "application/json;charset=utf-8",
  );
}

/**
 * Print-to-PDF: triggers the browser print dialog. Combined with the
 * `print:hidden` / `print:block` utility classes on the page, this gives a
 * clean PDF with charts and topic cards visible but controls hidden.
 */
export function exportAnalysisPDF(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
