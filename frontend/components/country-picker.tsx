"use client";

import { RefreshCw } from "lucide-react";
import { useCountry } from "@/lib/country-context";

const FLAGS: Record<string, string> = {
  GB: "🇬🇧",
  US: "🇺🇸",
  FR: "🇫🇷",
  DE: "🇩🇪",
  IN: "🇮🇳",
  BR: "🇧🇷",
  CA: "🇨🇦",
  AU: "🇦🇺",
};

function flagFor(code: string): string {
  return FLAGS[code] ?? "🌐";
}

export function CountryPicker() {
  const { countries, selectedId, setSelectedId, loading, error, refetch } =
    useCountry();

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">Loading countries…</div>
    );
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={refetch}
        title={error}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
      >
        <RefreshCw className="h-3 w-3" strokeWidth={2} />
        Country service unavailable — retry
      </button>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">No countries configured</div>
    );
  }

  const selected = countries.find((c) => c.id === selectedId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg" aria-hidden>
        {selected ? flagFor(selected.country_code) : "🌐"}
      </span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Select country / election"
      >
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.country} — {c.election_name}
          </option>
        ))}
      </select>
    </div>
  );
}
