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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCountries()
      .then((list) => {
        if (cancelled) return;
        setCountries(list);
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : null;
        const initial =
          (stored && list.find((c) => c.id === stored)?.id) ??
          list[0]?.id ??
          null;
        setSelectedIdState(initial);
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
  }, []);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const selected = countries.find((c) => c.id === selectedId) ?? null;

  return (
    <CountryContext.Provider
      value={{ countries, selectedId, selected, setSelectedId, loading, error }}
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
