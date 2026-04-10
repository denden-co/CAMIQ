"use client";

import Link from "next/link";

interface PageShellProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

/**
 * Shared page shell — nav bar + page header for all module pages.
 * Gives every page a consistent premium look.
 */
export function PageShell({
  title,
  subtitle,
  icon,
  children,
  headerExtra,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <header className="nav-bar sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight"
          >
            Campaign<span className="text-gradient">IQ</span>
          </Link>
          <div className="flex items-center gap-3">
            {headerExtra}
            <Link
              href="/dashboard"
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground sm:text-sm"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Page header */}
      <section className="border-b border-border/40 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </div>
    </main>
  );
}
