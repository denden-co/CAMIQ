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
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/dashboard" className="text-lg font-bold sm:text-xl shrink-0">
          CampaignIQ
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          {children}
          {backLink && (
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              ← Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
