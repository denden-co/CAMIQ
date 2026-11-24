"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getHealth, type HealthResponse } from "@/lib/api";

/**
 * Shows a thin warning strip when the API reports a degraded backend
 * (e.g. VADER instead of XLM-RoBERTa, or topic modelling unavailable).
 * Silent when everything is healthy or the API cannot be reached — the
 * module pages already show their own "API unavailable" states.
 */
export function StatusBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        /* API down — module pages handle this case */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health || !health.degraded) return null;

  const notes: string[] = [];
  if (health.sentiment.degraded) {
    notes.push(
      `Sentiment is running on VADER (English lexicon), not the multilingual model${
        health.sentiment.reason ? ` — ${health.sentiment.reason}` : ""
      }.`
    );
  }
  if (!health.topics.available) {
    notes.push("Topic modelling is unavailable on this deployment.");
  } else if (health.topics.degraded) {
    notes.push("Topic modelling is using the TF-IDF fallback, not BERTopic.");
  }

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 text-amber-900"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2 px-5 py-2 text-xs sm:px-8">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <p>
          <span className="font-medium">Reduced accuracy mode.</span>{" "}
          {notes.join(" ")}
        </p>
      </div>
    </div>
  );
}
