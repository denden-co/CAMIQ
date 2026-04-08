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

// ---------------------------------------------------------------------------
// Phase 2 — saved analyses (file-backed persistence stub)
// ---------------------------------------------------------------------------

export type AnalysisSource = "paste" | "csv" | "api";

export interface SaveAnalysisRequest {
  name: string;
  country_id: string | null;
  source: AnalysisSource;
  original_texts: string[];
  batch: BatchAnalyzeResponse;
  user_email: string;
}

export interface AnalysisSummary {
  id: string;
  name: string;
  country_id: string | null;
  source: AnalysisSource;
  total: number;
  dominant_label: string;
  mean_compound: number;
  languages_detected: number;
  created_at: string;
}

export interface SavedAnalysis extends AnalysisSummary {
  batch: BatchAnalyzeResponse;
  original_texts: string[];
}

/** Read the dev-mock user email from localStorage. */
export function getDevUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("campaigniq_dev_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string };
    return parsed.email ?? null;
  } catch {
    return null;
  }
}

function authHeader(): Record<string, string> {
  const email = getDevUserEmail();
  return email ? { "X-User-Email": email } : {};
}

async function authedJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${body || res.statusText || "request failed"}`
    );
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export function saveAnalysis(
  payload: Omit<SaveAnalysisRequest, "user_email">
): Promise<SavedAnalysis> {
  const email = getDevUserEmail();
  if (!email) {
    return Promise.reject(
      new Error("Not signed in — can't save analyses.")
    );
  }
  return authedJson<SavedAnalysis>("/api/analyses", {
    method: "POST",
    body: JSON.stringify({ ...payload, user_email: email }),
  });
}

export function listAnalyses(): Promise<AnalysisSummary[]> {
  return authedJson<AnalysisSummary[]>("/api/analyses");
}

export function getAnalysis(id: string): Promise<SavedAnalysis> {
  return authedJson<SavedAnalysis>(`/api/analyses/${id}`);
}

export function deleteAnalysis(id: string): Promise<void> {
  return authedJson<void>(`/api/analyses/${id}`, { method: "DELETE" });
}
