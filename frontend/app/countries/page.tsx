"use client";

import { useEffect, useState } from "react";
import { useCountry } from "@/lib/country-context";
import {
  getCountry,
  ELECTORAL_SYSTEM_LABELS,
  type CountryProfile,
} from "@/lib/api";
import { CountryPicker } from "@/components/country-picker";
import { PageShell } from "@/components/page-shell";
import { Spinner } from "@/components/spinner";

export default function CountriesPage() {
  const { selectedId } = useCountry();
  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCountry(selectedId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load country");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <PageShell
      title="Country Configuration"
      subtitle="Parties, electoral system, and language settings. Drop a JSON file into api/configs/countries/ to add more."
      icon="🌍"
      headerExtra={<CountryPicker />}
    >
      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Loading profile…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Failed to load country profile</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs text-red-500">
            Make sure the FastAPI backend is running at{" "}
            <code className="rounded bg-red-100 px-1 py-0.5">
              http://localhost:8000
            </code>
            .
          </p>
        </div>
      )}

      {profile && !loading && <Profile profile={profile} />}
    </PageShell>
  );
}

function Profile({ profile }: { profile: CountryProfile }) {
  return (
    <div className="space-y-6">
      {/* Country header card */}
      <div className="rounded-xl border border-border/60 bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {profile.country}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.election_name}
            </p>
          </div>
          <span className="stat-badge bg-primary/10 text-primary uppercase tracking-wider">
            {profile.election_type}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label="Electoral system"
            value={ELECTORAL_SYSTEM_LABELS[profile.electoral_system]}
          />
          <Stat label="Date" value={profile.date} />
          <Stat
            label="Languages"
            value={profile.languages.join(", ").toUpperCase()}
          />
          <Stat
            label={
              profile.total_electoral_votes
                ? "Electoral votes"
                : "Constituencies"
            }
            value={
              profile.total_electoral_votes
                ? `${profile.total_electoral_votes} (win: ${profile.winning_threshold})`
                : profile.total_constituencies?.toString() ?? "—"
            }
          />
        </div>
      </div>

      {/* Parties */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Parties ({profile.parties.length})
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.parties.map((party) => (
            <div
              key={party.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-white p-4 shadow-soft transition-all hover:shadow-card"
            >
              <div
                className="h-10 w-2 flex-shrink-0 rounded-full"
                style={{ background: party.colour }}
                aria-hidden
              />
              <div>
                <p className="font-semibold text-foreground">{party.name}</p>
                <p className="text-xs text-muted-foreground">{party.short}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      {profile.disclaimers.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Disclaimers
          </h3>
          <ul className="mt-3 space-y-2">
            {profile.disclaimers.map((d, i) => (
              <li
                key={i}
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended models */}
      {profile.sentiment_models_recommended.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended models
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.sentiment_models_recommended.map((m) => (
              <span
                key={m}
                className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
