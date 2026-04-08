"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCountry } from "@/lib/country-context";
import {
  getCountry,
  ELECTORAL_SYSTEM_LABELS,
  type CountryProfile,
} from "@/lib/api";
import { CountryPicker } from "@/components/country-picker";

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
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold">
            CampaignIQ
          </Link>
          <div className="flex items-center gap-4">
            <CountryPicker />
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">Country Configuration</h1>
        <p className="mt-2 text-muted-foreground">
          Parties, electoral system, and language settings for the currently
          selected country. Drop a new JSON file into{" "}
          <code>api/configs/countries/</code> to add more.
        </p>

        {loading && (
          <p className="mt-8 text-muted-foreground">Loading profile…</p>
        )}

        {error && (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Failed to load country profile</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs">
              Make sure the FastAPI backend is running at{" "}
              <code>http://localhost:8000</code>.
            </p>
          </div>
        )}

        {profile && !loading && <Profile profile={profile} />}
      </section>
    </main>
  );
}

function Profile({ profile }: { profile: CountryProfile }) {
  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-lg border border-border bg-background p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{profile.country}</h2>
            <p className="text-muted-foreground">{profile.election_name}</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            {profile.election_type}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Electoral system" value={ELECTORAL_SYSTEM_LABELS[profile.electoral_system]} />
          <Stat label="Date" value={profile.date} />
          <Stat
            label="Languages"
            value={profile.languages.join(", ").toUpperCase()}
          />
          <Stat
            label={
              profile.total_electoral_votes ? "Electoral votes" : "Constituencies"
            }
            value={
              profile.total_electoral_votes
                ? `${profile.total_electoral_votes} (win: ${profile.winning_threshold})`
                : profile.total_constituencies?.toString() ?? "—"
            }
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Parties ({profile.parties.length})
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.parties.map((party) => (
            <div
              key={party.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4"
            >
              <div
                className="h-10 w-2 flex-shrink-0 rounded"
                style={{ background: party.colour }}
                aria-hidden
              />
              <div>
                <p className="font-medium">{party.name}</p>
                <p className="text-xs text-muted-foreground">{party.short}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {profile.disclaimers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Disclaimers
          </h3>
          <ul className="mt-4 space-y-2">
            {profile.disclaimers.map((d, i) => (
              <li
                key={i}
                className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.sentiment_models_recommended.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recommended models
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.sentiment_models_recommended.map((m) => (
              <span
                key={m}
                className="rounded-md border border-border bg-muted px-3 py-1 text-sm"
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
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
