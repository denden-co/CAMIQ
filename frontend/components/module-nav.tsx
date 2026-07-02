"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/components/command-palette";

const MODULES: { label: string; href: Route }[] = [
  { label: "Analysis", href: "/analyze" },
  { label: "Personas", href: "/personas" },
  { label: "Strategy", href: "/strategy" },
  { label: "Bias Audit", href: "/bias" },
  { label: "Countries", href: "/countries" },
];

/**
 * Module-to-module navigation for the top bar.
 * Current module is highlighted; hidden below md to keep the bar clean
 * on small screens (the ⌘K palette covers navigation there).
 */
export function ModuleNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Modules"
      className="hidden items-center gap-1 md:flex"
    >
      {MODULES.map((mod) => {
        const current = pathname.startsWith(mod.href);
        return (
          <Link
            key={mod.href}
            href={mod.href}
            aria-current={current ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              current
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mod.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Small button that opens the global command palette. */
export function PaletteButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      aria-label="Open command palette"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <Search className="h-3.5 w-3.5" strokeWidth={2} />
      <kbd className="text-[10px]">⌘K</kbd>
    </button>
  );
}
