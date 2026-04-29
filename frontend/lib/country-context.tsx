"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { listCountries, type CountrySummary } from "@/lib/api";

interface CountryContextValue {
  countries: CountrySummary[];
  selectedId: string | null;
  selected: CountrySummary | null;
  setSelectedId: (id: string) => void;
  loading: boolean;
  error: string | null;
  /** Retry loading the country list. Resets error state and refetches. */
  refetch: () => void;
}

const STORAGE_KEY = "campaigniq_selected_country";

const CountryContext = createContext<CountryContextValue | undefined>(
  undefined
);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<CountrySummary[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Bumped by refetch() to trigger the loader effect. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCountries()
      .then((list) => {
        if (cancelled) return;
        setCountries(list);
        // Preserve current selection if still valid; otherwise prefer
        // localStorage; otherwise fall back to the first country.
        setSelectedIdState((prev) => {
          if (prev && list.find((c) => c.id === prev)) return prev;
          const stored =
            typeof window !== "undefined"
              ? localStorage.getItem(STORAGE_KEY)
              : null;
          return (
            (stored && list.find((c) => c.id === stored)?.id) ??
            list[0]?.id ??
            null
          );
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load countries");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const selected = countries.find((c) => c.id === selectedId) ?? null;

  return (
    <CountryContext.Provider
      value={{
        countries,
        selectedId,
        selected,
        setSelectedId,
        loading,
        error,
        refetch,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error("useCountry must be used within <CountryProvider>");
  }
  return ctx;
}
