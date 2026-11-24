import { describe, expect, it } from "vitest";
import { analysisToCSV, analysisToJSON, safeFilename } from "../export";
import type { SavedAnalysis } from "../api";

/** Minimal saved analysis with one tricky text (comma + quote + newline). */
function fixture(): SavedAnalysis {
  const result = {
    label: "negative" as const,
    confidence: 0.812,
    scores: { positive: 0.1, neutral: 0.2, negative: 0.7, compound: -0.6 },
    key_phrases: [{ phrase: "bills", weight: 1 }],
    language: { code: "en", name: "English", confidence: 0.99 },
    model: "vader-lexicon-3.3.2",
    word_count: 5,
    character_count: 30,
  };
  return {
    id: "abc123",
    name: 'Q4 "test", run',
    country_id: "uk",
    source: "paste",
    total: 1,
    dominant_label: "negative",
    mean_compound: -0.6,
    languages_detected: 1,
    created_at: "2026-11-24T10:00:00Z",
    batch: {
      results: [result],
      aggregate: {
        total: 1,
        label_counts: { positive: 0, neutral: 0, negative: 1 },
        label_share: { positive: 0, neutral: 0, negative: 1 },
        mean_compound: -0.6,
        language_counts: { en: 1 },
        top_phrases: [{ phrase: "bills", weight: 1 }],
      },
      model: "vader-lexicon-3.3.2",
    },
    original_texts: ['Bills, "again"\nrising'],
  } as SavedAnalysis;
}

describe("safeFilename", () => {
  it("strips unsafe characters and spaces", () => {
    expect(safeFilename('Q4 "test", run')).toBe("Q4_test_run");
  });
  it("falls back when nothing is left", () => {
    expect(safeFilename("???")).toBe("analysis");
  });
});

describe("analysisToCSV", () => {
  it("quotes cells containing commas, quotes or newlines (RFC 4180)", () => {
    const csv = analysisToCSV(fixture());
    const [header, row] = csv.split("\n").slice(0, 2);
    expect(header.startsWith("row,text,label")).toBe(true);
    // The text cell is quoted and inner quotes are doubled.
    expect(csv).toContain('"Bills, ""again""\nrising"');
    expect(row.startsWith("1,")).toBe(true);
  });
});

describe("analysisToJSON", () => {
  it("wraps the analysis with metadata and parses back", () => {
    const parsed = JSON.parse(analysisToJSON(fixture(), null));
    expect(parsed._meta.version).toBe(1);
    expect(parsed.analysis.id).toBe("abc123");
    expect(parsed.topics).toBeNull();
  });
});
