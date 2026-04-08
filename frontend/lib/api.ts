// Tiny client for the CampaignIQ FastAPI backend.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SentimentLabel = "positive" | "neutral" | "negative";

export type ElectoralSystem =
  | "fptp"
  | "pr"
  | "mmp"
  | "two_round"
  | "electoral_college"
  | "stv"
  | "other";

export interface Party {
  id: string;
  name: string;
  short: string;
  colour: string;
}

export interface CountrySummary {
  id: string;
  country: string;
  country_code: string;
  election_name: string;
  electoral_system: ElectoralSystem;
  date: string;
  party_count: number;
  primary_language: string;
}

export interface CountryProfile extends CountrySummary {
  election_type: string;
  languages: string[];
  parties: Party[];
  disclaimers: string[];
  sentiment_models_recommended: string[];
  total_constituencies: number | null;
  total_electoral_votes: number | null;
  winning_threshold: number | null;
}

export const ELECTORAL_SYSTEM_LABELS: Record<ElectoralSystem, string> = {
  fptp: "First Past the Post",
  pr: "Proportional Representation",
  mmp: "Mixed Member Proportional",
  two_round: "Two-Round System",
  electoral_college: "Electoral College",
  stv: "Single Transferable Vote",
  other: "Other",
};

export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: number;
}

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
  language: DetectedLanguage | null;
  model: string;
  word_count: number;
  character_count: number;
}

export interface BatchAnalyzeRequest {
  texts: string[];
}

export interface BatchAnalyzeAggregate {
  total: number;
  label_counts: Record<SentimentLabel, number>;
  label_share: Record<SentimentLabel, number>;
  mean_compound: number;
  language_counts: Record<string, number>;
  top_phrases: { phrase: string; weight: number }[];
}

export interface BatchAnalyzeResponse {
  results: AnalyzeResponse[];
  aggregate: BatchAnalyzeAggregate;
  model: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${body || res.statusText || "request failed"}`
    );
  }
  return (await res.json()) as T;
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

export async function analyzeBatch(
  texts: string[]
): Promise<BatchAnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${body || res.statusText || "request failed"}`
    );
  }

  return (await res.json()) as BatchAnalyzeResponse;
}

export function listCountries(): Promise<CountrySummary[]> {
  return get<CountrySummary[]>("/api/countries");
}

export function getCountry(id: string): Promise<CountryProfile> {
  return get<CountryProfile>(`/api/countries/${id}`);
}
