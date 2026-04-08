// Tiny client for the CampaignIQ FastAPI backend.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface AnalyzeResponse {
  label: SentimentLabel;
  confidence: number;
  scores: {
    positive: number;
    neutral: number;
    negative: number;
    compound: number;
  };
  key_phrases: { phrase: string; weight: number }[];
  model: string;
  word_count: number;
  character_count: number;
}

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${body || res.statusText || "request failed"}`
    );
  }

  return (await res.json()) as AnalyzeResponse;
}
