"use client";

import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  /** Optional lucide icon component rendered in a bordered square before the title. */
  Icon?: LucideIcon;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

/**
 * Shared page shell — nav bar + page header for all module pages.
 * Clean minimal: monochrome surfaces, 1px borders, no gradients.
 */
export function PageShell({
  title,
  subtitle,
  Icon,
  children,
  headerExtra,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Top nav ─────────────────────────────────── */}
      <header className="nav-bar sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="logomark">C</span>
            <span className="text-[15px] font-semibold tracking-tight">
              CampaignIQ
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {headerExtra}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page header ─────────────────────────────── */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-8 sm:px-8 sm:py-10">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card">
              <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ─────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </div>
    </main>
  );
}
