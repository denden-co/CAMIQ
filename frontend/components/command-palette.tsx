"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Globe2,
  LayoutDashboard,
  Scale,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Event name used by buttons elsewhere in the app to open the palette. */
export const OPEN_PALETTE_EVENT = "camiq:open-palette";

interface PaletteItem {
  label: string;
  href: Route;
  Icon: LucideIcon;
  keywords: string;
}

const ITEMS: PaletteItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    Icon: LayoutDashboard,
    keywords: "home overview modules recent analyses",
  },
  {
    label: "Text Analysis",
    href: "/analyze",
    Icon: BarChart3,
    keywords: "sentiment analyse analyze batch csv upload single text",
  },
  {
    label: "Voter Personas",
    href: "/personas",
    Icon: Users,
    keywords: "persona segments audience llm generate",
  },
  {
    label: "AI Strategic Advisor",
    href: "/strategy",
    Icon: Sparkles,
    keywords: "strategy recommendations risk executive summary",
  },
  {
    label: "Bias & Fairness Audit",
    href: "/bias",
    Icon: Scale,
    keywords: "bias fairness audit chi-square language groups ethics",
  },
  {
    label: "Country Configuration",
    href: "/countries",
    Icon: Globe2,
    keywords: "countries elections parties electoral systems config",
  },
];

/**
 * Global ⌘K / Ctrl+K command palette.
 * Dependency-free: substring filtering, arrow-key navigation, Enter to go.
 * Mounted once in the root layout so it works on every page.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = ITEMS.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) || item.keywords.includes(q)
    );
  });

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (href: Route) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // Global shortcuts + open event
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActive(0);
      }
    }
    function onOpenEvent() {
      setOpen(true);
      setQuery("");
      setActive(0);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  // Focus the input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <button
        aria-label="Close command palette"
        className="absolute inset-0 bg-foreground/20"
        onClick={close}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-fade-in">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                go(results[active].href);
              }
            }}
            placeholder="Go to module…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            esc
          </kbd>
        </div>

        <ul className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches.
            </li>
          )}
          {results.map((item, i) => (
            <li key={item.href}>
              <button
                onClick={() => go(item.href)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                  i === active
                    ? "bg-accent-soft text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <item.Icon
                  className={`h-4 w-4 ${i === active ? "text-accent" : ""}`}
                  strokeWidth={1.75}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
