"use client";

import Link from "next/link";

interface AppHeaderProps {
  /** Show "Back to dashboard" link (default: true) */
  backLink?: boolean;
  /** Right-side slot for extra controls like CountryPicker */
  children?: React.ReactNode;
}

export function AppHeader({ backLink = true, children }: AppHeaderProps) {
  return (
    <header className="nav-bar">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2"
        >
          <span className="logomark">C</span>
          <span className="text-[15px] font-semibold tracking-tight">
            CampaignIQ
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          {children}
          {backLink && (
            <Link
              href="/dashboard"
              className="whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              ← Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
